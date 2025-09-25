# Post-merge checklist

After merging, make sure to:

## 🚀 Quick Deploy (Recommended)
Run the automated deployment script with enhanced logging and error handling:
```bash
# Full deployment
./scripts/post-merge-deploy.sh

# Or use npm scripts
npm run deploy

# Test what would be deployed (dry run)
npm run deploy:dry-run

# Get help
npm run deploy:help
```

## 🛠️ Manual Steps (if needed)
- Deploy Supabase Edge Functions (`supabase functions deploy --no-verify-jwt`)
- Deploy new database migrations (`supabase db push`)
- Deploy to Vercel (`vercel --prod`)
- Set up React Native environment (manual setup may be required)
- Run the full test suite (`npm test`)
- Any other required cleanup or verification steps

## 🎯 What the enhanced automated script does:
1. ✅ **Environment Validation** - Checks Node.js, npm, and project structure
2. ✅ **Dependency Verification** - Ensures Supabase CLI and Vercel CLI are installed
3. ✅ **Backup Creation** - Creates timestamped backup before deployment
4. ✅ **Deploys Supabase Edge Functions** - With authentication verification
5. ✅ **Deploys database migrations** - Pushes schema changes safely
6. ✅ **Deploys to Vercel** - Production deployment with build verification
7. ⚠️  **Checks React Native environment** - Manual setup may be required
8. ✅ **Runs full test suite** - Comprehensive testing before deployment
9. ✅ **Runs linting and build verification** - Code quality and compilation checks
10. ✅ **Rollback capability** - Automatic rollback on failure
11. ✅ **Comprehensive logging** - Color-coded progress with emojis and detailed status

## 🎨 Enhanced Features:
- **Color-coded output** with emojis for better visibility
- **Progress indicators** showing current step (e.g., "Step 3/6")
- **Error handling** with automatic rollback on failure
- **Backup system** with timestamped backups
- **Dry-run mode** to preview deployment steps
- **Help system** with usage instructions
- **Environment validation** before starting deployment
- **Comprehensive logging** with success/warning/error states

## 📋 Available npm Scripts:
```bash
npm run deploy          # Full deployment
npm run deploy:dry-run  # Preview deployment steps
npm run deploy:help     # Show help and usage
npm run pre-deploy      # Run lint, test, and build
npm run supabase:deploy # Deploy only Supabase components
npm run vercel:deploy   # Deploy only to Vercel
```

Keeping this enhanced checklist handy will help smooth out release day jitters with style and confidence! 🎉✨
