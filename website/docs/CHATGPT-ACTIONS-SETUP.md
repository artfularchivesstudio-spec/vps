# 🤖 ChatGPT Actions Setup Guide

## 🚀 Quick Setup Summary

### **📋 What You Need:**
- **OpenAPI Spec**: `openapi-chatgpt-actions.yaml` (✅ Ready!)
- **API Key**: YOUR_EXTERNAL_ACTIONS_API_KEY
- **Base URL (Prod)**: `https://artful-archives-website-gsinghdevs-projects.vercel.app`
- **Base URL (Local)**: `http://localhost:3000`

---

## 🔧 Step-by-Step Configuration

### **Step 1: Access ChatGPT Actions**
1. Go to [ChatGPT](https://chatgpt.com)
2. Click on your profile → **My GPTs**
3. Click **Create a GPT** or edit your existing one

### **Step 2: Configure Basic Info**
```
Name: Artful Archives Studio Assistant
Description: AI-powered blog creation system with image analysis and audio generation
Instructions: You are an assistant for Artful Archives Studio, an AI-powered art blog platform. You can:
- Create and manage blog posts
- Analyze artwork and images for artistic insights
- Generate audio narrations for accessibility
- Help with content creation and SEO optimization

When users provide images, analyze them for artistic content and offer to create blog posts. When creating posts, always ask if they want audio narration generated.
```

### **Step 3: Import OpenAPI Schema**
1. Click **Configure** → **Actions**
2. Click **Create new action**
3. Either paste the contents of `openapi-chatgpt-actions.yaml`, or import via URL:
   - Recommended (auto-injects bypass token): `https://artful-archives-website-gsinghdevs-projects.vercel.app/api/openapi`
   - Static (no injection): `https://artful-archives-website-gsinghdevs-projects.vercel.app/openapi-chatgpt-actions.yaml`
4. Confirm the server base is the new domain and paths start with `/api/external`.
   - The schema includes the two required Vercel params (`x-vercel-protection-bypass`,
     `x-vercel-set-bypass-cookie=true`) at the operation level so Actions includes them.

> Security note: The `/api/openapi` endpoint injects the bypass token from the `VERCEL_PROTECTION_BYPASS`
> environment variable at render time, so the repo/spec never stores the secret. Rotate it if exposed,
> and consider excluding `/api/external` from Protection or using a separate unprotected domain for the API.

### **Step 4: Configure Authentication**
1. In the **Authentication** section, select:
   - **Authentication Type**: `API Key`
   - **API Key**: YOUR_EXTERNAL_ACTIONS_API_KEY
   - **Auth Type**: `Bearer`
   - **Header Name**: `Authorization`
   - This sends: `Authorization: Bearer <key>`

### **Step 5: Test the Integration**
Click **Test** and try these sample requests (these map to your Next.js API):

- List Posts (GET): `/api/external/posts?limit=3&status=draft`
- Create Post (POST): `/api/external/posts`
  ```json
  {
    "title": "Test Post from ChatGPT",
    "content": "This is a test post created via ChatGPT Actions!",
    "status": "draft",
    "origin_source": "openai"
  }
  ```
- Analyze Image (POST): `/api/external/ai/analyze-image`
  ```json
  {
    "image_data": "data:image/png;base64,...."
  }
  ```
- Generate Audio (POST): `/api/external/ai/generate-audio`
  ```json
  {
    "text": "A short narration to test audio.",
    "provider": "elevenlabs",
    "save_to_storage": false
  }
  ```

---

## 🎯 Available Actions (via Next.js API)

### **📝 Blog Management**
- **List posts**: `GET /api/external/posts`
- **Create post**: `POST /api/external/posts`

### **🖼️ AI Image Analysis**
- **Analyze image**: `POST /api/external/ai/analyze-image` (expects `image_data` base64 data URL)
- Optional: `analysis_type` (detailed|concise), `providers` (openai|claude)

### **🎤 Audio Generation**
- **Generate audio**: `POST /api/external/ai/generate-audio` (returns base64 MP3; can save to storage)
- **Check job status**: `GET /api/audio-job-status/{job_id}` (for long-running jobs started by the system)

Note: The heavy, multi-language audio job pipeline runs behind the scenes via workers/Edge Functions. ChatGPT only calls the gateway endpoints; the app orchestrates the rest.

---

## 💬 Example Conversations

### **Scenario 1: Image Analysis & Blog Creation**
```
User: [Uploads an image of a painting]
"Can you analyze this artwork and create a blog post about it?"

ChatGPT: I'll analyze this artwork for you and create a comprehensive blog post.

[Calls analyzeImage with the image URL]
[Reviews AI analysis from both OpenAI and Claude]
[Calls createPost with analyzed content]

"I've created a detailed blog post analyzing this artwork! The analysis covers composition, color theory, artistic techniques, and historical context. Would you like me to generate an audio narration for accessibility?"
```

### **Scenario 2: Content Creation with Audio**
```
User: "Create a blog post about Renaissance art techniques and add audio narration"

ChatGPT: I'll create a comprehensive blog post about Renaissance art techniques and generate an audio narration.

[Calls createPost with Renaissance art content]
[Calls generateAudio with the post content]

"I've created your blog post about Renaissance art techniques and generated a professional audio narration! The post is saved as a draft and ready for review."
```

### **Scenario 3: Content Management**
```
User: "Show me the latest blog posts and help me organize them"

ChatGPT: Let me retrieve your recent blog posts.

[Calls listPosts to get recent posts]

"Here are your latest blog posts:
1. 'Exploring Modern Art Techniques' (draft)
2. 'Renaissance Color Theory' (published)
3. 'Contemporary Sculpture Analysis' (draft)

Would you like me to help you edit any of these, publish drafts, or create new content?"
```

---

## 🔐 Security & Data Rules

### **✅ Authentication**
- Bearer token on every request (`Authorization: Bearer <key>`) per `src/lib/external-api/*`
- Scopes enforced where applicable (e.g., `posts:write`, `ai:analyze`, `ai:generate-audio`)

### **✅ Rate Limiting**
- Per-key rate limiting and request logging

### **✅ Data Validation & RLS**
- Input validation + error shaping handled in Next.js middleware
- Server-side Supabase client uses appropriate role; admin ops bypass RLS as needed (no secrets exposed to ChatGPT)

---

## 🚀 Advanced Features

### **Multi-AI Analysis**
- **OpenAI GPT-4o**: Technical analysis and composition
- **Claude 3.5 Sonnet**: Artistic interpretation and cultural context
- **Parallel processing**: Both analyses run simultaneously

### **Professional Audio**
- **ElevenLabs Integration**: High-quality text-to-speech
- **Voice Selection**: Multiple professional voices
- **Automatic Storage**: Audio files saved to cloud storage

### **SEO Optimization**
- **Auto-generated slugs**: URL-friendly post identifiers
- **Meta descriptions**: SEO-optimized descriptions
- **Content optimization**: AI-enhanced for search engines

---

## 🧪 Curl Testing (optional)

Replace `BASE_URL` and `API_KEY` accordingly.

```bash
# List posts
curl -s -H "Authorization: Bearer $API_KEY" \
  "$BASE_URL/api/external/posts?limit=3&status=draft"

# Create a post
curl -s -X POST -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{
    "title": "Test Post from Actions",
    "content": "Body from ChatGPT Actions",
    "status": "draft",
    "origin_source": "openai"
  }' \
  "$BASE_URL/api/external/posts"

# Analyze an image (use a real base64 data URL)
curl -s -X POST -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{
    "image_data": "data:image/png;base64,...."
  }' \
  "$BASE_URL/api/external/ai/analyze-image"

# Generate audio
curl -s -X POST -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{
    "text": "A short narration.",
    "provider": "elevenlabs",
    "save_to_storage": false
  }' \
  "$BASE_URL/api/external/ai/generate-audio"
```

---

## 🎉 You're Ready!

Once configured, your ChatGPT Assistant can:
- ✅ **Analyze artwork** (base64 image input)
- ✅ **Create blog posts** with proper `origin_source: "openai"`
- ✅ **Generate audio** or trigger the app’s long-running audio pipeline
- ✅ **Manage content** with pagination and filters
- ✅ **Respect RLS** via the gateway’s service-role logic

**Your AI-powered art blog creation system is now live!** 🚀✨ 
