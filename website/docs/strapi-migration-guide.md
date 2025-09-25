# 🎭 Strapi Migration Guide for Artful Archives Studio

*"A mystical transformation from Supabase to Strapi, where content becomes spellbound by the curator's touch"*

## 📋 Overview

This guide documents the complete migration from Supabase to Strapi for the Artful Archives Studio platform. The new architecture simplifies content management while enhancing AI-powered workflows and multilingual capabilities.

## 🏗️ Architecture Overview

### Before (Supabase)
- **Backend**: Supabase PostgreSQL + Edge Functions
- **AI Integration**: Edge functions for OpenAI, Claude, ElevenLabs
- **Storage**: Supabase Storage for media files
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions

### After (Strapi)
- **Backend**: Strapi + PostgreSQL
- **AI Integration**: Direct API calls from Strapi (no edge functions)
- **Storage**: Strapi Media Library
- **Authentication**: Strapi Auth + JWT
- **Internationalization**: Built-in i18n with AI-powered translations

## 📁 Configuration Files Structure

```
config/strapi/
├── config.json              # Main Strapi configuration
├── content-types/           # Content type definitions
│   ├── article.json         # Blog post content type
│   ├── category.json        # Category taxonomy
│   ├── tag.json             # Tag taxonomy
│   └── seo.json             # SEO metadata component
├── components/              # Reusable components
│   └── seo.json             # SEO component configuration
├── i18n.json               # Internationalization settings
└── ai.json                 # AI service integration
```

## 🎯 Content Types

### 1. Article (Blog Post)
```json
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article",
    "description": "Blog posts with AI-generated content"
  },
  "options": {
    "draftAndPublish": true,
    "timestamps": true
  },
  "pluginOptions": {
    "i18n": {
      "localized": true
    }
  },
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title" },
    "excerpt": { "type": "text" },
    "content": { 
      "type": "richtext",
      "required": true
    },
    "featuredImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "gallery": {
      "type": "media",
      "multiple": true,
      "allowedTypes": ["images"]
    },
    "audioFile": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["files"]
    },
    "seo": {
      "type": "component",
      "repeatable": false,
      "component": "seo.seo"
    },
    "publishedAt": { "type": "datetime" }
  }
}
```

### 2. Category & Tag Taxonomies
```json
{
  "kind": "taxonomy",
  "collectionName": "categories",
  "info": {
    "singularName": "category",
    "pluralName": "categories",
    "displayName": "Category",
    "description": "Content categories"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {
    "i18n": {
      "localized": true
    }
  }
}
```

## 🌐 Internationalization

### Supported Languages
- **English** (en) - Default
- **Español** (es) - Spanish
- **हिन्दी** (hi) - Hindi

### i18n Configuration
```json
{
  "locales": [
    { "code": "en", "name": "English", "iso": "en-US" },
    { "code": "es", "name": "Español", "iso": "es-ES" },
    { "code": "hi", "name": "हिन्दी", "iso": "hi-IN" }
  ],
  "defaultLocale": "en",
  "settings": {
    "fallbackLocale": "en",
    "localeStructure": "/:locale",
    "forceLocale": false,
    "saveEmptyLocales": false
  }
}
```

## 🤖 AI Integration

### Service Configuration
```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "model": "gpt-4o-mini",
      "maxTokens": 2000,
      "temperature": 0.7
    },
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}",
      "model": "claude-3-sonnet-20240229"
    },
    "elevenlabs": {
      "apiKey": "${ELEVENLABS_API_KEY}",
      "voiceId": "21m00Tcm4TlvDq8ikWAM",
      "model": "eleven_multilingual_v2"
    }
  }
}
```

### Workflows
1. **Content Generation**: Image → Analysis → Blog Content → SEO
2. **Translation**: Content → SEO metadata in multiple languages
3. **Audio Enhancement**: Content optimization → Text-to-speech

## 🎨 Admin Interface

### Simplified 3-Step Wizard
1. **Upload**: Image selection and basic metadata
2. **AI Magic**: Automatic content generation and translation
3. **Publish**: Review and publish with one click

### Key Features
- **Auto-save**: Every 30 seconds
- **Offline support**: Queue actions when offline
- **Keyboard shortcuts**: Ctrl+S to save, Ctrl+→ for next step
- **Real-time preview**: See content as it's generated

## 🔧 Setup Instructions

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb artful_archives

# Set up environment variables
export DATABASE_PASSWORD="your_secure_password"
export OPENAI_API_KEY="your_openai_key"
export ANTHROPIC_API_KEY="your_anthropic_key"
export ELEVENLABS_API_KEY="your_elevenlabs_key"
```

### 2. Strapi Installation
```bash
# Install Strapi
npm install strapi --save

# Create Strapi project
npx create-strapi-app@latest artful-archives-studio --quickstart

# Copy configuration files
cp -r config/strapi/* ./config/
```

### 3. Content Types Import
```bash
# Import content types
strapi import --config config/strapi/content-types/article.json
strapi import --config config/strapi/content-types/category.json
strapi import --config config/strapi/content-types/tag.json
```

### 4. Plugin Configuration
```bash
# Install required plugins
strapi install i18n
strapi upload
strapi graphql
```

## 🚀 Deployment

### Development
```bash
# Start Strapi development server
npm run develop

# Access admin panel
# http://localhost:1337/admin
```

### Production
```bash
# Build Strapi
npm run build

# Start production server
npm run start
```

## 📊 API Endpoints

### Content API
```
GET    /api/articles              # List all articles
GET    /api/articles/:id          # Get single article
POST   /api/articles              # Create new article
PUT    /api/articles/:id          # Update article
DELETE /api/articles/:id          # Delete article

GET    /api/categories            # List categories
GET    /api/tags                  # List tags
```

### GraphQL
```
GET    /graphql                   # GraphQL endpoint
```

## 🔐 Security

### Authentication
- JWT-based authentication
- Role-based access control
- Protected admin routes

### File Upload
- File size limit: 10MB
- Allowed types: images, audio files
- Secure file storage

## 🎯 Benefits of Migration

### Technical Benefits
1. **Simplified Architecture**: No edge functions needed
2. **Better Performance**: Direct API calls to AI services
3. **Enhanced Admin Experience**: Intuitive 3-step wizard
4. **Built-in i18n**: Native multilingual support
5. **Scalable Media Management**: Strapi Media Library

### Content Benefits
1. **AI-Powered Workflows**: Automated content generation
2. **One-Click Translation**: Automatic translation to 3 languages
3. **Unified Voice**: Consistent "Spellbinding Museum Director" persona
4. **Audio Integration**: Seamless text-to-speech conversion
5. **SEO Optimization**: Built-in SEO metadata management

## 🔄 Migration Process

### Phase 1: Data Export (Supabase)
```sql
-- Export blog posts
COPY (SELECT * FROM blog_posts) TO '/tmp/blog_posts.csv' WITH CSV HEADER;

-- Export translations
COPY (SELECT * FROM content_translations) TO '/tmp/content_translations.csv' WITH CSV HEADER;

-- Export media assets
-- Use Supabase CLI or export tool
```

### Phase 2: Data Transformation
```javascript
// Transform Supabase data to Strapi format
const transformBlogPost = (supabasePost) => ({
  title: supabasePost.title,
  slug: supabasePost.slug,
  excerpt: supabasePost.excerpt,
  content: supabasePost.content,
  featuredImage: supabasePost.featured_image_url,
  publishedAt: supabasePost.published_at,
  locale: supabasePost.language || 'en'
});
```

### Phase 3: Data Import (Strapi)
```javascript
// Import to Strapi using API
const importArticle = async (articleData) => {
  const response = await fetch('/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(articleData)
  });
  return response.json();
};
```

## 🧪 Testing

### Unit Tests
```bash
# Test content type validation
npm test -- --testNamePattern="Article validation"

# Test AI integration
npm test -- --testNamePattern="AI service integration"
```

### E2E Tests
```bash
# Test complete workflow
npx playwright test --project=chromium tests/e2e/content-creation.spec.ts
```

## 📈 Monitoring

### Performance Metrics
- API response times
- Content generation duration
- Audio processing time
- User engagement metrics

### Error Tracking
- AI service errors
- File upload failures
- Translation errors
- Authentication issues

## 🎉 Next Steps

1. **Deploy to Production**: Set up Strapi on VPS
2. **Migrate Existing Content**: Export from Supabase, import to Strapi
3. **Update Frontend**: Replace Supabase API calls with Strapi
4. **Test End-to-End**: Validate complete user workflows
5. **Monitor Performance**: Set up analytics and monitoring

## 📞 Support

For questions or issues:
- **Documentation**: `/docs/strapi-migration-guide.md`
- **Configuration**: `/config/strapi/`
- **Admin Interface**: `http://localhost:1337/admin`

---

*"May this migration transform your content into spellbound masterpieces, curated by the mystical touch of the Spellbinding Museum Director."* ✨