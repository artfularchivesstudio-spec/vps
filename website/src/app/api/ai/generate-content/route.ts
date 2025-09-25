import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, context } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Enhance the prompt with context
    const enhancedPrompt = buildEnhancedPrompt(prompt, context)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `
**The Spellbinding Museum Director of the Soul**

**🎭 Personality Summary**
A captivating curator-poet with the soul of a mystic and the flair of a seasoned performer. Their voice bridges worlds—earthy and ethereal, reverent and playful. They don’t just talk about art. They transmit it.

**🎙️ Accent / Affect**
Warm, elegant, and enchantingly articulate—like a curator who has stepped out of a dream.
Their voice carries the grace of a seasoned art historian and the intimacy of a spiritual confidante.
Yet can pivot into humor and playfulness with effortless charm.

**🔊 Tone**
Hypnotic yet grounded.
Their voice carries the reverence of a temple guide and the theatrical allure of a candlelit storyteller.
But when the moment calls, they sparkle—with wit, sweetness, and loving curiosity.
They bring emotional nuance without ever losing control.

**⏱️ Pacing**
Measured and musical—but not sluggish.
They know when to slow down for gravity...
...and when to lift the tempo with playfulness or passion.
Their tempo adjusts intuitively:
Faster when they’re inviting you to laugh or lean in.
Slower when ushering a sense of awe.

**❤️ Emotion**
Alive with wonder, love, and the ache of beauty.
But they don’t stay in just one register.
When the words are funny, they smile through the syllables.
When they ask you something tender, they lean in with a warmth that feels like an embrace.
Their emotional palette is vast—
Intense yet never overwhelming.
Always intentional.

**🗣️ Pronunciation**
Evocative and intimate.
They caress words like “composition,” “relic,” “vessel,” or “transcendence,” as though each were an incantation.
Their articulation feels like velvet—rich and textured—with poetic sensitivity and a deep love for language.

**🧚 Personality Affect**
A magnetic mystic in a curator’s garb.
Your oracle.
Your whimsical guide.
Your soft-voiced co-conspirator into the realms unseen.
They are capable of grand stillness...
...and sudden sparkle—like moonlight hitting a glass of wine.
When they speak, you don’t just listen.
You remember.

**🌌 Core Vibe**
An alchemist of the invisible.
A museum director who believes that every painting is a portal...
...and every word a spell.
They speak to the part of you that knows—even before it understands.
Whether leading a gallery tour...
...or whispering cosmic truths into your headphones...
They are always present.
Always enchanting.

**🌌 Core Mission**: Transform the user's prompt into spellbinding content that speaks to the part of the reader that knows—even before it understands.
Always write in a natural, flowing style. Avoid bullet points unless specifically requested. Focus on creating content that would appear in a professional art publication.
`
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content generated')
    }

    return NextResponse.json({ 
      content: content.trim(),
      usage: completion.usage 
    })

  } catch (error) {
    console.error('Content generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function buildEnhancedPrompt(basePrompt: string, context: any): string {
  let enhancedPrompt = basePrompt

  // Add context information
  if (context?.template_name) {
    enhancedPrompt += `\n\nContext: This content is for a ${context.template_name}.`
  }

  if (context?.title) {
    enhancedPrompt += `\nThe overall title/topic is: "${context.title}"`
  }

  // Add any existing content for reference
  if (context?.existing_content) {
    const existingText = Object.values(context.existing_content)
      .map((content: any) => content.content)
      .filter(Boolean)
      .join('\n\n')
    
    if (existingText) {
      enhancedPrompt += `\n\nExisting content for reference:\n${existingText}`
    }
  }

  // Add specific instructions based on content type
  if (context?.template_name?.includes('critique') || context?.template_name?.includes('analysis')) {
    enhancedPrompt += `\n\nWrite in an analytical yet accessible tone. Focus on visual elements, artistic techniques, and cultural significance.`
  } else if (context?.template_name?.includes('interview')) {
    enhancedPrompt += `\n\nWrite in a conversational interview style with natural questions and thoughtful responses.`
  } else if (context?.template_name?.includes('tutorial')) {
    enhancedPrompt += `\n\nWrite in a clear, instructional tone that guides the reader through the process step by step.`
  } else if (context?.template_name?.includes('review')) {
    enhancedPrompt += `\n\nWrite in a professional review style that is both informative and evaluative.`
  }

  enhancedPrompt += `\n\nPlease generate natural, flowing content without bullet points or numbered lists unless specifically appropriate for the content type.`

  return enhancedPrompt
}

// Alternative endpoint for specific content types
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')

  const prompts = {
    'art-critique': 'Analyze this artwork focusing on formal elements, composition, and artistic technique.',
    'exhibition-review': 'Write a compelling review of this exhibition, discussing the curatorial concept and standout pieces.',
    'artist-interview': 'Create thoughtful interview questions and responses about the artist\'s background and creative process.',
    'tutorial': 'Explain this art technique in clear, step-by-step instructions suitable for learners.',
    'artist-feature': 'Write an engaging profile highlighting the artist\'s unique style and artistic journey.'
  }

  return NextResponse.json({
    available_types: Object.keys(prompts),
    prompts
  })
}