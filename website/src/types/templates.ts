export interface ContentTemplate {
  id: string
  name: string
  category: TemplateCategory
  description: string
  icon: string
  preview_image?: string
  structure: TemplateSection[]
  metadata: TemplateMetadata
  created_at: string
  updated_at: string
}

export interface TemplateSection {
  id: string
  name: string
  type: SectionType
  required: boolean
  order: number
  placeholder?: string
  ai_prompt?: string
  max_length?: number
  media_types?: MediaType[]
  sub_sections?: TemplateSection[]
}

export type TemplateCategory = 
  | 'art-critique'
  | 'exhibition'
  | 'educational'
  | 'artist-feature'
  | 'news-update'
  | 'portfolio'
  | 'tutorial'

export type SectionType = 
  | 'title'
  | 'subtitle' 
  | 'text'
  | 'rich-text'
  | 'image'
  | 'image-gallery'
  | 'video'
  | 'audio'
  | 'quote'
  | 'list'
  | 'metadata'
  | 'tags'
  | 'divider'
  | 'call-to-action'

export type MediaType = 'image' | 'video' | 'audio' | 'document'

export interface TemplateMetadata {
  target_audience: string[]
  estimated_time: number // minutes to complete
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  seo_optimized: boolean
  social_media_ready: boolean
  accessibility_features: string[]
}

export interface TemplateInstance {
  id: string
  template_id: string
  title: string
  content: SectionContent[]
  status: 'draft' | 'in-progress' | 'review' | 'published'
  author_id: string
  created_at: string
  updated_at: string
  published_at?: string
}

export interface SectionContent {
  section_id: string
  content: any // flexible content based on section type
  ai_generated: boolean
  reviewed: boolean
  media_files?: MediaFile[]
}

export interface MediaFile {
  id: string
  type: MediaType
  url: string
  alt_text?: string
  caption?: string
  metadata?: Record<string, any>
}

// Template generation and AI prompts
export interface AITemplatePrompt {
  section_id: string
  base_prompt: string
  context_variables: string[]
  examples?: string[]
  tone: 'formal' | 'casual' | 'academic' | 'conversational'
  max_tokens: number
}

// Template customization
export interface TemplateCustomization {
  template_id: string
  user_id: string
  custom_sections: TemplateSection[]
  hidden_sections: string[]
  default_values: Record<string, any>
  style_preferences: StylePreferences
}

export interface StylePreferences {
  tone: 'formal' | 'casual' | 'academic' | 'conversational'
  length: 'concise' | 'standard' | 'detailed'
  technical_level: 'beginner' | 'intermediate' | 'expert'
  include_citations: boolean
  include_social_elements: boolean
}