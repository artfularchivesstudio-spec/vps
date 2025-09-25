# Supabase Setup Documentation

**Date**: January 6, 2025  
**Status**: Project Created - Ready for Schema Migration  

## Project Details

### Remote Supabase Project
- **Project Name**: `artful-archives-studio`
- **Project ID**: `tjkpliasdjpgunbhsiza`
- **Region**: `us-east-1`
- **Organization**: `development` (ID: `ulloneqkajempegbsnuw`)
- **Dashboard URL**: https://supabase.com/dashboard/project/tjkpliasdjpgunbhsiza

### Database Configuration
- **Database Password**: `ArtfulStudio2025!` (stored in `.env.local`)
- **Connection String**: Available via Supabase dashboard
- **Public URL**: `https://tjkpliasdjpgunbhsiza.supabase.co`

## Environment Variables

The following environment variables have been added to `.env.local`:

```bash
# Supabase Configuration (AI Blog Creation Feature)
NEXT_PUBLIC_SUPABASE_URL=https://tjkpliasdjpgunbhsiza.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_PASSWORD=ArtfulStudio2025!

# AI API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Text-to-Speech
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

## Next Steps

1. **Get API Keys** from Supabase dashboard:
   - Navigate to Settings → API
   - Copy `anon` key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key to `SUPABASE_SERVICE_ROLE_KEY`

2. **Deploy Database Schema** using migration files

3. **Configure Storage Buckets**:
   - `images` - for uploaded artwork images
   - `audio` - for generated TTS files
   - `video` - for future video content
   - `documents` - for any document uploads

4. **Set up Row Level Security (RLS)** policies for admin access

## CLI Commands Used

```bash
# Initialize Supabase in project
supabase init

# Create remote project
supabase projects create artful-archives-studio \
  --org-id ulloneqkajempegbsnuw \
  --db-password "ArtfulStudio2025!" \
  --region us-east-1
```

## Security Notes

- Database password is stored in `.env.local` (gitignored)
- API keys will be obtained from Supabase dashboard
- Service role key should only be used server-side
- Anon key is safe for client-side use with RLS enabled

## Architecture Benefits

- **Unified Backend**: Single project for web and future mobile apps
- **Real-time Features**: Instant sync across all platforms
- **Scalable Storage**: Built-in CDN for global asset delivery
- **Authentication**: Ready-to-use auth system
- **Database**: PostgreSQL with advanced features