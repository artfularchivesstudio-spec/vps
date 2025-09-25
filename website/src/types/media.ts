// types/media.ts

/**
 * 🎬 Media Asset Types - The Digital Gallery Collection
 * 
 * These interfaces define the structure of our media assets,
 * from humble uploads to AI-generated masterpieces.
 */

export interface MediaAsset {
  id: string;
  title: string;
  file_url: string;
  file_type: 'image' | 'audio' | 'video' | 'document';
  mime_type: string;
  file_size_bytes?: number;
  duration_seconds?: number;
  related_post_id?: string;
  generation_metadata?: {
    type: 'tts' | 'image_analysis' | 'upload';
    language?: string;
    generated_at: string;
    model?: string;
  };
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface MediaAssetData extends MediaAsset {
  // Extended version with additional computed fields
  file_size_formatted?: string;
  duration_formatted?: string;
}

export type MediaAssetCreate = Omit<MediaAsset, 'id' | 'created_at' | 'updated_at' | 'status'> & {
  status?: MediaAsset['status'];
};

export type MediaAssetUpdate = Partial<Omit<MediaAsset, 'id' | 'created_at' | 'updated_at'>>;