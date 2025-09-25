# Google Sheets Integration for Artful Archives

## Overview
This integration provides a simple, elegant Google Sheets setup for redundancy and easy data management of your blog posts, audio metadata, and content analytics.

## Features
- ✅ **Complete Data Backup**: All blog posts, audio jobs, and media assets
- ✅ **Real-time Sync**: Automated synchronization from Supabase to Google Sheets
- ✅ **Analytics Dashboard**: Performance metrics and insights
- ✅ **Easy Access**: No complex database queries needed
- ✅ **Collaboration Ready**: Share sheets with team members
- ✅ **Backup & Recovery**: Import data back to your system if needed

## Setup Instructions

### 1. Create Google Cloud Project & Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

4. Create a Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Give it a name like "artful-archives-sheets"
   - Create and download the JSON key file
   - Save it as `google-sheets-credentials.json` in your project root

### 2. Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new blank spreadsheet
3. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### 3. Configure Environment Variables

Add to your `.env` file:
```bash
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_CREDENTIALS_PATH=./google-sheets-credentials.json
```

### 4. Share the Sheet

Share your Google Sheet with the service account email (found in the credentials JSON file) with "Editor" permissions.

### 5. Install Dependencies

```bash
npm install googleapis
```

### 6. Initial Setup

```bash
# Initialize the Google Sheet with proper structure
node google-sheets-setup.js init
```

## Sheet Structure

### 1. Blog Posts Sheet
Contains all your blog posts with complete metadata:
- ID, Title, Slug, Excerpt, Status
- Workflow Stage, Created/Updated/Published dates
- Audio metadata (URLs, duration, languages)
- Categories, Tags, Word count, Reading time
- SEO fields, Featured images

### 2. Audio Jobs Sheet
Complete audio processing pipeline data:
- Job ID, Post ID, Input text, Status
- Processing details (chunks, errors)
- Language support (en, es, hi)
- Voice settings, Audio URLs, Cost estimates

### 3. Media Assets Sheet
All media files and their metadata:
- File details (type, size, dimensions)
- Origin source, Generation provider
- Transcripts, Alt text, Metadata
- Storage and performance info

### 4. Analytics Sheet
Performance metrics and insights:
- Daily statistics (posts, audio jobs, storage)
- Top categories and tags
- Language popularity, Error rates
- Processing times and costs

## Usage

### Sync Latest Data
```bash
node google-sheets-setup.js sync
```

### Import Data from Sheet (Backup Recovery)
```bash
node google-sheets-setup.js import "Blog Posts"
node google-sheets-setup.js import "Audio Jobs"
```

### Automate Sync (Cron Job)

Add to your crontab for daily sync:
```bash
# Daily sync at 2 AM
0 2 * * * cd /path/to/your/project && node google-sheets-setup.js sync
```

## Benefits

### 🔄 Redundancy
- Complete backup of all content and metadata
- Survives database outages or corruption
- Easy to restore data if needed

### 📊 Simplicity
- No complex database queries
- Visual data exploration
- Easy to share with team members
- Quick manual edits when needed

### 🤝 Collaboration
- Multiple team members can view/edit
- Real-time collaboration
- Easy to export for stakeholders

### 📈 Analytics
- Built-in charts and pivot tables
- Performance tracking over time
- Content strategy insights

## Security Notes

- The service account JSON file contains sensitive credentials
- Add `google-sheets-credentials.json` to `.gitignore`
- Only share the Google Sheet with authorized team members
- Consider using separate sheets for different environments (dev/staging/prod)

## Troubleshooting

### Common Issues

1. **"The caller does not have permission"**
   - Make sure the service account email has Editor access to the sheet
   - Verify the credentials JSON file is correct

2. **"Spreadsheet not found"**
   - Double-check the SPREADSHEET_ID in your environment variables
   - Ensure the sheet exists and is accessible

3. **"API has not been used"**
   - Make sure Google Sheets API is enabled in Google Cloud Console

4. **Empty results**
   - Check your Supabase credentials
   - Verify the database tables exist and have data

### Debug Mode

Add debug logging:
```javascript
// In google-sheets-setup.js
console.log('🔍 Debug: Supabase URL:', process.env.SUPABASE_URL);
console.log('🔍 Debug: Spreadsheet ID:', spreadsheetId);
```

## Advanced Features

### Custom Queries
Modify the export functions to add custom filters:
```javascript
// Only export published posts
const { data: posts, error } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('status', 'published')
  .order('created_at', { ascending: false });
```

### Automated Reports
Create custom analytics:
```javascript
// Monthly content creation report
const monthlyStats = await supabase
  .from('blog_posts')
  .select('created_at, status')
  .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
```

### Data Validation
Add data validation rules to your Google Sheet:
1. Status column: Dropdown with "draft", "published", "archived"
2. Language column: Validation for "en", "es", "hi"
3. Date columns: Date format validation

This Google Sheets integration provides the perfect balance of simplicity and functionality for managing your content data! 🎉📊
