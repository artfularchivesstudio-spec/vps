#!/bin/bash

# ==============================================
# 📦 SUPABASE STORAGE EXPORT SCRIPT
# ==============================================

set -e  # Exit on any error

# Configuration
EXPORT_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
SUPABASE_URL="$SUPABASE_URL"
SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
PROJECT_ID="artful-archives-website"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create export directory
create_export_dir() {
    log_info "Creating export directory: $EXPORT_DIR"
    mkdir -p "$EXPORT_DIR/storage/audio"
    mkdir -p "$EXPORT_DIR/storage/images"
    mkdir -p "$EXPORT_DIR/logs"
}

# Get storage buckets list
get_buckets() {
    log_info "Getting storage buckets..."

    # Use Supabase CLI to list buckets
    if command -v supabase &> /dev/null; then
        BUCKETS=$(supabase storage ls --project-ref "${SUPABASE_URL#https://}" | jq -r '.[]?.name' 2>/dev/null || echo "")
    else
        log_warning "Supabase CLI not available, using API fallback"
        BUCKETS=$(curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
            "$SUPABASE_URL/storage/v1/bucket" | jq -r '.[]?.name' 2>/dev/null || echo "")
    fi

    if [ -z "$BUCKETS" ]; then
        log_warning "Could not retrieve buckets list, using defaults"
        BUCKETS="audio images documents"
    fi

    log_info "Found buckets: $BUCKETS"
}

# Export files from a specific bucket
export_bucket() {
    local bucket_name="$1"
    local local_dir="$EXPORT_DIR/storage/$bucket_name"

    log_info "Exporting bucket: $bucket_name"

    mkdir -p "$local_dir"

    # Get list of files in bucket
    local files
    if command -v supabase &> /dev/null; then
        files=$(supabase storage ls "$bucket_name" --project-ref "${SUPABASE_URL#https://}" 2>/dev/null || echo "")
    else
        files=$(curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
            "$SUPABASE_URL/storage/v1/object/list/$bucket_name" | jq -r '.[]?.name' 2>/dev/null || echo "")
    fi

    if [ -z "$files" ]; then
        log_warning "No files found in bucket $bucket_name"
        return
    fi

    local file_count=0
    local success_count=0

    # Download each file
    echo "$files" | while IFS= read -r file_path; do
        if [ -n "$file_path" ] && [ "$file_path" != "null" ]; then
            ((file_count++))

            # Create subdirectories if needed
            local local_file_path="$local_dir/$file_path"
            mkdir -p "$(dirname "$local_file_path")"

            # Download file
            if curl -s -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
                "$SUPABASE_URL/storage/v1/object/$bucket_name/$file_path" \
                -o "$local_file_path" 2>/dev/null; then

                ((success_count++))
                log_info "Downloaded: $file_path"
            else
                log_warning "Failed to download: $file_path"
            fi
        fi
    done

    log_success "Bucket $bucket_name: $success_count/$file_count files downloaded"
}

# Export audio files specifically (focus on this for the task)
export_audio_files() {
    log_info "Exporting audio files..."

    # Try different common bucket names for audio
    AUDIO_BUCKETS=("audio" "audio-files" "media" "uploads")

    for bucket in "${AUDIO_BUCKETS[@]}"; do
        log_info "Checking bucket: $bucket"
        export_bucket "$bucket"
    done
}

# Export all storage buckets
export_all_buckets() {
    log_info "Exporting all storage buckets..."

    # Split buckets into array
    IFS=$'\n' read -r -d '' -a bucket_array <<< "$BUCKETS"

    for bucket in "${bucket_array[@]}"; do
        if [ -n "$bucket" ]; then
            export_bucket "$bucket"
        fi
    done
}

# Create storage export summary
create_storage_summary() {
    log_info "Creating storage export summary..."

    cat > "$EXPORT_DIR/storage_summary.txt" << EOF
SUPABASE STORAGE EXPORT SUMMARY
==============================

Export Date: $(date)
Project ID: $PROJECT_ID
Supabase URL: $SUPABASE_URL

STORAGE FILES:
$(find "$EXPORT_DIR/storage" -type f -exec ls -lh {} \; | head -20)

DIRECTORY STRUCTURE:
$(find "$EXPORT_DIR/storage" -type d | sort)

FILE COUNTS BY TYPE:
$(find "$EXPORT_DIR/storage" -type f | sed 's/.*\.//' | sort | uniq -c | sort -nr)

TOTAL SIZE:
$(du -sh "$EXPORT_DIR/storage")

AUDIO FILES FOUND:
$(find "$EXPORT_DIR/storage" -type f \( -iname "*.mp3" -o -iname "*.wav" -o -iname "*.m4a" -o -iname "*.aac" \) | wc -l) audio files

NEXT STEPS:
1. Review exported files in $EXPORT_DIR/storage
2. Run database export if not done already
3. Analyze audio files for language metadata issues
EOF

    log_success "Storage export summary created: $EXPORT_DIR/storage_summary.txt"
}

# Main execution
main() {
    log_info "Starting Supabase storage export..."
    log_info "Export directory: $EXPORT_DIR"

    create_export_dir
    get_buckets
    export_audio_files
    export_all_buckets
    create_storage_summary

    log_success "Storage export completed successfully!"
    log_info "Export location: $EXPORT_DIR"
    log_info "Total size: $(du -sh "$EXPORT_DIR/storage" | cut -f1)"
}

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    log_error "Required environment variables not set:"
    log_error "SUPABASE_URL: ${SUPABASE_URL:-NOT SET}"
    log_error "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_KEY:-NOT SET}"
    log_info "Please ensure your .env file is loaded"
    exit 1
fi

# Run main function
main