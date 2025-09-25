# API Usage Examples

This document provides practical examples of using the Artful Archives Studio External API for common workflows and use cases.

## Authentication

All API requests require authentication using a Bearer token:

```bash
curl -H "Authorization: Bearer your-api-key-here" \
     -H "Content-Type: application/json" \
     https://artfularchivesstudio.com/api/external/posts
```

## Complete Workflow Examples

### 1. Image Analysis to Published Post

This workflow demonstrates the complete process from artwork analysis to published blog post:

#### Step 1: Analyze Artwork Image

```bash
# Upload and analyze an image
curl -X POST \
  https://artfularchivesstudio.com/api/external/ai/analyze-image \
  -H "Authorization: Bearer your-api-key" \
  -F "image=@artwork.jpg"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis_type": "detailed",
    "providers_used": ["openai", "claude"],
    "claude": {
      "content": "This striking contemporary piece demonstrates masterful use of color theory...",
      "success": true
    },
    "openai": {
      "content": "The artwork showcases bold geometric forms with vibrant complementary colors...",
      "success": true
    },
    "suggested_title": "Contemporary Geometric Mastery",
    "suggested_slug": "contemporary-geometric-mastery"
  }
}
```

#### Step 2: Create Blog Post

```bash
# Create a blog post from the analysis
curl -X POST \
  https://artfularchivesstudio.com/api/external/posts \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Contemporary Geometric Mastery",
    "content": "This striking contemporary piece demonstrates masterful use of color theory...",
    "slug": "contemporary-geometric-mastery",
    "status": "draft",
    "origin_source": "claude"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Contemporary Geometric Mastery",
    "slug": "contemporary-geometric-mastery",
    "content": "This striking contemporary piece...",
    "status": "draft",
    "created_at": "2025-01-11T10:30:00Z"
  }
}
```

#### Step 3: Generate Audio Narration

```bash
# Generate audio narration
curl -X POST \
  https://artfularchivesstudio.com/api/external/ai/generate-audio \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This striking contemporary piece demonstrates masterful use of color theory...",
    "voice_id": "alloy"
    "provider": "openai",
    "save_to_storage": true,
    "title": "Contemporary Geometric Mastery - Audio"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "provider": "elevenlabs",
    "voice_id": "EXAVITQu4vr4xnSDxMaL",
    "estimated_duration_seconds": 125,
    "storage": {
      "saved": true,
      "media_asset_id": "789e0123-e89b-12d3-a456-426614174000",
      "file_url": "https://storage.supabase.co/audio/generated-audio.mp3"
    }
  }
}
```

#### Step 4: Associate Audio with Post

```bash
# Update post with audio reference
curl -X PUT \
  https://artfularchivesstudio.com/api/external/posts/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "primary_audio_id": "789e0123-e89b-12d3-a456-426614174000"
  }'
```

#### Step 5: Publish the Post

```bash
# Publish the post
curl -X POST \
  https://artfularchivesstudio.com/api/external/posts/123e4567-e89b-12d3-a456-426614174000/publish \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "social_share": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "published",
    "published_at": "2025-01-11T11:00:00Z",
    "public_url": "https://artfularchivesstudio.com/blog/contemporary-geometric-mastery",
    "actions_performed": ["social_share_queued", "webhooks_triggered"]
  }
}
```

### 2. Batch Content Creation

Create multiple posts efficiently:

```bash
# Create multiple posts in sequence
for title in "Abstract Expressions" "Modern Sculptures" "Digital Art Trends"
do
  curl -X POST \
    https://artfularchivesstudio.com/api/external/posts \
    -H "Authorization: Bearer your-api-key" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"$title\",
      \"content\": \"Generated content for $title...\",
      \"status\": \"draft\",
      \"origin_source\": \"generated\"
    }"
done
```

### 3. Media Management Workflow

Upload and organize media assets:

```bash
# Upload an image
curl -X POST \
  https://artfularchivesstudio.com/api/external/media \
  -H "Authorization: Bearer your-api-key" \
  -F "file=@artwork-photo.jpg" \
  -F "title=Artwork Photo" \
  -F "description=High-resolution photo of the contemporary piece" \
  -F "tags=artwork,contemporary,photography"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174000",
    "title": "Artwork Photo",
    "file_url": "https://storage.supabase.co/images/artwork-photo.jpg",
    "file_type": "image",
    "file_size_formatted": "2.3 MB",
    "tags": ["artwork", "contemporary", "photography"]
  }
}
```

## JavaScript/TypeScript Examples

### React Hook for API Integration

```typescript
import { useState, useEffect } from 'react'

interface APIClient {
  apiKey: string
  baseUrl: string
}

class ArtfulArchivesAPI {
  constructor(private config: APIClient) {}

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.config.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  async analyzieImage(imageFile: File, analysisType = 'detailed') {
    const formData = new FormData()
    formData.append('image', imageFile)

    return this.request(`/ai/analyze-image?analysis_type=${analysisType}`, {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type for FormData
    })
  }

  async createPost(postData: any) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    })
  }

  async generateAudio(text: string, options: any = {}) {
    return this.request('/ai/generate-audio', {
      method: 'POST',
      body: JSON.stringify({
        text,
        save_to_storage: true,
        ...options
      })
    })
  }

  async publishPost(postId: string) {
    return this.request(`/posts/${postId}/publish`, {
      method: 'POST'
    })
  }
}

// React Hook
export function useArtfulArchivesAPI(apiKey: string) {
  const [api] = useState(() => new ArtfulArchivesAPI({
    apiKey,
    baseUrl: 'https://artfularchivesstudio.com/api/external'
  }))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeWithErrorHandling = async (operation: () => Promise<any>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await operation()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    api,
    loading,
    error,
    executeWithErrorHandling
  }
}

// Usage in component
function CreatePostFromImage() {
  const { api, loading, error, executeWithErrorHandling } = useArtfulArchivesAPI(
    process.env.REACT_APP_API_KEY!
  )
  const [image, setImage] = useState<File | null>(null)
  const [post, setPost] = useState<any>(null)

  const handleImageUpload = async (file: File) => {
    setImage(file)
    
    const result = await executeWithErrorHandling(async () => {
      // Analyze image
      const analysis = await api.analyzieImage(file)
      
      // Create post from analysis
      const postData = {
        title: analysis.data.suggested_title,
        content: analysis.data.claude.content || analysis.data.openai.content,
        slug: analysis.data.suggested_slug,
        status: 'draft',
        origin_source: 'claude'
      }
      
      const createdPost = await api.createPost(postData)
      
      // Generate audio
      await api.generateAudio(postData.content, {
        title: `${postData.title} - Audio Narration`
      })
      
      return createdPost
    })
    
    setPost(result)
  }

  const handlePublish = async () => {
    if (!post) return
    
    await executeWithErrorHandling(async () => {
      return api.publishPost(post.data.id)
    })
  }

  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
      />
      
      {loading && <p>Processing...</p>}
      {error && <p>Error: {error}</p>}
      
      {post && (
        <div>
          <h3>{post.data.title}</h3>
          <p>{post.data.content.substring(0, 200)}...</p>
          <button onClick={handlePublish}>Publish Post</button>
        </div>
      )}
    </div>
  )
}
```

### Node.js Script Example

```javascript
const fetch = require('node-fetch')
const FormData = require('form-data')
const fs = require('fs')

class ArtfulArchivesAPI {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseUrl = 'https://artfularchivesstudio.com/api/external'
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${error.error}`)
    }

    return response.json()
  }

  async bulkCreatePosts(postsData) {
    const results = []
    
    for (const postData of postsData) {
      try {
        const result = await this.request('/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData)
        })
        results.push({ success: true, data: result })
      } catch (error) {
        results.push({ success: false, error: error.message, postData })
      }
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  }

  async processImageDirectory(directoryPath) {
    const files = fs.readdirSync(directoryPath)
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    )

    const results = []

    for (const imageFile of imageFiles) {
      try {
        console.log(`Processing ${imageFile}...`)
        
        // Analyze image
        const formData = new FormData()
        formData.append('image', fs.createReadStream(`${directoryPath}/${imageFile}`))
        
        const analysis = await this.request('/ai/analyze-image', {
          method: 'POST',
          body: formData,
          headers: formData.getHeaders()
        })

        // Create post
        const postData = {
          title: analysis.data.suggested_title || `Analysis of ${imageFile}`,
          content: analysis.data.claude.content || analysis.data.openai.content,
          slug: analysis.data.suggested_slug || imageFile.replace(/\.[^/.]+$/, ""),
          status: 'draft',
          origin_source: 'claude'
        }

        const post = await this.request('/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData)
        })

        // Generate audio
        const audio = await this.request('/ai/generate-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: postData.content,
            save_to_storage: true,
            title: `${postData.title} - Audio`
          })
        })

        results.push({
          file: imageFile,
          success: true,
          post: post.data,
          audio: audio.data
        })

      } catch (error) {
        results.push({
          file: imageFile,
          success: false,
          error: error.message
        })
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return results
  }
}

// Usage
async function main() {
  const api = new ArtfulArchivesAPI(process.env.API_KEY)
  
  try {
    // Process all images in a directory
    const results = await api.processImageDirectory('./artwork-images')
    
    console.log('Processing complete:')
    console.log(`Successful: ${results.filter(r => r.success).length}`)
    console.log(`Failed: ${results.filter(r => !r.success).length}`)
    
    // Publish successful posts
    for (const result of results.filter(r => r.success)) {
      try {
        await api.request(`/posts/${result.post.id}/publish`, {
          method: 'POST'
        })
        console.log(`Published: ${result.post.title}`)
      } catch (error) {
        console.error(`Failed to publish ${result.post.title}:`, error.message)
      }
    }
    
  } catch (error) {
    console.error('Script failed:', error)
  }
}

if (require.main === module) {
  main()
}
```

## Python Examples

### Python Client Library

```python
import requests
import json
import time
from typing import Dict, List, Optional
from pathlib import Path

class ArtfulArchivesAPI:
    def __init__(self, api_key: str, base_url: str = "https://artfularchivesstudio.com/api/external"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
    
    def request(self, method: str, endpoint: str, **kwargs) -> Dict:
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        
        if not response.ok:
            error_data = response.json() if response.content else {}
            raise Exception(f"API Error {response.status_code}: {error_data.get('error', 'Unknown error')}")
        
        return response.json()
    
    def analyze_image(self, image_path: str, analysis_type: str = 'detailed') -> Dict:
        """Analyze an artwork image"""
        with open(image_path, 'rb') as f:
            files = {'image': f}
            # Remove Content-Type header for multipart
            headers = {k: v for k, v in self.session.headers.items() if k != 'Content-Type'}
            
            response = requests.post(
                f"{self.base_url}/ai/analyze-image?analysis_type={analysis_type}",
                files=files,
                headers=headers
            )
        
        if not response.ok:
            raise Exception(f"Analysis failed: {response.json().get('error')}")
        
        return response.json()
    
    def create_post(self, post_data: Dict) -> Dict:
        """Create a new blog post"""
        return self.request('POST', '/posts', json=post_data)
    
    def generate_audio(self, text: str, **options) -> Dict:
        """Generate audio narration"""
        payload = {
            'text': text,
            'save_to_storage': True,
            **options
        }
        return self.request('POST', '/ai/generate-audio', json=payload)
    
    def publish_post(self, post_id: str) -> Dict:
        """Publish a blog post"""
        return self.request('POST', f'/posts/{post_id}/publish')
    
    def update_post(self, post_id: str, updates: Dict) -> Dict:
        """Update a blog post"""
        return self.request('PUT', f'/posts/{post_id}', json=updates)

# Usage Example
def process_artwork_collection(api_key: str, image_directory: str):
    """Process a collection of artwork images"""
    api = ArtfulArchivesAPI(api_key)
    image_dir = Path(image_directory)
    
    results = []
    
    for image_path in image_dir.glob('*.{jpg,jpeg,png,gif,webp}'):
        try:
            print(f"Processing {image_path.name}...")
            
            # Analyze image
            analysis = api.analyze_image(str(image_path))
            
            # Extract best analysis
            claude_content = analysis['data'].get('claude', {}).get('content', '')
            openai_content = analysis['data'].get('openai', {}).get('content', '')
            content = claude_content or openai_content
            
            if not content:
                print(f"No analysis content for {image_path.name}")
                continue
            
            # Create post
            post_data = {
                'title': analysis['data'].get('suggested_title', f'Analysis of {image_path.stem}'),
                'content': content,
                'slug': analysis['data'].get('suggested_slug', image_path.stem.lower().replace(' ', '-')),
                'status': 'draft',
                'origin_source': 'claude'
            }
            
            post = api.create_post(post_data)
            
            # Generate audio
            audio = api.generate_audio(
                content,
                title=f"{post_data['title']} - Audio Narration",
                voice_id="alloy"
            )
            
            # Associate audio with post
            if audio['data'].get('storage', {}).get('saved'):
                api.update_post(post['data']['id'], {
                    'primary_audio_id': audio['data']['storage']['media_asset_id']
                })
            
            results.append({
                'file': image_path.name,
                'success': True,
                'post_id': post['data']['id'],
                'title': post['data']['title']
            })
            
            print(f"✓ Created post: {post['data']['title']}")
            
        except Exception as e:
            results.append({
                'file': image_path.name,
                'success': False,
                'error': str(e)
            })
            print(f"✗ Failed to process {image_path.name}: {e}")
        
        # Rate limiting
        time.sleep(2)
    
    return results

# Batch publishing
def publish_draft_posts(api_key: str):
    """Publish all draft posts"""
    api = ArtfulArchivesAPI(api_key)
    
    # Get draft posts
    response = api.request('GET', '/posts?status=draft&limit=50')
    draft_posts = response['data']
    
    published_count = 0
    
    for post in draft_posts:
        try:
            # Validate post has required content
            if not post.get('title') or not post.get('content'):
                print(f"Skipping post {post['id']}: Missing title or content")
                continue
            
            # Publish post
            result = api.publish_post(post['id'])
            print(f"✓ Published: {post['title']}")
            published_count += 1
            
            # Rate limiting
            time.sleep(1)
            
        except Exception as e:
            print(f"✗ Failed to publish {post['title']}: {e}")
    
    print(f"Published {published_count} posts")

if __name__ == "__main__":
    import os
    
    api_key = os.getenv('ARTFUL_ARCHIVES_API_KEY')
    if not api_key:
        print("Please set ARTFUL_ARCHIVES_API_KEY environment variable")
        exit(1)
    
    # Process artwork images
    results = process_artwork_collection(api_key, './artwork-images')
    
    # Print summary
    successful = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]
    
    print(f"\nSummary:")
    print(f"Successful: {len(successful)}")
    print(f"Failed: {len(failed)}")
    
    if successful:
        print("\nSuccessful posts:")
        for result in successful:
            print(f"  - {result['title']}")
```

## Error Handling Patterns

### Retry Logic

```javascript
async function requestWithRetry(api, operation, maxRetries = 3) {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Usage
const result = await requestWithRetry(api, () => 
  api.createPost(postData)
)
```

### Rate Limit Handling

```javascript
class RateLimitedAPI extends ArtfulArchivesAPI {
  constructor(apiKey) {
    super(apiKey)
    this.requestQueue = []
    this.processing = false
  }

  async request(endpoint, options) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ endpoint, options, resolve, reject })
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.processing || this.requestQueue.length === 0) return
    
    this.processing = true
    
    while (this.requestQueue.length > 0) {
      const { endpoint, options, resolve, reject } = this.requestQueue.shift()
      
      try {
        const result = await super.request(endpoint, options)
        resolve(result)
      } catch (error) {
        if (error.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = error.headers?.['retry-after'] || 60
          console.log(`Rate limited, waiting ${retryAfter}s...`)
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
          
          // Put request back in queue
          this.requestQueue.unshift({ endpoint, options, resolve, reject })
          continue
        }
        reject(error)
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    this.processing = false
  }
}
```

These examples demonstrate the flexibility and power of the Artful Archives Studio External API for creating sophisticated content management workflows that can be integrated into various applications and automated processes.