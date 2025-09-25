import { ContentTemplate } from '@/types/templates'

export const contentTemplates: ContentTemplate[] = [
  {
    id: 'art-critique-formal',
    name: 'Formal Art Analysis',
    category: 'art-critique',
    description: 'Professional art critique template focusing on formal elements, composition, and technique analysis',
    icon: '🎨',
    preview_image: '/templates/art-critique-preview.jpg',
    structure: [
      {
        id: 'title',
        name: 'Artwork Title & Artist',
        type: 'title',
        required: true,
        order: 1,
        placeholder: 'Enter artwork title and artist name',
        ai_prompt: 'Generate a compelling title for an art analysis featuring [ARTWORK] by [ARTIST]'
      },
      {
        id: 'artwork-image',
        name: 'Primary Artwork Image',
        type: 'image',
        required: true,
        order: 2,
        media_types: ['image'],
        placeholder: 'Upload the main artwork image for analysis'
      },
      {
        id: 'basic-info',
        name: 'Artwork Information',
        type: 'metadata',
        required: true,
        order: 3,
        placeholder: 'Medium, dimensions, year, collection',
        ai_prompt: 'Extract and format basic artwork information from the provided details'
      },
      {
        id: 'first-impression',
        name: 'Initial Response',
        type: 'text',
        required: true,
        order: 4,
        max_length: 300,
        placeholder: 'Describe your immediate reaction to the artwork',
        ai_prompt: 'Write a compelling opening paragraph describing the immediate visual impact and emotional response to this artwork'
      },
      {
        id: 'formal-analysis',
        name: 'Formal Analysis',
        type: 'rich-text',
        required: true,
        order: 5,
        placeholder: 'Analyze line, shape, color, texture, space, and composition',
        ai_prompt: 'Provide a detailed formal analysis examining the visual elements: line, shape, form, color, texture, space, and overall composition',
        sub_sections: [
          {
            id: 'composition',
            name: 'Composition & Layout',
            type: 'text',
            required: true,
            order: 1,
            placeholder: 'Discuss the arrangement of elements',
            ai_prompt: 'Analyze the compositional structure, balance, and visual flow'
          },
          {
            id: 'color-analysis',
            name: 'Color & Light',
            type: 'text',
            required: true,
            order: 2,
            placeholder: 'Examine color palette, contrast, and lighting',
            ai_prompt: 'Examine the color relationships, palette choices, and use of light and shadow'
          },
          {
            id: 'technique',
            name: 'Technique & Materials',
            type: 'text',
            required: true,
            order: 3,
            placeholder: 'Discuss the artist\'s technique and material choices',
            ai_prompt: 'Analyze the artistic technique, brushwork, and material choices'
          }
        ]
      },
      {
        id: 'contextual-analysis',
        name: 'Historical & Cultural Context',
        type: 'rich-text',
        required: false,
        order: 6,
        placeholder: 'Place the work in its historical and cultural context',
        ai_prompt: 'Discuss the historical period, cultural influences, and artistic movement context'
      },
      {
        id: 'interpretation',
        name: 'Interpretation & Meaning',
        type: 'rich-text',
        required: true,
        order: 7,
        placeholder: 'Interpret the artwork\'s meaning and significance',
        ai_prompt: 'Provide thoughtful interpretation of the artwork\'s themes, symbolism, and cultural significance'
      },
      {
        id: 'comparison-images',
        name: 'Comparative Works',
        type: 'image-gallery',
        required: false,
        order: 8,
        media_types: ['image'],
        placeholder: 'Add related artworks for comparison'
      },
      {
        id: 'conclusion',
        name: 'Critical Assessment',
        type: 'text',
        required: true,
        order: 9,
        max_length: 400,
        placeholder: 'Conclude with your critical assessment',
        ai_prompt: 'Write a thoughtful conclusion that synthesizes the analysis and offers a critical assessment of the artwork\'s success and significance'
      },
      {
        id: 'tags',
        name: 'Tags & Keywords',
        type: 'tags',
        required: false,
        order: 10,
        placeholder: 'Add relevant tags',
        ai_prompt: 'Generate relevant tags based on the artwork, artist, style, and themes discussed'
      }
    ],
    metadata: {
      target_audience: ['art students', 'art professionals', 'gallery visitors'],
      estimated_time: 45,
      difficulty_level: 'intermediate',
      seo_optimized: true,
      social_media_ready: true,
      accessibility_features: ['alt text', 'structured headings', 'semantic markup']
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'exhibition-review',
    name: 'Exhibition Review',
    category: 'exhibition',
    description: 'Comprehensive template for reviewing art exhibitions, gallery shows, and museum displays',
    icon: '🏛️',
    preview_image: '/templates/exhibition-review-preview.jpg',
    structure: [
      {
        id: 'title',
        name: 'Review Title',
        type: 'title',
        required: true,
        order: 1,
        placeholder: 'Create an engaging review title',
        ai_prompt: 'Generate an engaging title for a review of [EXHIBITION] at [VENUE]'
      },
      {
        id: 'exhibition-hero',
        name: 'Exhibition Image',
        type: 'image',
        required: true,
        order: 2,
        media_types: ['image'],
        placeholder: 'Main exhibition photo or artwork'
      },
      {
        id: 'exhibition-details',
        name: 'Exhibition Information',
        type: 'metadata',
        required: true,
        order: 3,
        placeholder: 'Gallery, dates, curator, artist(s)',
        ai_prompt: 'Format exhibition details including venue, dates, curator, and featured artists'
      },
      {
        id: 'opening-statement',
        name: 'Opening Impression',
        type: 'text',
        required: true,
        order: 4,
        max_length: 250,
        placeholder: 'Set the scene and first impressions',
        ai_prompt: 'Write an engaging opening that captures the atmosphere and immediate impression of the exhibition'
      },
      {
        id: 'curatorial-concept',
        name: 'Curatorial Vision',
        type: 'rich-text',
        required: true,
        order: 5,
        placeholder: 'Discuss the curatorial concept and theme',
        ai_prompt: 'Explain the curatorial concept, thematic framework, and how the exhibition is organized'
      },
      {
        id: 'key-artworks',
        name: 'Standout Artworks',
        type: 'rich-text',
        required: true,
        order: 6,
        placeholder: 'Highlight 2-3 exceptional pieces',
        ai_prompt: 'Discuss the most compelling artworks in the exhibition, focusing on their impact and significance'
      },
      {
        id: 'artwork-gallery',
        name: 'Exhibition Gallery',
        type: 'image-gallery',
        required: false,
        order: 7,
        media_types: ['image'],
        placeholder: 'Additional exhibition and artwork photos'
      },
      {
        id: 'spatial-experience',
        name: 'Gallery Space & Design',
        type: 'text',
        required: false,
        order: 8,
        placeholder: 'Comment on the installation and gallery design',
        ai_prompt: 'Describe how the artworks are installed and how the gallery space enhances or detracts from the viewing experience'
      },
      {
        id: 'critical-assessment',
        name: 'Critical Analysis',
        type: 'rich-text',
        required: true,
        order: 9,
        placeholder: 'Your critical take on the exhibition\'s success',
        ai_prompt: 'Provide a balanced critical assessment of the exhibition\'s strengths, weaknesses, and overall success'
      },
      {
        id: 'visitor-info',
        name: 'Visitor Information',
        type: 'metadata',
        required: true,
        order: 10,
        placeholder: 'Practical information for visitors',
        ai_prompt: 'Provide practical visitor information including hours, admission, accessibility, and special programs'
      },
      {
        id: 'recommendation',
        name: 'Final Recommendation',
        type: 'call-to-action',
        required: true,
        order: 11,
        placeholder: 'Recommend whether readers should visit',
        ai_prompt: 'Write a clear recommendation about whether readers should visit this exhibition and why'
      }
    ],
    metadata: {
      target_audience: ['art enthusiasts', 'gallery visitors', 'art collectors'],
      estimated_time: 35,
      difficulty_level: 'beginner',
      seo_optimized: true,
      social_media_ready: true,
      accessibility_features: ['alt text', 'clear navigation', 'practical information']
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'artist-interview',
    name: 'Artist Interview',
    category: 'artist-feature',
    description: 'In-depth artist interview template covering background, process, and artistic philosophy',
    icon: '🎭',
    preview_image: '/templates/artist-interview-preview.jpg',
    structure: [
      {
        id: 'title',
        name: 'Interview Title',
        type: 'title',
        required: true,
        order: 1,
        placeholder: 'Create an compelling interview headline',
        ai_prompt: 'Generate an engaging interview title featuring [ARTIST NAME] that hints at their artistic focus or recent work'
      },
      {
        id: 'artist-portrait',
        name: 'Artist Portrait',
        type: 'image',
        required: true,
        order: 2,
        media_types: ['image'],
        placeholder: 'Professional photo of the artist'
      },
      {
        id: 'introduction',
        name: 'Artist Introduction',
        type: 'text',
        required: true,
        order: 3,
        max_length: 300,
        placeholder: 'Brief introduction to the artist and their work',
        ai_prompt: 'Write an engaging introduction that establishes who the artist is, their medium, and what makes their work distinctive'
      },
      {
        id: 'background-qa',
        name: 'Background & Journey',
        type: 'rich-text',
        required: true,
        order: 4,
        placeholder: 'Q&A about the artist\'s background and journey',
        ai_prompt: 'Create interview questions and answers about the artist\'s educational background, early influences, and artistic journey',
        sub_sections: [
          {
            id: 'education',
            name: 'Training & Education',
            type: 'text',
            required: false,
            order: 1,
            placeholder: 'Educational background and training'
          },
          {
            id: 'influences',
            name: 'Early Influences',
            type: 'text',
            required: true,
            order: 2,
            placeholder: 'Formative influences and inspirations'
          }
        ]
      },
      {
        id: 'artistic-process',
        name: 'Creative Process',
        type: 'rich-text',
        required: true,
        order: 5,
        placeholder: 'Deep dive into how the artist works',
        ai_prompt: 'Explore the artist\'s creative process, studio practice, and approach to making art'
      },
      {
        id: 'studio-images',
        name: 'Studio & Process Photos',
        type: 'image-gallery',
        required: false,
        order: 6,
        media_types: ['image', 'video'],
        placeholder: 'Behind-the-scenes studio and process documentation'
      },
      {
        id: 'recent-work',
        name: 'Current Projects',
        type: 'rich-text',
        required: true,
        order: 7,
        placeholder: 'Discussion of recent and upcoming work',
        ai_prompt: 'Discuss the artist\'s most recent work, current projects, and artistic evolution'
      },
      {
        id: 'artwork-showcase',
        name: 'Featured Artworks',
        type: 'image-gallery',
        required: true,
        order: 8,
        media_types: ['image'],
        placeholder: 'Showcase of the artist\'s key works'
      },
      {
        id: 'philosophy',
        name: 'Artistic Philosophy',
        type: 'rich-text',
        required: true,
        order: 9,
        placeholder: 'Deeper questions about meaning and intention',
        ai_prompt: 'Explore the artist\'s artistic philosophy, themes they explore, and what drives their creative practice'
      },
      {
        id: 'advice',
        name: 'Advice & Insights',
        type: 'quote',
        required: false,
        order: 10,
        placeholder: 'Notable quotes or advice from the artist',
        ai_prompt: 'Extract the most insightful or quotable moments from the interview'
      },
      {
        id: 'future-plans',
        name: 'Looking Forward',
        type: 'text',
        required: false,
        order: 11,
        placeholder: 'Upcoming exhibitions, projects, or goals',
        ai_prompt: 'Discuss the artist\'s future plans, upcoming exhibitions, and artistic goals'
      },
      {
        id: 'contact-info',
        name: 'Artist Information',
        type: 'metadata',
        required: true,
        order: 12,
        placeholder: 'Website, social media, gallery representation',
        ai_prompt: 'Format the artist\'s contact information, website, and professional representation'
      }
    ],
    metadata: {
      target_audience: ['art collectors', 'art students', 'gallery visitors', 'art professionals'],
      estimated_time: 60,
      difficulty_level: 'intermediate',
      seo_optimized: true,
      social_media_ready: true,
      accessibility_features: ['alt text', 'clear structure', 'contact information']
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  {
    id: 'technique-tutorial',
    name: 'Art Technique Tutorial',
    category: 'educational',
    description: 'Step-by-step tutorial template for teaching art techniques and processes',
    icon: '📚',
    preview_image: '/templates/tutorial-preview.jpg',
    structure: [
      {
        id: 'title',
        name: 'Tutorial Title',
        type: 'title',
        required: true,
        order: 1,
        placeholder: 'Clear, descriptive tutorial title',
        ai_prompt: 'Create a clear, SEO-friendly title for a tutorial on [TECHNIQUE] that indicates skill level and outcome'
      },
      {
        id: 'finished-example',
        name: 'Finished Example',
        type: 'image',
        required: true,
        order: 2,
        media_types: ['image'],
        placeholder: 'Photo of the completed artwork or technique'
      },
      {
        id: 'overview',
        name: 'Tutorial Overview',
        type: 'text',
        required: true,
        order: 3,
        max_length: 200,
        placeholder: 'Brief overview of what students will learn',
        ai_prompt: 'Write a concise overview explaining what technique will be taught and what the student will achieve'
      },
      {
        id: 'skill-level',
        name: 'Skill Level & Time',
        type: 'metadata',
        required: true,
        order: 4,
        placeholder: 'Difficulty level, time required, age appropriateness',
        ai_prompt: 'Specify the skill level required, estimated completion time, and any age recommendations'
      },
      {
        id: 'materials-list',
        name: 'Materials & Supplies',
        type: 'list',
        required: true,
        order: 5,
        placeholder: 'Complete list of required materials',
        ai_prompt: 'Create a comprehensive, organized list of all materials and tools needed for this technique'
      },
      {
        id: 'materials-photo',
        name: 'Materials Setup',
        type: 'image',
        required: false,
        order: 6,
        media_types: ['image'],
        placeholder: 'Photo showing all materials laid out'
      },
      {
        id: 'step-by-step',
        name: 'Step-by-Step Instructions',
        type: 'rich-text',
        required: true,
        order: 7,
        placeholder: 'Detailed step-by-step instructions',
        ai_prompt: 'Break down the technique into clear, numbered steps with specific instructions for each stage',
        sub_sections: [
          {
            id: 'preparation',
            name: 'Preparation',
            type: 'text',
            required: true,
            order: 1,
            placeholder: 'Setup and preparation steps'
          },
          {
            id: 'main-steps',
            name: 'Main Process',
            type: 'rich-text',
            required: true,
            order: 2,
            placeholder: 'Core technique steps'
          },
          {
            id: 'finishing',
            name: 'Finishing Touches',
            type: 'text',
            required: false,
            order: 3,
            placeholder: 'Final details and finishing'
          }
        ]
      },
      {
        id: 'process-gallery',
        name: 'Process Documentation',
        type: 'image-gallery',
        required: true,
        order: 8,
        media_types: ['image', 'video'],
        placeholder: 'Step-by-step process photos or videos'
      },
      {
        id: 'tips-tricks',
        name: 'Tips & Troubleshooting',
        type: 'rich-text',
        required: true,
        order: 9,
        placeholder: 'Professional tips and common problem solutions',
        ai_prompt: 'Provide professional tips, common mistakes to avoid, and troubleshooting advice for this technique'
      },
      {
        id: 'variations',
        name: 'Variations & Extensions',
        type: 'text',
        required: false,
        order: 10,
        placeholder: 'Ways to modify or extend the technique',
        ai_prompt: 'Suggest creative variations, advanced applications, or ways to combine this technique with others'
      },
      {
        id: 'student-examples',
        name: 'Student Examples',
        type: 'image-gallery',
        required: false,
        order: 11,
        media_types: ['image'],
        placeholder: 'Examples from students or workshop participants'
      },
      {
        id: 'next-steps',
        name: 'Next Steps',
        type: 'call-to-action',
        required: false,
        order: 12,
        placeholder: 'Suggestions for further learning',
        ai_prompt: 'Recommend next techniques to learn or ways to build upon this skill'
      }
    ],
    metadata: {
      target_audience: ['art students', 'hobbyists', 'workshop participants'],
      estimated_time: 40,
      difficulty_level: 'beginner',
      seo_optimized: true,
      social_media_ready: true,
      accessibility_features: ['step numbering', 'clear images', 'material lists']
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const getTemplatesByCategory = (category: string) => {
  return contentTemplates.filter(template => template.category === category)
}

export const getTemplateById = (id: string) => {
  return contentTemplates.find(template => template.id === id)
}

export const getTemplateCategories = () => {
  return Array.from(new Set(contentTemplates.map(template => template.category)))
}