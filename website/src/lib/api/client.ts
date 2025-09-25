// 🎭 The Grand API Client Theater - Where Type Safety Meets Theatrical Flair! ✨
// 🎪 A unified, delightfully type-safe client SDK for our digital art gallery

import { 
  ErrorResponse, 
  AudioAssetData, 
  PrimaryAudioData, 
  AudioJobData, 
  MediaAssetData, 
  APIResponse, 
  RateLimitInfo, 
  PaginationMeta, 
  RequestContext 
} from '@/types/api';

// 🎨 Configuration for our API client masterpiece
interface APIClientConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  enableLogging?: boolean;
  rateLimitThreshold?: number;
}

// 🎵 Request options for fine-tuning our API performances
interface RequestOptions {
  timeout?: number;
  retries?: number;
  skipCache?: boolean;
  requestPriority?: 'low' | 'normal' | 'high';
  context?: Partial<RequestContext>;
}

// 🎪 The magnificent API client class - our digital conductor!
class APIClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private enableLogging: boolean;
  private rateLimitThreshold: number;
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private rateLimitInfo: RateLimitInfo | null = null;

  // 🎬 Constructor - Setting the stage for our API performances
  constructor(config: APIClientConfig = {}) {
    this.baseURL = config.baseURL || '/api';
    this.timeout = config.timeout || 30000; // 30 seconds - enough time for a dramatic pause
    this.retryAttempts = config.retryAttempts || 3;
    this.enableLogging = config.enableLogging ?? true;
    this.rateLimitThreshold = config.rateLimitThreshold || 100;

    if (this.enableLogging) {
      console.log('🎭 API Client initialized with theatrical excellence!');
    }
  }

  // 🎯 The Core Request Performer - Handles all our API choreography
  private async performRequest<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const { timeout = this.timeout, retries = this.retryAttempts, skipCache = false, requestPriority, context, ...fetchOptions } = options;
    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${fetchOptions.method || 'GET'}:${url}:${JSON.stringify(fetchOptions.body || {})}`;

    // 🎪 Check our cache for a previous performance (if not skipping)
    if (!skipCache && fetchOptions.method === 'GET') {
      const cached = this.requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
        if (this.enableLogging) {
          console.log(`🎭 Serving cached performance for: ${endpoint}`);
        }
        return cached.data;
      }
    }

    // 🎨 Prepare our request with theatrical headers
    const requestOptions: RequestInit = {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': '1.0.0',
        'X-Request-ID': this.generateRequestId(),
        ...fetchOptions.headers,
      },
    };

    // 🎬 Perform the request with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        if (this.enableLogging && attempt > 1) {
          console.log(`🎪 Retry attempt ${attempt - 1} for: ${endpoint}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        // 🎭 Extract rate limit information from headers
        this.updateRateLimitInfo(response.headers);

        if (!response.ok) {
          const errorData: ErrorResponse = await response.json().catch(() => ({
            error: {
              code: 'UNKNOWN_ERROR',
              message: `HTTP ${response.status}: ${response.statusText}`,
              status: response.status,
              timestamp: new Date().toISOString(),
            }
          }));
          
          throw new APIError(errorData.error.message, errorData.error.code, response.status, errorData);
        }

        const data: APIResponse<T> = await response.json();
        
        // 🎪 Cache successful GET requests
        if (fetchOptions.method === 'GET') {
          this.requestCache.set(cacheKey, { data, timestamp: Date.now() });
        }

        if (this.enableLogging) {
          console.log(`✨ Successful API performance: ${endpoint}`);
        }

        return data;

      } catch (error) {
        lastError = error as Error;
        
        if (attempt <= retries && this.shouldRetry(error as Error)) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        break;
      }
    }

    // 🎭 Final curtain call - throw the last error
    if (this.enableLogging) {
      console.error(`💥 API performance failed after ${retries + 1} attempts:`, lastError);
    }
    
    throw lastError;
  }

  // 🎪 Audio Jobs API - The Musical Theater Section
  
  // 🎵 List all audio jobs with pagination and filtering
  async listAudioJobs(params: {
    postId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}, options?: RequestOptions): Promise<APIResponse<AudioJobData[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });
    
    const endpoint = `/audio-jobs${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.performRequest<AudioJobData[]>(endpoint, { method: 'GET', ...options });
  }

  // 🎬 Create a new audio job
  async createAudioJob(jobData: Omit<AudioJobData, 'id' | 'createdAt' | 'updatedAt'>, options?: RequestOptions): Promise<APIResponse<AudioJobData>> {
    return this.performRequest<AudioJobData>('/audio-jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
      ...options
    });
  }

  // 🎭 Get a specific audio job by ID
  async getAudioJob(id: string, options?: RequestOptions): Promise<APIResponse<AudioJobData>> {
    return this.performRequest<AudioJobData>(`/audio-jobs/${id}`, { method: 'GET', ...options });
  }

  // 🎨 Update an audio job
  async updateAudioJob(id: string, updates: Partial<AudioJobData>, options?: RequestOptions): Promise<APIResponse<AudioJobData>> {
    return this.performRequest<AudioJobData>(`/audio-jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      ...options
    });
  }

  // 🗑️ Delete an audio job
  async deleteAudioJob(id: string, options?: RequestOptions): Promise<APIResponse<{ success: boolean }>> {
    return this.performRequest<{ success: boolean }>(`/audio-jobs/${id}`, { method: 'DELETE', ...options });
  }

  // 🎪 Media Assets API - The Digital Gallery Section
  
  // 🖼️ List all media assets
  async listMediaAssets(params: {
    type?: string;
    postId?: string;
    limit?: number;
    offset?: number;
  } = {}, options?: RequestOptions): Promise<APIResponse<MediaAssetData[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });
    
    const endpoint = `/media-assets${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.performRequest<MediaAssetData[]>(endpoint, { method: 'GET', ...options });
  }

  // 🎬 Create a new media asset
  async createMediaAsset(assetData: Omit<MediaAssetData, 'id' | 'createdAt' | 'updatedAt'>, options?: RequestOptions): Promise<APIResponse<MediaAssetData>> {
    return this.performRequest<MediaAssetData>('/media-assets', {
      method: 'POST',
      body: JSON.stringify(assetData),
      ...options
    });
  }

  // 🎭 Get a specific media asset
  async getMediaAsset(id: string, options?: RequestOptions): Promise<APIResponse<MediaAssetData>> {
    return this.performRequest<MediaAssetData>(`/media-assets/${id}`, { method: 'GET', ...options });
  }

  // 🎨 Update a media asset
  async updateMediaAsset(id: string, updates: Partial<MediaAssetData>, options?: RequestOptions): Promise<APIResponse<MediaAssetData>> {
    return this.performRequest<MediaAssetData>(`/media-assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      ...options
    });
  }

  // 🗑️ Delete a media asset
  async deleteMediaAsset(id: string, options?: RequestOptions): Promise<APIResponse<{ success: boolean }>> {
    return this.performRequest<{ success: boolean }>(`/media-assets/${id}`, { method: 'DELETE', ...options });
  }

  // 🎵 Posts API - The Content Theater Section
  
  // 📝 Get audio assets for a specific post
  async getPostAudioAssets(postId: string, options?: RequestOptions): Promise<APIResponse<AudioAssetData[]>> {
    return this.performRequest<AudioAssetData[]>(`/posts/${postId}/audio-assets`, { method: 'GET', ...options });
  }

  // 🎪 Add an audio asset to a post
  async addPostAudioAsset(postId: string, assetData: AudioAssetData, options?: RequestOptions): Promise<APIResponse<AudioAssetData>> {
    return this.performRequest<AudioAssetData>(`/posts/${postId}/audio-assets`, {
      method: 'POST',
      body: JSON.stringify(assetData),
      ...options
    });
  }

  // 🎭 Set the primary audio for a post
  async setPostPrimaryAudio(postId: string, audioData: PrimaryAudioData, options?: RequestOptions): Promise<APIResponse<PrimaryAudioData>> {
    return this.performRequest<PrimaryAudioData>(`/posts/${postId}/primary-audio`, {
      method: 'PUT',
      body: JSON.stringify(audioData),
      ...options
    });
  }

  // 🎪 Utility Methods - The Backstage Crew
  
  // 🎨 Generate a unique request ID for tracking
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 🎭 Update rate limit information from response headers
  private updateRateLimitInfo(headers: Headers): void {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');
    
    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset),
        retryAfter: remaining === '0' ? parseInt(reset) - Math.floor(Date.now() / 1000) : undefined
      };
    }
  }

  // 🎪 Determine if we should retry a failed request
  private shouldRetry(error: Error): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.name === 'AbortError') return true;
    if (error instanceof APIError) {
      return error.status >= 500 || error.status === 429; // Server errors or rate limiting
    }
    return true; // Retry on unknown errors
  }

  // 🎭 Get current rate limit information
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  // 🎪 Clear the request cache
  clearCache(): void {
    this.requestCache.clear();
    if (this.enableLogging) {
      console.log('🎭 Request cache cleared - fresh start for new performances!');
    }
  }

  // 🎨 Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys())
    };
  }
}

// 🎭 Custom API Error class for theatrical error handling
class APIError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly response?: ErrorResponse;

  constructor(message: string, code: string, status: number, response?: ErrorResponse) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.response = response;
  }

  // 🎪 Check if this is a specific type of error
  isRetryable(): boolean {
    return this.status >= 500 || this.status === 429;
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}

// 🎬 Create and export our singleton API client instance
const apiClient = new APIClient({
  enableLogging: process.env.NODE_ENV === 'development',
  timeout: 30000,
  retryAttempts: 3,
  rateLimitThreshold: 100
});

// 🎭 Export everything for the grand performance
export { APIClient, APIError, apiClient };
export type { APIClientConfig, RequestOptions };

// 🎪 Default export for convenience
export default apiClient;