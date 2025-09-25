// Node.js/Next.js specific image analysis
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface ImageAnalysisRequest {
  image_data: string;
  imageUrl?: string;
  imageData?: string;
  analysis_type?: 'brief' | 'detailed' | 'technical' | 'creative';
  analysisType?: 'brief' | 'detailed' | 'technical' | 'creative';
  providers?: ('openai' | 'claude')[];
  custom_prompt?: string;
  prompt?: string;
  saveToStorage?: boolean;
  title?: string;
}

// Shared analysis prompts
const ANALYSIS_PROMPTS = {
  brief: 'Briefly describe this artwork in 2-3 sentences, focusing on the main visual elements, style, and mood.',
  detailed: `Analyze this artwork or image in detail. Provide:
1. Visual description of the artwork
2. Artistic style and techniques used
3. Color palette and composition analysis
4. Emotional tone and mood
5. Potential historical or cultural context
6. Suggested title if none exists
7. Keywords for SEO and categorization

Be detailed and insightful, as this will be used for blog content creation.`,
  technical: 'Analyze the technical aspects of this artwork: medium and materials, artistic techniques used, composition principles, color theory application, and technical execution quality.',
  creative: 'Create an engaging, creative description of this artwork that could be used for social media or blog content. Focus on storytelling and emotional connection.'
};

// Get environment variable
function getEnvVar(key: string): string | undefined {
  return process.env[key];
}
// OpenAI Analysis
export async function analyzeWithOpenAI(imageUrl: string, prompt: string, analysisType: string = 'detailed') {
  const openaiApiKey = getEnvVar('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }
  const openai = new OpenAI({
    apiKey: openaiApiKey
  });
  const defaultPrompt = (ANALYSIS_PROMPTS as any)[analysisType] || ANALYSIS_PROMPTS.detailed;
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt || defaultPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'high'
            }
          }
        ]
      }
    ],
    max_tokens: 1000,
    temperature: 0.7
  });
  return {
    provider: 'openai',
    model: 'gpt-4o',
    content: response.choices[0]?.message?.content || 'No content generated',
    usage: response.usage,
    timestamp: new Date().toISOString()
  };
}
// Claude Analysis
export async function analyzeWithClaude(imageUrl: string, prompt: string, analysisType: string = 'detailed') {
  const claudeApiKey = getEnvVar('CLAUDE_API_KEY') || getEnvVar('ANTHROPIC_API_KEY');
  if (!claudeApiKey) {
    throw new Error('Claude API key not configured');
  }
  const anthropic = new Anthropic({
    apiKey: claudeApiKey
  });
  const defaultPrompt = (ANALYSIS_PROMPTS as any)[analysisType] || ANALYSIS_PROMPTS.detailed;
  // First, fetch the image to convert to base64
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const imageBase64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(imageBuffer))));
  // Determine media type
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    temperature: 0.7,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt || defaultPrompt
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageBase64
            }
          }
        ]
      }
    ]
  });
  return {
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
    content: response.content[0]?.type === 'text' ? response.content[0].text : 'No content generated',
    usage: response.usage,
    timestamp: new Date().toISOString()
  };
}
// Main analysis function
export async function analyzeImage(request: ImageAnalysisRequest) {
  try {
    const { imageUrl, imageData, prompt, providers = [
      'openai',
      'claude'
    ], analysisType = 'detailed', saveToStorage = false, title } = request;
    // Validate input
    if (!imageUrl && !imageData) {
      return {
        success: false,
        error: 'Missing required field: imageUrl or imageData'
      };
    }
    // Use imageData if provided, otherwise use imageUrl
    const finalImageUrl = imageData || imageUrl;
    const results: any = {};
    const analysisPromises: Promise<void>[] = [];
    // Run analyses in parallel
    if (providers.includes('openai') && finalImageUrl) {
      analysisPromises.push(analyzeWithOpenAI(finalImageUrl, prompt || '', analysisType || 'detailed').then((result)=>{
        results.openai_analysis = result;
      }).catch((error)=>{
        console.error('OpenAI analysis failed:', error);
        results.openai_error = error.message;
      }));
    }
    if (providers.includes('claude') && finalImageUrl) {
      analysisPromises.push(analyzeWithClaude(finalImageUrl, prompt || '', analysisType || 'detailed').then((result)=>{
        results.claude_analysis = result;
      }).catch((error)=>{
        console.error('Claude analysis failed:', error);
        results.claude_error = error.message;
      }));
    }
    // Wait for all analyses to complete
    await Promise.all(analysisPromises);
    // Generate suggestions based on successful analyses
    const successfulAnalyses = Object.values(results).filter((result: any)=>result && result.content && !result.error);
    if (successfulAnalyses.length > 0) {
      const suggestions = generateSuggestions(successfulAnalyses);
      results.suggestedTitle = suggestions.title;
      results.suggestedSlug = suggestions.slug;
      results.suggestedCategories = suggestions.categories;
      results.suggestedTags = suggestions.tags;
    }
    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error('Image analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
// Helper functions
function generateSuggestions(analyses: any[]) {
  const content = analyses.map((analysis)=>analysis.content).join(' ');
  // Extract key themes and elements for suggestions
  const words = content.toLowerCase().split(/\s+/);
  const artTerms = [
    'painting',
    'drawing',
    'sculpture',
    'abstract',
    'portrait',
    'landscape',
    'still life',
    'contemporary',
    'modern',
    'traditional'
  ];
  const foundTerms = words.filter((word)=>artTerms.includes(word));
  return {
    title: generateTitle(content),
    slug: generateSlug(content),
    categories: foundTerms.slice(0, 3),
    tags: extractTags(content)
  };
}
function generateTitle(content: string) {
  const sentences = content.split(/[.!?]/);
  const firstSentence = sentences[0]?.trim();
  if (firstSentence && firstSentence.length > 10 && firstSentence.length < 80) {
    return firstSentence;
  }
  return 'Artwork Analysis';
}
function generateSlug(content: string) {
  const title = generateTitle(content);
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 50);
}
function extractTags(content: string) {
  const commonTags = [
    'art',
    'painting',
    'drawing',
    'creative',
    'visual',
    'color',
    'composition',
    'style',
    'modern',
    'contemporary'
  ];
  const contentLower = content.toLowerCase();
  return commonTags.filter((tag)=>contentLower.includes(tag)).slice(0, 5);
}
