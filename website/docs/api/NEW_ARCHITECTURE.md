# 🎭 The New API Architecture - A Theatrical Transformation Guide ✨

*Welcome to the chronicles of our magnificent refactoring journey!*

## 🎪 Overview: From Direct Calls to Theatrical Excellence

We have successfully transformed our audio generation workflow from direct Supabase SDK calls to a beautifully orchestrated API architecture. This document serves as your guide to understanding and working with our new theatrical system.

## 🎬 Architecture Components

### 🎨 1. Shared API Types (`src/types/api.ts`)

Our foundation of type safety and consistency:

```typescript
// 🎭 Core interfaces for our API theater
export interface ErrorResponse {
  error: {
    code: string;        // "AUDIO_JOB_ESCAPED" 🎪
    message: string;     // "The audio job has run away to join another circus"
    details?: any;       // The juicy gossip
    status: number;      // HTTP status (the crowd's reaction)
    timestamp: string;   // When the drama happened
    requestId?: string;  // For tracking this performance
  };
}

export interface AudioJobData {
  id: string;
  post_id?: string;
  status: string;
  text_content: string;
  input_text: string;
  config: {
    voice?: string;
    voice_preference?: string;
    voice_settings?: any;
    title?: string;
    personality?: string;
    speed?: number;
  };
  languages: string[];
  completed_languages: string[];
  audio_urls?: Record<string, string>;
  translated_texts?: Record<string, string>;
  language_statuses?: Record<string, { status: string; draft: boolean }>;
  current_language?: string;
  is_draft?: boolean;
  created_at: string;
  updated_at: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
}
```

### 🎪 2. API Client (`src/lib/api/client.ts`)

Our magnificent, type-safe API conductor:

```typescript
// 🎭 The Grand API Client Theater
import apiClient from '@/lib/api/client';

// Create audio jobs with theatrical flair
const audioJob = await apiClient.createAudioJob({
  post_id: 'post_123',
  status: 'pending',
  text_content: 'Your content here',
  input_text: 'Original text',
  config: { voice: 'nova', personality: 'hybrid' },
  languages: ['en', 'es'],
  // ... other properties
});

// List audio jobs with filters
const jobs = await apiClient.listAudioJobs({
  postId: 'post_123',
  status: 'completed',
  limit: 10
});

// Manage media assets
const assets = await apiClient.listMediaAssets({ type: 'audio' });

// Handle post audio operations
const audioAssets = await apiClient.getPostAudioAssets('post_123');
const primaryAudio = await apiClient.setPostPrimaryAudio('post_123', {
  audio_asset_id: 'audio_456',
  language: 'en'
});
```

**Key Features:**
- 🎯 **Type Safety**: Full TypeScript support with generated types
- 🔄 **Retry Logic**: Automatic retries for server errors and rate limits
- 🧠 **Caching**: Intelligent caching for GET requests
- 📊 **Rate Limiting**: Built-in rate limit handling and monitoring
- 🎭 **Error Handling**: Consistent, theatrical error responses
- 📝 **Logging**: Comprehensive request/response logging

### 🎵 3. Enhanced usePostData Hook (`src/hooks/usePostData.ts`)

Our supercharged hook with audio superpowers:

```typescript
// 🎭 Enhanced hook usage
const {
  // Core post data
  post,
  loading,
  error,
  
  // Audio-related data and states
  audioAssets,
  audioLoading,
  audioError,
  
  // Audio management functions
  refreshAudioAssets,
  addAudioAsset,
  setPrimaryAudio,
  
  // Audio job management
  createAudioJob,
  getAudioJobs
} = usePostData('post_123');

// Create an audio job
const handleCreateAudio = async () => {
  try {
    const job = await createAudioJob({
      status: 'pending',
      text_content: post.content,
      input_text: post.content,
      config: { voice: 'nova', personality: 'hybrid' },
      languages: ['en', 'es'],
      completed_languages: [],
      audio_urls: {},
      translated_texts: { en: post.content },
      is_draft: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log('Audio job created:', job.id);
  } catch (error) {
    console.error('Failed to create audio job:', error);
  }
};
```

**New Capabilities:**
- 🎪 **Audio Asset Management**: Full CRUD operations for audio assets
- 🎬 **Audio Job Creation**: Create and track audio generation jobs
- 🎨 **Primary Audio Setting**: Set and manage primary audio for posts
- 🔄 **Auto-refresh**: Automatic audio asset refreshing
- 🎭 **Enhanced Error Handling**: Detailed error states and messages

### 🎬 4. Refactored AudioStep Component (`src/components/admin/wizard/AudioStep.tsx`)

Our star performer, now with API client integration:

```typescript
// 🎭 Key changes in AudioStep
import { usePostData } from '@/hooks/usePostData';
import { AudioJobData } from '@/types/api';
import apiClient, { APIError } from '@/lib/api/client';

// Enhanced audio data structure
interface AudioData {
  jobId: string | null;
  immediateUrls?: Record<string, string>;
  status: 'immediate' | 'processing' | 'none';
  audioJob?: AudioJobData; // Full job data for enhanced tracking
}

// New API-powered generation
const handleGenerate = async () => {
  try {
    // Create audio job using our API client
    const createdJob = await apiClient.createAudioJob(audioJobData);
    
    if (createdJob.success && createdJob.data) {
      const audioData: AudioData = {
        jobId: createdJob.data.id,
        status: createdJob.data.audio_urls ? 'immediate' : 'processing',
        immediateUrls: createdJob.data.audio_urls || {},
        audioJob: createdJob.data
      };
      
      onNext(audioData);
    }
  } catch (error) {
    // Enhanced error handling with API error types
    const errorMessage = error instanceof APIError 
      ? `API Error (${error.code}): ${error.message}`
      : error.message;
    
    setError(errorMessage);
  }
};
```

## 🎪 Migration Guide: From Old to New

### 🎭 Before: Direct Supabase Calls

```typescript
// ❌ Old way - Direct Supabase SDK calls
const supabase = createClient();
const { data, error } = await supabase
  .from('audio_jobs')
  .insert(jobData)
  .select()
  .single();

if (error) {
  throw new Error(error.message);
}
```

### 🎪 After: API Client Magic

```typescript
// ✅ New way - Type-safe API client
const response = await apiClient.createAudioJob(jobData);

if (!response.success) {
  throw new Error(response.message);
}

const audioJob = response.data;
```

### 🎵 Benefits of the New Architecture

1. **🎯 Type Safety**: Full TypeScript support prevents runtime errors
2. **🔄 Consistency**: Standardized error handling and response formats
3. **🧠 Performance**: Built-in caching and retry logic
4. **📊 Monitoring**: Request tracking and rate limit management
5. **🎭 Maintainability**: Clear separation of concerns
6. **🚀 Scalability**: Easy to extend and modify
7. **🛡️ Security**: Centralized authentication and validation

## 🎨 Error Handling Patterns

### 🎪 Standard Error Response

```typescript
interface ErrorResponse {
  error: {
    code: string;        // "AUDIO_JOB_NOT_FOUND"
    message: string;     // "The requested audio job could not be found"
    details?: any;       // Additional context
    status: number;      // HTTP status code
    timestamp: string;   // ISO timestamp
    requestId?: string;  // For tracking
  };
}
```

### 🎭 Error Handling in Components

```typescript
try {
  const result = await apiClient.createAudioJob(jobData);
  // Handle success
} catch (error) {
  if (error instanceof APIError) {
    // Handle API-specific errors
    console.error(`API Error (${error.code}): ${error.message}`);
    
    if (error.isRetryable()) {
      // Retry logic for server errors
    } else {
      // Handle client errors
    }
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

## 🎬 Testing Our New Architecture

### 🎪 Running Tests

```bash
# Run all API tests
npm test src/__tests__/api/

# Run hook tests
npm test src/__tests__/hooks/

# Run component tests
npm test src/__tests__/components/

# Run all tests with coverage
npm test -- --coverage
```

### 🎭 Test Structure

- **API Client Tests**: Comprehensive testing of all API methods
- **Hook Tests**: Testing enhanced usePostData functionality
- **Component Tests**: Testing AudioStep integration
- **Integration Tests**: End-to-end workflow testing

## 🎵 Performance Optimizations

### 🎪 Caching Strategy

- **GET Requests**: Cached for 1 minute by default
- **Cache Keys**: Method + URL + body hash
- **Cache Management**: Automatic cleanup and manual clearing

### 🎭 Retry Logic

- **Server Errors (5xx)**: Automatic retry with exponential backoff
- **Rate Limits (429)**: Retry after rate limit reset
- **Client Errors (4xx)**: No retry (immediate failure)
- **Network Errors**: Retry with backoff

### 🎨 Rate Limiting

- **Monitoring**: Track rate limit headers
- **Throttling**: Automatic request throttling when approaching limits
- **Reporting**: Rate limit status available via `getRateLimitInfo()`

## 🎪 Future Enhancements

### 🎭 Planned Features

1. **Real-time Updates**: WebSocket integration for job status updates
2. **Offline Support**: Queue requests when offline
3. **Advanced Caching**: Redis integration for distributed caching
4. **Metrics**: Detailed performance and usage metrics
5. **A/B Testing**: Built-in experimentation framework

### 🎵 Extension Points

- **Custom Middleware**: Add request/response interceptors
- **Plugin System**: Extend functionality with plugins
- **Custom Serializers**: Handle different data formats
- **Authentication Providers**: Support multiple auth methods

## 🎬 Troubleshooting

### 🎪 Common Issues

**Q: API calls are failing with 401 errors**
A: Check authentication headers and API key configuration

**Q: Requests are being cached when they shouldn't be**
A: Use `skipCache: true` option or call `clearCache()`

**Q: Rate limit errors**
A: Check `getRateLimitInfo()` and implement backoff logic

**Q: Type errors with API responses**
A: Ensure you're using the latest generated types

### 🎭 Debug Mode

```typescript
// Enable detailed logging
const client = new APIClient({
  enableLogging: true,
  timeout: 30000
});

// Check cache statistics
console.log('Cache stats:', client.getCacheStats());

// Monitor rate limits
console.log('Rate limit:', client.getRateLimitInfo());
```

## 🎨 Contributing

When extending our API architecture:

1. **Follow Type Safety**: Always use TypeScript interfaces
2. **Maintain Consistency**: Follow existing patterns and conventions
3. **Add Tests**: Comprehensive test coverage for new features
4. **Update Documentation**: Keep this guide current
5. **Use Theatrical Flair**: Maintain our whimsical commenting style! 🎭

---

*"In architecture we trust, in types we flourish, and in theatrical flair we find joy!"*

*- The Digital Theatre Company* 🎭✨