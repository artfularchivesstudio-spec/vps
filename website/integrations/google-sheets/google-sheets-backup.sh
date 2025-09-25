#!/bin/bash

# Google Sheets Backup Script for Artful Archives
# This script syncs all data to Google Sheets for redundancy and easy access

echo "🚀 Starting Google Sheets backup at $(date)"

# Navigate to project directory
cd "$(dirname "$0")/.."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    exit 1
fi

# Check if Google Sheets credentials exist
if [ ! -f google-sheets-credentials.json ]; then
    echo "⚠️  WARNING: Google Sheets credentials not found. Skipping backup."
    echo "Please run the setup instructions in google-sheets-setup.md"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Run the backup
echo "📊 Syncing data to Google Sheets..."
npm run sheets:backup

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Google Sheets backup completed successfully!"
    echo "📅 Next backup will run automatically"

    # Optional: Send notification (uncomment and configure)
    # curl -X POST -H 'Content-type: application/json' \
    #      --data '{"text":"✅ Artful Archives Google Sheets backup completed"}' \
    #      YOUR_SLACK_WEBHOOK_URL

else
    echo "❌ Google Sheets backup failed!"

    # Optional: Send error notification
    # curl -X POST -H 'Content-type: application/json' \
    #      --data '{"text":"❌ Artful Archives Google Sheets backup failed"}' \
    #      YOUR_SLACK_WEBHOOK_URL

    exit 1
fi

echo "🎉 Backup process complete at $(date)"
