import { useState, useEffect, useCallback } from 'react'
import { BlogPost } from '@/types/blog'
import { Author } from '@/types/author'
import { AudioAssetData, PrimaryAudioData, AudioJobData } from '@/types/api'
import apiClient, { APIError } from '@/lib/api/client'

/**
 * 🎭 The Enhanced Post Data Theater - A Theatrical Hook for Blog Post Management! ✨
 * 
 * This magnificent hook orchestrates the grand performance of:
 * 🎪 1. Fetching post data through our type-safe API client
 * 🎵 2. Managing audio assets and generation jobs with theatrical flair
 * 🎨 3. Handling loading states and errors with dramatic precision
 * 🎬 4. Providing a delightful interface for components to consume
 *
 * Now enhanced with our new API architecture for superior type safety,
 * caching, retry logic, and comprehensive error handling!
 */

interface UsePostDataReturn {
  // 📝 Core post data
  post: BlogPost | null;
  loading: boolean;
  error: string | null;
  
  // 🎵 Audio-related data and states
  audioAssets: AudioAssetData[];
  audioLoading: boolean;
  audioError: string | null;
  
  // 🎪 Audio management functions
  refreshAudioAssets: () => Promise<void>;
  addAudioAsset: (assetData: AudioAssetData) => Promise<void>;
  setPrimaryAudio: (audioData: PrimaryAudioData) => Promise<void>;
  
  // 🎬 Audio job management
  createAudioJob: (jobData: Omit<AudioJobData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<AudioJobData>;
  getAudioJobs: () => Promise<AudioJobData[]>;
}

export const usePostData = (id: string): UsePostDataReturn => {
  // 🎭 Core post state management
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 🎵 Audio-specific state management
  const [audioAssets, setAudioAssets] = useState<AudioAssetData[]>([])
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)

  // 🎵 Fetch audio assets for the post - our musical interlude!
  const fetchAudioAssets = useCallback(async () => {
    if (!id) return;
    
    try {
      setAudioLoading(true)
      setAudioError(null)
      
      const response = await apiClient.getPostAudioAssets(id)
      
      if (response.success && response.data) {
         setAudioAssets(response.data)
       } else {
         throw new Error(response.message || 'Failed to fetch audio assets')
       }
    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? `Audio API Error (${err.code}): ${err.message}`
        : err instanceof Error 
        ? err.message 
        : 'Failed to load audio assets'
      
      setAudioError(errorMessage)
      console.error('🎵 Audio assets fetch failed:', err)
    } finally {
      setAudioLoading(false)
    }
  }, [id])

  // 🎪 Fetch the main post data - our opening act!
  const fetchPost = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true)
      setError(null)
      
      // 🎭 Note: This would typically call a posts API endpoint
      // For now, we'll simulate the API call structure
      // In a real implementation, you'd have: await apiClient.getPost(id)
      
      // 🎪 Temporary: Still using Supabase directly for posts until posts API is implemented
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data, error: supabaseError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:admin_profiles(id, name, email, avatar_url),
          categories:blog_post_categories(
            category:categories(id, name, slug, description)
          ),
          tags:blog_post_tags(
            tag:tags(id, name, slug)
          )
        `)
        .eq('id', id)
        .single()

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }

      if (data) {
        // 🎨 Transform the data to match our BlogPost interface
         const transformedPost: BlogPost = {
           id: data.id,
           slug: data.slug,
           title: data.title,
           content: data.content,
           excerpt: data.excerpt,
           featured_image_url: data.featured_image_url,
           author_id: data.author?.id || 0,
           status: data.status,
           template_type: data.template_type,
           reading_time: data.reading_time,
           revision_number: data.revision_number || 1,
           created_at: data.created_at,
           updated_at: data.updated_at,
           published_at: data.published_at,
           title_translations: data.title_translations || {},
           content_translations: data.content_translations || {},
           excerpt_translations: data.excerpt_translations || {},
           audio_assets_by_language: data.audio_assets_by_language || {},
           seo_metadata: data.seo_metadata || {},
           author: data.author ? {
              id: data.author.id,
              name: data.author.name,
              email: data.author.email,
              avatar_url: data.author.avatar_url
            } : undefined,
           categories: data.categories?.map((pc: any) => pc.category) || [],
           tags: data.tags?.map((pt: any) => pt.tag) || []
         }
        
        setPost(transformedPost)
        
        // 🎵 Automatically fetch audio assets after loading the post
        fetchAudioAssets()
      }
    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? `API Error (${err.code}): ${err.message}`
        : err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred during the performance'
      
      setError(errorMessage)
      console.error('🎭 Post fetching performance failed:', err)
    } finally {
      setLoading(false)
    }
  }, [id, fetchAudioAssets])

  // 🎪 Add a new audio asset to the post
  const addAudioAsset = useCallback(async (assetData: AudioAssetData) => {
    if (!id) throw new Error('No post ID provided')
    
    try {
      setAudioLoading(true)
      setAudioError(null)
      
      const response = await apiClient.addPostAudioAsset(id, assetData)
      
      if (response.success && response.data) {
         // 🎭 Update local state with the new asset
         setAudioAssets(prev => [...prev, response.data!])
       } else {
         throw new Error(response.message || 'Failed to add audio asset')
       }
    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? `Failed to add audio asset (${err.code}): ${err.message}`
        : err instanceof Error 
        ? err.message 
        : 'Failed to add audio asset'
      
      setAudioError(errorMessage)
      throw err // Re-throw for component handling
    } finally {
      setAudioLoading(false)
    }
  }, [id])

  // 🎨 Set the primary audio for the post
  const setPrimaryAudio = useCallback(async (audioData: PrimaryAudioData) => {
    if (!id) throw new Error('No post ID provided')
    
    try {
      setAudioLoading(true)
      setAudioError(null)
      
      const response = await apiClient.setPostPrimaryAudio(id, audioData)
      
      if (response.success) {
         // 🎪 Refresh audio assets to reflect the primary audio change
         await fetchAudioAssets()
       } else {
         throw new Error(response.message || 'Failed to set primary audio')
       }
    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? `Failed to set primary audio (${err.code}): ${err.message}`
        : err instanceof Error 
        ? err.message 
        : 'Failed to set primary audio'
      
      setAudioError(errorMessage)
      throw err // Re-throw for component handling
    } finally {
      setAudioLoading(false)
    }
  }, [id, fetchAudioAssets])

  // 🎬 Create a new audio job
  const createAudioJob = useCallback(async (jobData: Omit<AudioJobData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AudioJobData> => {
    try {
      const response = await apiClient.createAudioJob({
         ...jobData,
         post_id: id // Associate with current post
       })
      
      if (response.success && response.data) {
         return response.data
       } else {
         throw new Error(response.message || 'Failed to create audio job')
       }
    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? `Failed to create audio job (${err.code}): ${err.message}`
        : err instanceof Error 
        ? err.message 
        : 'Failed to create audio job'
      
      console.error('🎬 Audio job creation failed:', err)
      throw new Error(errorMessage)
    }
  }, [id])

  // 🎭 Get audio jobs for the current post
  const getAudioJobs = useCallback(async (): Promise<AudioJobData[]> => {
    if (!id) return []
    
    try {
      const response = await apiClient.listAudioJobs({ postId: id })
      
      if (response.success && response.data) {
         return response.data
       } else {
         throw new Error(response.message || 'Failed to fetch audio jobs')
       }
    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? `Failed to fetch audio jobs (${err.code}): ${err.message}`
        : err instanceof Error 
        ? err.message 
        : 'Failed to fetch audio jobs'
      
      console.error('🎭 Audio jobs fetching failed:', err)
      throw new Error(errorMessage)
    }
  }, [id])

  // 🎪 Effect to fetch post data when ID changes
  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id, fetchPost, fetchAudioAssets])

  // 🎭 Return our theatrical interface
  return {
    // Core post data
    post,
    loading,
    error,
    
    // Audio-related data and states
    audioAssets,
    audioLoading,
    audioError,
    
    // Audio management functions
    refreshAudioAssets: fetchAudioAssets,
    addAudioAsset,
    setPrimaryAudio,
    
    // Audio job management
    createAudioJob,
    getAudioJobs
  }
}

