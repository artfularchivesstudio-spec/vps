#!/bin/bash

# ==============================================
# 🗄️ SUPABASE DATABASE EXPORT SCRIPT
# ==============================================

set -e  # Exit on any error

# Configuration
EXPORT_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
DATABASE_URL="$SUPABASE_DATABASE_URL"
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
    mkdir -p "$EXPORT_DIR/database"
    mkdir -p "$EXPORT_DIR/logs"
}

# Export database schema
export_schema() {
    log_info "Exporting database schema..."

    # Export schema only (no data)
    pg_dump "$DATABASE_URL" \
        --schema-only \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        --verbose \
        --file="$EXPORT_DIR/database/schema.sql" \
        2>"$EXPORT_DIR/logs/schema_export.log"

    if [ $? -eq 0 ]; then
        log_success "Schema exported successfully"
    else
        log_error "Schema export failed"
        exit 1
    fi
}

# Export data (excluding large tables if needed)
export_data() {
    log_info "Exporting database data..."

    # Export all data
    pg_dump "$DATABASE_URL" \
        --data-only \
        --no-owner \
        --no-privileges \
        --verbose \
        --file="$EXPORT_DIR/database/data.sql" \
        2>"$EXPORT_DIR/logs/data_export.log"

    if [ $? -eq 0 ]; then
        log_success "Data exported successfully"
    else
        log_error "Data export failed"
        exit 1
    fi
}

# Export complete database (schema + data)
export_complete() {
    log_info "Exporting complete database..."

    pg_dump "$DATABASE_URL" \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        --verbose \
        --file="$EXPORT_DIR/database/complete.sql" \
        2>"$EXPORT_DIR/logs/complete_export.log"

    if [ $? -eq 0 ]; then
        log_success "Complete database exported successfully"
    else
        log_error "Complete database export failed"
        exit 1
    fi
}

# Export specific tables related to posts and audio
export_audio_related_tables() {
    log_info "Exporting audio-related tables..."

    # List of tables to export (customize based on your schema)
    TABLES=(
        "posts"
        "audio_files"
        "audio_jobs"
        "translations"
        "languages"
    )

    for table in "${TABLES[@]}"; do
        log_info "Exporting table: $table"

        pg_dump "$DATABASE_URL" \
            --table="$table" \
            --no-owner \
            --no-privileges \
            --verbose \
            --file="$EXPORT_DIR/database/${table}.sql" \
            2>"$EXPORT_DIR/logs/${table}_export.log"

        if [ $? -eq 0 ]; then
            log_success "Table $table exported successfully"
        else
            log_warning "Table $table export failed or table doesn't exist"
        fi
    done
}

# Create export summary
create_summary() {
    log_info "Creating export summary..."

    cat > "$EXPORT_DIR/export_summary.txt" << EOF
SUPABASE DATABASE EXPORT SUMMARY
================================

Export Date: $(date)
Project ID: $PROJECT_ID
Database URL: ${DATABASE_URL%:*}...

EXPORTED FILES:
$(ls -la "$EXPORT_DIR/database/")

LOGS:
$(ls -la "$EXPORT_DIR/logs/")

FILE SIZES:
$(du -sh "$EXPORT_DIR"/*)

NEXT STEPS:
1. Review exported files in $EXPORT_DIR
2. Run storage export script for audio files
3. Analyze data for language metadata issues
EOF

    log_success "Export summary created: $EXPORT_DIR/export_summary.txt"
}

# Main execution
main() {
    log_info "Starting Supabase database export..."
    log_info "Export directory: $EXPORT_DIR"

    create_export_dir
    export_schema
    export_data
    export_complete
    export_audio_related_tables
    create_summary

    log_success "Database export completed successfully!"
    log_info "Export location: $EXPORT_DIR"
    log_info "Total size: $(du -sh "$EXPORT_DIR" | cut -f1)"
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_error "SUPABASE_DATABASE_URL environment variable is not set"
    log_info "Please ensure your .env file is loaded or set the variable manually"
    exit 1
fi

# Run main function
main