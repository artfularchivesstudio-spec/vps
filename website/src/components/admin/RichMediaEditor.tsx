'use client'

import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'

// Define the content block types
type ContentBlockType = 'text' | 'image' | 'video' | 'quote' | 'gallery' | 'reference'

interface ContentBlock {
  id: string
  type: ContentBlockType
  content: any
  metadata?: any
}

interface TextBlock {
  text: string
  style: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'list' | 'code'
}

interface ImageBlock {
  url: string
  caption?: string
  alt?: string
  width?: number
  height?: number
  alignment: 'left' | 'center' | 'right' | 'full'
}

interface VideoBlock {
  url: string
  caption?: string
  thumbnail?: string
  provider: 'youtube' | 'vimeo' | 'native'
  subtitles?: {
    language: string
    srt_url?: string
    vtt_url?: string
    label: string
  }[]
}

interface QuoteBlock {
  text: string
  author?: string
  citation?: string
  style: 'simple' | 'pullquote' | 'blockquote'
}

interface GalleryBlock {
  images: ImageBlock[]
  layout: 'grid' | 'carousel' | 'masonry'
  columns: number
}

interface ReferenceBlock {
  title: string
  type: 'article' | 'artwork' | 'book' | 'website'
  url?: string
  author?: string
  date?: string
  description?: string
}

interface RichMediaEditorProps {
  initialContent?: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
  className?: string
}

export default function RichMediaEditor({ initialContent = [], onChange, className }: RichMediaEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialContent)
  const [activeBlock, setActiveBlock] = useState<string | null>(null)
  const [showBlockSelector, setShowBlockSelector] = useState(false)
  const [insertAfterBlock, setInsertAfterBlock] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate unique ID for new blocks
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

  // Update blocks and notify parent
  const updateBlocks = useCallback((newBlocks: ContentBlock[]) => {
    setBlocks(newBlocks)
    onChange(newBlocks)
  }, [onChange])

  // Get default content for block type
  const getDefaultContent = useCallback((type: ContentBlockType) => {
    switch (type) {
      case 'text':
        return { text: '', style: 'paragraph' } as TextBlock
      case 'image':
        return { url: '', caption: '', alt: '', alignment: 'center' } as ImageBlock
      case 'video':
        return { url: '', caption: '', provider: 'native', subtitles: [] } as VideoBlock
      case 'quote':
        return { text: '', author: '', style: 'simple' } as QuoteBlock
      case 'gallery':
        return { images: [], layout: 'grid', columns: 3 } as GalleryBlock
      case 'reference':
        return { title: '', type: 'article', description: '' } as ReferenceBlock
      default:
        return {}
    }
  }, [])

  // Add new block
  const addBlock = useCallback((type: ContentBlockType, insertAfter?: string) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: getDefaultContent(type),
      metadata: {}
    }

    if (insertAfter) {
      const insertIndex = blocks.findIndex(b => b.id === insertAfter)
      const newBlocks = [...blocks]
      newBlocks.splice(insertIndex + 1, 0, newBlock)
      updateBlocks(newBlocks)
    } else {
      updateBlocks([...blocks, newBlock])
    }

    setActiveBlock(newBlock.id)
    setShowBlockSelector(false)
  }, [blocks, updateBlocks, getDefaultContent])

  // Update specific block
  const updateBlock = useCallback((id: string, updates: Partial<ContentBlock>) => {
    const newBlocks = blocks.map(block => 
      block.id === id 
        ? { ...block, ...updates }
        : block
    )
    updateBlocks(newBlocks)
  }, [blocks, updateBlocks])

  // Delete block
  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter(block => block.id !== id)
    updateBlocks(newBlocks)
    setActiveBlock(null)
  }

  // Move block up/down
  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const currentIndex = blocks.findIndex(b => b.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= blocks.length) return

    const newBlocks = [...blocks]
    const [movedBlock] = newBlocks.splice(currentIndex, 1)
    newBlocks.splice(newIndex, 0, movedBlock)
    updateBlocks(newBlocks)
  }

  // Handle file upload
  const handleFileUpload = useCallback((files: File[], blockId?: string) => {
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target?.result as string
        
        if (file.type.startsWith('image/')) {
          if (blockId) {
            updateBlock(blockId, {
              content: {
                url,
                caption: '',
                alt: file.name,
                alignment: 'center'
              }
            })
          } else {
            addBlock('image')
            // Update the last added block with the image
            setTimeout(() => {
              const lastBlock = blocks[blocks.length - 1]
              if (lastBlock) {
                updateBlock(lastBlock.id, {
                  content: {
                    url,
                    caption: '',
                    alt: file.name,
                    alignment: 'center'
                  }
                })
              }
            }, 100)
          }
        } else if (file.type.startsWith('video/')) {
          if (blockId) {
            updateBlock(blockId, {
              content: {
                url,
                caption: '',
                provider: 'native'
              }
            })
          } else {
            addBlock('video')
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }, [blocks, updateBlock, addBlock])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => handleFileUpload(acceptedFiles),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.ogg']
    },
    noClick: true,
    noKeyboard: true
  })

  // Block type selector
  const BlockSelector = () => (
    <AnimatePresence>
      {showBlockSelector && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-20 bg-white rounded-lg shadow-xl border border-gray-200 p-2 grid grid-cols-2 gap-2 w-64"
        >
          {[
            { type: 'text', icon: '📝', label: 'Text' },
            { type: 'image', icon: '🖼️', label: 'Image' },
            { type: 'video', icon: '🎥', label: 'Video' },
            { type: 'quote', icon: '💬', label: 'Quote' },
            { type: 'gallery', icon: '🖼️', label: 'Gallery' },
            { type: 'reference', icon: '📚', label: 'Reference' }
          ].map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => addBlock(type as ContentBlockType, insertAfterBlock)}
              className="flex items-center gap-2 p-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className={`relative ${className}`} {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg z-30 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📎</div>
            <p className="text-lg font-medium text-blue-700">Drop files to add to your content</p>
          </div>
        </div>
      )}

      {/* Content blocks */}
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <ContentBlockRenderer
            key={block.id}
            block={block}
            isActive={activeBlock === block.id}
            onActivate={() => setActiveBlock(block.id)}
            onUpdate={(updates) => updateBlock(block.id, updates)}
            onDelete={() => deleteBlock(block.id)}
            onMoveUp={() => moveBlock(block.id, 'up')}
            onMoveDown={() => moveBlock(block.id, 'down')}
            onAddAfter={() => {
              setInsertAfterBlock(block.id)
              setShowBlockSelector(true)
            }}
            canMoveUp={index > 0}
            canMoveDown={index < blocks.length - 1}
          />
        ))}
      </div>

      {/* Add first block button */}
      {blocks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">Start creating your rich media content</p>
          <button
            onClick={() => setShowBlockSelector(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Block
          </button>
        </div>
      )}

      {/* Add block button */}
      {blocks.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setInsertAfterBlock('')
              setShowBlockSelector(true)
            }}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Block
          </button>
        </div>
      )}

      {/* Block selector */}
      <div className="relative">
        <BlockSelector />
      </div>
    </div>
  )
}

// Content block renderer component
interface ContentBlockRendererProps {
  block: ContentBlock
  isActive: boolean
  onActivate: () => void
  onUpdate: (updates: Partial<ContentBlock>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAddAfter: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

function ContentBlockRenderer({
  block,
  isActive,
  onActivate,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddAfter,
  canMoveUp,
  canMoveDown
}: ContentBlockRendererProps) {
  const [showControls, setShowControls] = useState(false)

  return (
    <div
      className={`group relative border-2 border-transparent rounded-lg transition-all ${
        isActive ? 'border-blue-300 bg-blue-50' : 'hover:border-gray-200 hover:bg-gray-50'
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={onActivate}
    >
      {/* Block controls */}
      <AnimatePresence>
        {(showControls || isActive) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-2 right-2 z-10 flex gap-1"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMoveUp()
              }}
              disabled={!canMoveUp}
              className="p-1 bg-white shadow-sm border rounded text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMoveDown()
              }}
              disabled={!canMoveDown}
              className="p-1 bg-white shadow-sm border rounded text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddAfter()
              }}
              className="p-1 bg-white shadow-sm border rounded text-gray-600 hover:text-gray-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-1 bg-white shadow-sm border rounded text-red-600 hover:text-red-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block content */}
      <div className="p-4">
        {block.type === 'text' && (
          <TextBlockEditor
            content={block.content as TextBlock}
            onChange={(content) => onUpdate({ content })}
            isActive={isActive}
          />
        )}
        {block.type === 'image' && (
          <ImageBlockEditor
            content={block.content as ImageBlock}
            onChange={(content) => onUpdate({ content })}
            isActive={isActive}
          />
        )}
        {block.type === 'video' && (
          <VideoBlockEditor
            content={block.content as VideoBlock}
            onChange={(content) => onUpdate({ content })}
            isActive={isActive}
          />
        )}
        {block.type === 'quote' && (
          <QuoteBlockEditor
            content={block.content as QuoteBlock}
            onChange={(content) => onUpdate({ content })}
            isActive={isActive}
          />
        )}
        {block.type === 'gallery' && (
          <GalleryBlockEditor
            content={block.content as GalleryBlock}
            onChange={(content) => onUpdate({ content })}
            isActive={isActive}
          />
        )}
        {block.type === 'reference' && (
          <ReferenceBlockEditor
            content={block.content as ReferenceBlock}
            onChange={(content) => onUpdate({ content })}
            isActive={isActive}
          />
        )}
      </div>
    </div>
  )
}

// Individual block editors (simplified versions - can be expanded)
function TextBlockEditor({ content, onChange, isActive }: { content: TextBlock; onChange: (content: TextBlock) => void; isActive: boolean }) {
  return (
    <div className="space-y-2">
      {isActive && (
        <select
          value={content.style}
          onChange={(e) => onChange({ ...content, style: e.target.value as TextBlock['style'] })}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="paragraph">Paragraph</option>
          <option value="heading1">Heading 1</option>
          <option value="heading2">Heading 2</option>
          <option value="heading3">Heading 3</option>
          <option value="list">List</option>
          <option value="code">Code</option>
        </select>
      )}
      <textarea
        value={content.text}
        onChange={(e) => onChange({ ...content, text: e.target.value })}
        placeholder="Enter your text here..."
        className="w-full min-h-[100px] border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{
          fontSize: content.style === 'heading1' ? '2rem' : 
                   content.style === 'heading2' ? '1.5rem' : 
                   content.style === 'heading3' ? '1.25rem' : '1rem',
          fontWeight: content.style.startsWith('heading') ? 'bold' : 'normal',
          fontFamily: content.style === 'code' ? 'monospace' : 'inherit'
        }}
      />
    </div>
  )
}

function ImageBlockEditor({ content, onChange, isActive }: { content: ImageBlock; onChange: (content: ImageBlock) => void; isActive: boolean }) {
  return (
    <div className="space-y-4">
      {content.url ? (
        <div className="relative">
          <Image
            src={content.url}
            alt={content.alt || ''}
            width={content.width || 400}
            height={content.height || 300}
            className="rounded-lg object-cover"
          />
          {isActive && (
            <button
              onClick={() => onChange({ ...content, url: '' })}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">Drop image here or click to upload</p>
        </div>
      )}
      
      {isActive && (
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={content.caption || ''}
            onChange={(e) => onChange({ ...content, caption: e.target.value })}
            placeholder="Image caption..."
            className="border rounded px-3 py-2 text-sm"
          />
          <select
            value={content.alignment}
            onChange={(e) => onChange({ ...content, alignment: e.target.value as ImageBlock['alignment'] })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="full">Full Width</option>
          </select>
        </div>
      )}
    </div>
  )
}

function VideoBlockEditor({ content, onChange, isActive }: { content: VideoBlock; onChange: (content: VideoBlock) => void; isActive: boolean }) {
  const addSubtitle = () => {
    const newSubtitle = {
      language: 'en',
      label: 'English',
      srt_url: '',
      vtt_url: ''
    }
    onChange({
      ...content,
      subtitles: [...(content.subtitles || []), newSubtitle]
    })
  }

  const updateSubtitle = (index: number, updates: Partial<NonNullable<VideoBlock['subtitles']>[0]>) => {
    const newSubtitles = [...(content.subtitles || [])]
    newSubtitles[index] = { ...newSubtitles[index], ...updates }
    onChange({ ...content, subtitles: newSubtitles })
  }

  const removeSubtitle = (index: number) => {
    const newSubtitles = [...(content.subtitles || [])]
    newSubtitles.splice(index, 1)
    onChange({ ...content, subtitles: newSubtitles })
  }

  return (
    <div className="space-y-4">
      {content.url ? (
        <div className="relative">
          <video
            src={content.url}
            controls
            className="w-full rounded-lg"
            poster={content.thumbnail}
          >
            {/* Add subtitle tracks */}
            {content.subtitles?.map((subtitle, index) => (
              <track
                key={index}
                kind="subtitles"
                src={subtitle.vtt_url || subtitle.srt_url}
                srcLang={subtitle.language}
                label={subtitle.label}
                default={index === 0}
              />
            ))}
          </video>
          {isActive && (
            <button
              onClick={() => onChange({ ...content, url: '' })}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">Drop video here or enter URL</p>
        </div>
      )}
      
      {isActive && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={content.url}
              onChange={(e) => onChange({ ...content, url: e.target.value })}
              placeholder="Video URL..."
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={content.caption || ''}
              onChange={(e) => onChange({ ...content, caption: e.target.value })}
              placeholder="Video caption..."
              className="border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Subtitle Management */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Subtitles</h4>
              <button
                onClick={addSubtitle}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Add Subtitle
              </button>
            </div>
            
            {content.subtitles?.map((subtitle, index) => (
              <div key={index} className="bg-white rounded p-3 mb-2 border">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={subtitle.language}
                    onChange={(e) => updateSubtitle(index, { language: e.target.value })}
                    placeholder="Language code (e.g., en, es)"
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    value={subtitle.label}
                    onChange={(e) => updateSubtitle(index, { label: e.target.value })}
                    placeholder="Display label (e.g., English)"
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="text"
                    value={subtitle.srt_url || ''}
                    onChange={(e) => updateSubtitle(index, { srt_url: e.target.value })}
                    placeholder="SRT file URL..."
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    value={subtitle.vtt_url || ''}
                    onChange={(e) => updateSubtitle(index, { vtt_url: e.target.value })}
                    placeholder="VTT file URL..."
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>
                <button
                  onClick={() => removeSubtitle(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            
            {(!content.subtitles || content.subtitles.length === 0) && (
              <p className="text-gray-500 text-sm">No subtitles added yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function QuoteBlockEditor({ content, onChange, isActive }: { content: QuoteBlock; onChange: (content: QuoteBlock) => void; isActive: boolean }) {
  return (
    <div className="space-y-4">
      <div className={`relative ${content.style === 'pullquote' ? 'text-xl font-medium' : 'text-base'}`}>
        {content.style === 'blockquote' && (
          <div className="absolute left-0 top-0 w-1 h-full bg-gray-300 rounded"></div>
        )}
        <div className={content.style === 'blockquote' ? 'ml-6' : ''}>
          <textarea
            value={content.text}
            onChange={(e) => onChange({ ...content, text: e.target.value })}
            placeholder="Enter quote text..."
            className="w-full min-h-[80px] border-none bg-transparent resize-none focus:outline-none"
          />
          {content.author && (
            <p className="text-sm text-gray-600 mt-2">— {content.author}</p>
          )}
        </div>
      </div>
      
      {isActive && (
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={content.author || ''}
            onChange={(e) => onChange({ ...content, author: e.target.value })}
            placeholder="Quote author..."
            className="border rounded px-3 py-2 text-sm"
          />
          <select
            value={content.style}
            onChange={(e) => onChange({ ...content, style: e.target.value as QuoteBlock['style'] })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="simple">Simple</option>
            <option value="pullquote">Pull Quote</option>
            <option value="blockquote">Block Quote</option>
          </select>
        </div>
      )}
    </div>
  )
}

function GalleryBlockEditor({ content, onChange, isActive }: { content: GalleryBlock; onChange: (content: GalleryBlock) => void; isActive: boolean }) {
  return (
    <div className="space-y-4">
      <div className={`grid gap-4 ${content.layout === 'grid' ? `grid-cols-${content.columns}` : 'grid-cols-1'}`}>
        {content.images.map((image, index) => (
          <div key={index} className="relative">
            <Image
              src={image.url}
              alt={image.alt || ''}
              width={200}
              height={150}
              className="rounded-lg object-cover w-full h-32"
            />
            {isActive && (
              <button
                onClick={() => {
                  const newImages = content.images.filter((_, i) => i !== index)
                  onChange({ ...content, images: newImages })
                }}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        
        {content.images.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">Drop images here to create gallery</p>
          </div>
        )}
      </div>
      
      {isActive && (
        <div className="grid grid-cols-2 gap-4">
          <select
            value={content.layout}
            onChange={(e) => onChange({ ...content, layout: e.target.value as GalleryBlock['layout'] })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="grid">Grid</option>
            <option value="carousel">Carousel</option>
            <option value="masonry">Masonry</option>
          </select>
          <input
            type="number"
            value={content.columns}
            onChange={(e) => onChange({ ...content, columns: parseInt(e.target.value) })}
            min="1"
            max="6"
            placeholder="Columns..."
            className="border rounded px-3 py-2 text-sm"
          />
        </div>
      )}
    </div>
  )
}

function ReferenceBlockEditor({ content, onChange, isActive }: { content: ReferenceBlock; onChange: (content: ReferenceBlock) => void; isActive: boolean }) {
  return (
    <div className="space-y-4">
      <div className="border-l-4 border-blue-500 pl-4">
        <h3 className="font-semibold text-lg">{content.title || 'Reference Title'}</h3>
        {content.author && <p className="text-sm text-gray-600">by {content.author}</p>}
        {content.description && <p className="text-sm text-gray-700 mt-2">{content.description}</p>}
        {content.url && (
          <a href={content.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
            View Source →
          </a>
        )}
      </div>
      
      {isActive && (
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={content.title}
            onChange={(e) => onChange({ ...content, title: e.target.value })}
            placeholder="Reference title..."
            className="border rounded px-3 py-2 text-sm"
          />
          <select
            value={content.type}
            onChange={(e) => onChange({ ...content, type: e.target.value as ReferenceBlock['type'] })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="article">Article</option>
            <option value="artwork">Artwork</option>
            <option value="book">Book</option>
            <option value="website">Website</option>
          </select>
          <input
            type="text"
            value={content.author || ''}
            onChange={(e) => onChange({ ...content, author: e.target.value })}
            placeholder="Author..."
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={content.url || ''}
            onChange={(e) => onChange({ ...content, url: e.target.value })}
            placeholder="URL..."
            className="border rounded px-3 py-2 text-sm"
          />
          <textarea
            value={content.description || ''}
            onChange={(e) => onChange({ ...content, description: e.target.value })}
            placeholder="Description..."
            className="col-span-2 border rounded px-3 py-2 text-sm min-h-[60px]"
          />
        </div>
      )}
    </div>
  )
}