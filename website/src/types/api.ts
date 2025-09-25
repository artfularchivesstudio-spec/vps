// 🎭 Shared API Types - The Grand Repository of Interface Treasures
// Where all our API contracts live in harmonious unity!

// 🎨 Error Response Interface - Our Universal Safety Net
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    status: number;
    timestamp: string;
    requestId?: string;
  };
}

// 🎼 Audio Asset Data Interface - The Musical Treasures
export interface AudioAssetData {
  id: string;
  post_id: string;
  file_url: string;
  file_type: string;
  mime_type: string;
  file_size_bytes: number;
  language: string;
  title: string;
  duration_seconds?: number;
  transcription?: string;
  created_at: string;
  updated_at: string;
}

// 🎨 Primary Audio Data Interface - The Chosen One
export interface PrimaryAudioData {
  audio_asset_id: string;
  language?: string;
  reason?: string;
}

// 🎵 Audio Job Data Interface - The Processing Maestro
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

// 🎪 Media Asset Data Interface - The Gallery Curator
export interface MediaAssetData {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  mime_type: string;
  file_size_bytes: number;
  related_post_id?: string;
  generation_metadata?: any;
  status: string;
  created_at: string;
  updated_at: string;
}

// 🎨 API Response Wrapper - The Elegant Package
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

// 🎭 Rate Limit Info - The Traffic Controller
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// 🎪 Pagination Metadata - The Page Turner
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 🎨 Request Context - The Stage Manager
export interface RequestContext {
  userId?: string;
  sessionId?: string;
  requestId: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}
