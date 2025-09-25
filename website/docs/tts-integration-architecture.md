# TTS Integration Architecture

## Overview

This document outlines the Text-to-Speech (TTS) integration architecture for Artful Archives Studio, focusing on seamless audio generation workflows for both internal admin tools and external AI assistant integrations.

## Current TTS Implementation

### ElevenLabs Integration
- **Primary Provider**: ElevenLabs API for high-quality speech synthesis
- **Voice Configuration**: Customizable voice selection with default "Bella" voice
- **Audio Format**: MP3 output with configurable quality settings
- **Storage**: Supabase storage bucket for audio files

### Current Workflow
1. **Content Input**: Text content from AI analysis or custom writing
2. **API Call**: `/api/ai/generate-audio` endpoint
3. **Audio Generation**: ElevenLabs TTS processing
4. **Storage**: Upload to Supabase storage
5. **Database**: Media asset record with metadata
6. **Association**: Link audio to blog post via `primary_audio_id`

## Enhanced TTS Architecture for GPT Integration

### Multi-Provider Support
```typescript
interface TTSProvider {
  name: 'elevenlabs' | 'openai' | 'azure' | 'google'
  generate(text: string, options: TTSOptions): Promise<AudioBuffer>
  voices: Voice[]
  supportedLanguages: string[]
  maxTextLength: number
}

interface TTSOptions {
  voice_id?: string
  language?: string
  speed?: number
  pitch?: number
  emotion?: string
  style?: string
}
```

### Provider Implementations

#### ElevenLabs (Primary)
```typescript
class ElevenLabsTTSProvider implements TTSProvider {
  name = 'elevenlabs'
  maxTextLength = 2500
  
  voices = [
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male' },
    // ... more voices
  ]
  
  async generate(text: string, options: TTSOptions): Promise<AudioBuffer> {
    // ElevenLabs API integration
  }
}
```

#### OpenAI TTS (Fallback)
```typescript
class OpenAITTSProvider implements TTSProvider {
  name = 'openai'
  maxTextLength = 4096
  
  voices = [
    { id: 'alloy', name: 'Alloy', gender: 'neutral' },
    { id: 'echo', name: 'Echo', gender: 'male' },
    { id: 'fable', name: 'Fable', gender: 'neutral' },
    { id: 'onyx', name: 'Onyx', gender: 'male' },
    { id: 'nova', name: 'Nova', gender: 'female' },
    { id: 'shimmer', name: 'Shimmer', gender: 'female' }
  ]
  
  async generate(text: string, options: TTSOptions): Promise<AudioBuffer> {
    // OpenAI TTS API integration
  }
}
```

### TTS Service Manager
```typescript
class TTSServiceManager {
  private providers: Map<string, TTSProvider> = new Map()
  private defaultProvider = 'elevenlabs'
  
  async generateAudio(
    text: string, 
    options: TTSOptions & { provider?: string }
  ): Promise<AudioResult> {
    const provider = this.providers.get(options.provider || this.defaultProvider)
    
    try {
      const audioBuffer = await provider.generate(text, options)
      return {
        success: true,
        audioBuffer,
        provider: provider.name,
        metadata: {
          textLength: text.length,
          duration: await this.calculateDuration(audioBuffer),
          voice: options.voice_id
        }
      }
    } catch (error) {
      // Fallback to alternative provider
      return this.tryFallbackProvider(text, options, error)
    }
  }
}
```

## ChatGPT Actions TTS Integration

### Extended API Endpoints
```typescript
// Voice Management
GET  /api/external/tts/voices              - List available voices
GET  /api/external/tts/providers           - List TTS providers

// Audio Generation
POST /api/external/tts/generate            - Generate audio from text
POST /api/external/tts/generate-batch      - Batch generation for multiple texts
GET  /api/external/tts/status/[jobId]      - Check generation status

// Audio Management
GET  /api/external/audio/[id]              - Get audio file
DELETE /api/external/audio/[id]            - Delete audio file
PUT  /api/external/audio/[id]/metadata     - Update audio metadata
```

### ChatGPT Conversation Flow
```
User: "Create a post about this artwork and make it into a podcast"
GPT: "I'll analyze the artwork and create both text and audio content..."
     1. Calls /api/external/ai/analyze-image
     2. Calls /api/external/posts (create post)
     3. Calls /api/external/tts/generate (create audio)
     4. Calls /api/external/posts/{id}/audio (associate audio)
User: "Make the voice more energetic"
GPT: "I'll regenerate the audio with more energy..."
     1. Calls /api/external/tts/generate with style: "energetic"
     2. Updates post with new audio
```

## Claude MCP/Hooks TTS Integration

### MCP Tools
```typescript
const ttsTools = {
  generate_audio: {
    description: "Generate audio from text using TTS",
    parameters: {
      text: { type: "string", description: "Text to convert to speech" },
      voice: { type: "string", description: "Voice ID to use" },
      provider: { type: "string", enum: ["elevenlabs", "openai"] },
      style: { type: "string", description: "Speaking style/emotion" }
    }
  },
  
  list_voices: {
    description: "List available TTS voices",
    parameters: {
      provider: { type: "string", optional: true }
    }
  },
  
  batch_generate: {
    description: "Generate multiple audio files from text segments",
    parameters: {
      segments: { type: "array", items: { type: "string" } },
      voice: { type: "string" },
      provider: { type: "string", optional: true }
    }
  }
}
```

### Hook System
```typescript
interface TTSHook {
  name: string
  trigger: 'pre_generate' | 'post_generate' | 'error'
  handler: (context: TTSContext) => Promise<void>
}

// Example hooks
const ttsHooks: TTSHook[] = [
  {
    name: 'content_preprocessing',
    trigger: 'pre_generate',
    handler: async (context) => {
      // Clean up text, add pauses, optimize for speech
      context.text = preprocessTextForSpeech(context.text)
    }
  },
  
  {
    name: 'audio_postprocessing',
    trigger: 'post_generate',
    handler: async (context) => {
      // Add intro/outro, normalize volume, add metadata
      context.audioBuffer = await postprocessAudio(context.audioBuffer)
    }
  }
]
```

## Advanced TTS Features

### Intelligent Text Segmentation
```typescript
class TextSegmenter {
  static segment(text: string, maxLength: number = 2500): string[] {
    // Smart segmentation at sentence boundaries
    // Preserve context and flow
    // Handle special cases (quotes, lists, etc.)
  }
}
```

### Voice Personality Matching
```typescript
interface VoicePersonality {
  artCritique: string    // Sophisticated, analytical
  casual: string         // Friendly, conversational
  dramatic: string       // Expressive, theatrical
  educational: string    // Clear, instructional
}

class VoiceSelector {
  static selectVoice(content: string, context: 'art' | 'casual' | 'educational'): string {
    // Analyze content and select appropriate voice
    // Consider content type, audience, and context
  }
}
```

### Audio Quality Optimization
```typescript
interface AudioQualityConfig {
  bitrate: number
  sampleRate: number
  channels: 1 | 2
  format: 'mp3' | 'wav' | 'aac'
  compression: 'standard' | 'high' | 'maximum'
}

class AudioOptimizer {
  static optimize(audioBuffer: ArrayBuffer, config: AudioQualityConfig): ArrayBuffer {
    // Optimize audio for web delivery
    // Balance quality vs file size
    // Add fade in/out effects
  }
}
```

## Performance Considerations

### Caching Strategy
```typescript
interface TTSCache {
  key: string           // Hash of text + voice + options
  audioUrl: string      // Cached audio URL
  metadata: TTSMetadata
  createdAt: Date
  expiresAt: Date
}

class TTSCacheManager {
  async getCachedAudio(text: string, options: TTSOptions): Promise<string | null> {
    // Check cache for existing audio
    // Return URL if valid and not expired
  }
  
  async cacheAudio(text: string, options: TTSOptions, audioBuffer: ArrayBuffer): Promise<void> {
    // Store audio in cache with metadata
    // Set appropriate expiration
  }
}
```

### Batch Processing
```typescript
class BatchTTSProcessor {
  async processBatch(requests: TTSRequest[]): Promise<TTSResult[]> {
    // Process multiple TTS requests efficiently
    // Handle rate limiting and API quotas
    // Parallel processing with concurrency limits
  }
}
```

### Background Processing
```typescript
class TTSJobQueue {
  async queueGeneration(text: string, options: TTSOptions): Promise<string> {
    // Add to background job queue
    // Return job ID for status tracking
    // Handle long-running generations
  }
  
  async getJobStatus(jobId: string): Promise<TTSJobStatus> {
    // Check job progress
    // Return completion status and results
  }
}
```

## Error Handling and Fallbacks

### Provider Fallback Chain
1. **ElevenLabs** (Primary) - High quality, natural voices
2. **OpenAI TTS** (Fallback) - Reliable, good quality
3. **Azure Speech** (Emergency) - Basic functionality
4. **Local TTS** (Last resort) - Offline capability

### Error Recovery
```typescript
class TTSErrorHandler {
  async handleError(error: TTSError, context: TTSContext): Promise<TTSResult> {
    switch (error.type) {
      case 'rate_limit':
        return this.handleRateLimit(context)
      case 'quota_exceeded':
        return this.switchProvider(context)
      case 'text_too_long':
        return this.segmentAndRetry(context)
      case 'voice_unavailable':
        return this.selectAlternativeVoice(context)
      default:
        return this.fallbackProvider(context)
    }
  }
}
```

## Monitoring and Analytics

### TTS Usage Metrics
- Generation success/failure rates
- Audio quality scores
- User preference tracking
- Cost optimization metrics
- Provider performance comparison

### Real-time Monitoring
```typescript
interface TTSMetrics {
  totalGenerations: number
  successRate: number
  averageProcessingTime: number
  providerUsage: Record<string, number>
  errorTypes: Record<string, number>
  costPerGeneration: number
}
```

## Future Enhancements

### Multi-language Support
- Automatic language detection
- Voice matching by language
- Accent and dialect options
- Cultural adaptation

### Advanced Voice Features
- Emotion and sentiment analysis
- Dynamic voice modulation
- Custom voice training
- Voice cloning capabilities

### Integration Expansions
- Podcast generation workflows
- Audiobook creation
- Video narration
- Live speech synthesis

## Conclusion

This TTS integration architecture provides a robust, scalable foundation for audio generation across all platform integrations. The multi-provider approach ensures reliability, while the advanced features enable sophisticated conversational AI workflows that make content creation truly seamless for users.