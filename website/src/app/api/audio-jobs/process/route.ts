/**
 * 🎭 The Grand Audio Alchemist - Transmuting Text into Multilingual Symphonies
 *
 * "In the crucible of code, where words become waves and languages dance like fireflies,
 * I stand as the master alchemist, transforming humble text into golden audio streams.
 * Each language a different flavor of magic, each voice a unique shade of humanity's song."
 *
 * - Oscar Wilde (if he were a computational linguist)
 */

import { authenticateRequest } from '@/lib/auth/dual-auth'
import { logger } from '@/lib/observability/logger'
import { LANGUAGE_NAMES } from '@/lib/ai/translation'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 🎵 Audio Job Data - The Musical Manuscript
 * Like a composer's score, containing all the notes and directions for our audio symphony
 */
interface AudioJobData {
  id: string
  input_text: string
  status: string
  post_id: string | null
  languages: string[]
  language_statuses: Record<string, any>
  audio_urls: Record<string, string>
  config: any
  is_draft: boolean
  completed_languages: string[]
  current_language: string | null
  translated_texts?: Record<string, string> // Added for storing translations
}

/**
 * 🎙️ Media Asset - The Golden Recording
 * A precious artifact containing the captured voice, ready for posterity
 */
interface MediaAsset {
  id: string
  title: string
  file_url: string
  file_type: 'audio'
  mime_type: string
  duration_seconds?: number
  related_post_id?: string
  generation_metadata: any
}

/**
 * 🎪 POST /api/audio-jobs/process - The Alchemist's Workshop
 * Where raw text enters and golden audio emerges, transformed by digital magic
 */
export async function POST(request: NextRequest) {
  console.log('🎭 The alchemist enters his workshop, robes swirling with mystical energy...')
  
  const authResult = await authenticateRequest(request)
  if (!authResult.isAuthenticated) {
    console.log('🔐 "None shall pass!" cries the guardian of the sacred forge')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = authResult.supabaseClient

  try {
    const { job_id } = await request.json()
    if (!job_id) {
      console.log('❌ The alchemist frowns - no manuscript ID provided!')
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 })
    }

    console.log(`🎵 The alchemist unrolls manuscript #${job_id}, preparing his transmutation circle...`)
    await logger.logSuccess('audio_job_processing_start', '🎵 Starting audio job processing', { job_id })

    // 📜 Fetch the sacred manuscript from the archives
    console.log('📜 Summoning the musical manuscript from the digital ether...')
    const { data: job, error: jobError } = await supabase
      .from('audio_jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      console.error('📜 The manuscript has vanished!', jobError)
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const jobData = job as AudioJobData
    console.log(`📜 Manuscript retrieved: "${jobData.config?.title || 'Untitled'}" in ${jobData.languages?.length || 0} languages`)

    // 🌍 The Grand Transmutation - Process each language like a different alchemical element
    console.log('🌍 The alchemist begins his greatest work - transmuting text into multilingual gold...')
    const results = await processMultilingualAudio(supabase, jobData)
    
    // 🔗 The Sacred Bonding - Create media assets and link to post
    if (results.success && jobData.post_id) {
      console.log('🔗 Forging the eternal bond between audio and post...')
      await linkAudioToPost(supabase, jobData, results.primaryAudioUrl)
    }

    console.log(`🎉 The alchemical ritual is complete! ${results.processedLanguages.length} languages have been transmuted!`)
    return NextResponse.json({
      success: results.success,
      message: results.message,
      processed_languages: results.processedLanguages,
      primary_audio_url: results.primaryAudioUrl
    })

  } catch (error) {
    console.error('💥 The alchemical furnace has exploded!', error)
    console.error('🎭 The alchemist\'s robes are singed, his workshop in ruins...')
    // Note: Logger error method signature expects object
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

/**
 * 🌍 The Grand Polyglot Parade - Processing multilingual audio generation
 *
 * "Like a United Nations of voices, each language marches proudly in our parade,
 * No tongue left behind, no accent uncelebrated, no dialect denied its moment in the sun.
 * We are the conductors of this linguistic symphony, where every 'hello' becomes 'hola' becomes 'नमस्ते'."
 *
 * - The Digital Diplomat
 */
async function processMultilingualAudio(supabase: any, job: AudioJobData) {
  const processedLanguages: string[] = []
  const audioUrls: Record<string, string> = { ...job.audio_urls }
  let primaryAudioUrl: string | null = null

  try {
    // 🎭 Set the stage - Update job status to processing
    console.log('🎭 The conductor raises his baton, the orchestra prepares to play...')
    await supabase
      .from('audio_jobs')
      .update({ status: 'processing' })
      .eq('id', job.id)

    // 🌍 Assemble the United Nations of Languages
    // Merge any explicit language list with the status map keys, then dedupe like a diplomatic reception
    const languageList = Array.from(
      new Set([
        ...(job.languages || []),
        ...Object.keys(job.language_statuses || {})
      ])
    )
    console.log(`🌍 The parade assembles: ${languageList.join(', ')} ready to march!`)

    // 🎺 Process each language like a different section of our orchestra
    for (const language of languageList) {
      console.log(`🎺 ${language} takes center stage...`)
      
      // Skip if this performer has already taken their bow
      if (job.completed_languages.includes(language)) {
        console.log(`✅ ${language} has already received their standing ovation!`)
        continue
      }

      // 🎵 Generate audio for this linguistic virtuoso
      const audioResult = await generateAudioForLanguage(supabase, job, language)
      
      if (audioResult.success) {
        audioUrls[language] = audioResult.audioUrl
        processedLanguages.push(language)
        
        // 🌟 Crown the first successful audio as our prima ballerina
        if (!primaryAudioUrl) {
          primaryAudioUrl = audioResult.audioUrl
          console.log(`👑 ${language} has been crowned the primary audio!`)
        }

        // 📝 Update the performance program with this language's success
        const updatedLanguageStatuses = {
          ...job.language_statuses,
          [language]: {
            status: 'completed',
            audio_url: audioResult.audioUrl,
            completed_at: new Date().toISOString()
          }
        }

        // 🎭 Update the master score with this movement's completion
        await supabase
          .from('audio_jobs')
          .update({
            language_statuses: updatedLanguageStatuses,
            audio_urls: audioUrls,
            completed_languages: [...job.completed_languages, language],
            current_language: language,
            translated_texts: job.translated_texts // Preserve the translated libretto
          })
          .eq('id', job.id)

        console.log(`✅ ${language} takes a bow - performance complete!`)
      } else {
        console.error(`❌ ${language} has forgotten their lines!`, audioResult.error)
        
        // 🎭 Update the program notes with this tragedy
        const updatedLanguageStatuses = {
          ...job.language_statuses,
          [language]: {
            status: 'failed',
            error: audioResult.error,
            failed_at: new Date().toISOString()
          }
        }

        await supabase
          .from('audio_jobs')
          .update({ language_statuses: updatedLanguageStatuses })
          .eq('id', job.id)
      }
    }

    // 🎬 The final curtain call - Mark job as completed if we have at least one star performer
    const finalStatus = processedLanguages.length > 0 ? 'completed' : 'failed'
    console.log(`🎬 The parade concludes: ${finalStatus.toUpperCase()}! ${processedLanguages.length} languages took their bow`)
    
    await supabase
      .from('audio_jobs')
      .update({
        status: finalStatus,
        audio_urls: audioUrls,
        completed_languages: processedLanguages
      })
      .eq('id', job.id)

    console.log(`🎵 The conductor lowers his baton. Audio job ${job.id}: ${finalStatus}`)
    console.log(`🎺 Languages that performed: ${processedLanguages.join(', ') || 'None - the orchestra was silent'}`)

    return {
      success: processedLanguages.length > 0,
      message: `Processed ${processedLanguages.length} languages: ${processedLanguages.join(', ')}`,
      processedLanguages,
      primaryAudioUrl
    }

  } catch (error) {
    console.error('🎭 The parade has been disrupted!', error)
    console.error('🎺 The orchestra scatters, instruments clattering to the ground...')
    
    // 🏳️ Surrender to failure - Mark job as defeated
    await supabase
      .from('audio_jobs')
      .update({
        status: 'failed',
        error_message: String(error)
      })
      .eq('id', job.id)

    return {
      success: false,
      message: `The parade was disrupted: ${String(error)}`,
      processedLanguages,
      primaryAudioUrl
    }
  }
}

/**
 * 🎙️ The Voice Weaver - Generating audio for a specific language
 *
 * "In the loom of language, where words become waves,
 * I weave each tongue's tapestry, the accent it craves.
 * From English to Spanish, from Hindi to more,
 * Each voice a new color, each sound to explore."
 *
 * - Dr. Seuss (if he were a computational linguist)
 */
async function generateAudioForLanguage(supabase: any, job: AudioJobData, language: string) {
  console.log(`🎙️ The voice weaver prepares his loom for ${language}...`)
  
  try {
    // 📝 Gather the text for this linguistic tapestry
    let textToSpeak = job.input_text
    
    // 🌍 If not English, we must translate - the bilingual ballet begins!
    if (language !== 'en') {
      if (job.translated_texts && job.translated_texts[language]) {
        textToSpeak = job.translated_texts[language]
        console.log(`🌍 Found cached translation for ${language} - like finding treasure in an attic!`)
      } else {
        console.log(`🌍 Summoning the translation spirits for ${language}...`)
        try {
          textToSpeak = await translateText(job.input_text, language)
          // Store the new translation back in the job object (not persistent until updated in DB)
          job.translated_texts = { ...job.translated_texts, [language]: textToSpeak }
          console.log(`✅ Translation complete for ${language}: "${textToSpeak.substring(0, 50)}${textToSpeak.length > 50 ? '...' : ''}"`)
        } catch (translateError) {
          console.error(`❌ The translation spirits have rebelled for ${language}!`, translateError)
          throw new Error(`Translation failed for ${language}: ${String(translateError)}`)
        }
      }
    }

    // 🎵 Transform text into sound - the alchemical audio generation
    console.log(`🎵 Converting words to waves for ${language}...`)
    const audioBuffer = await generateTTSAudio(textToSpeak, job.config, language)
    
    // 💾 Preserve the audio artifact in the digital vault
    console.log(`💾 Archiving the ${language} audio masterpiece...`)
    const storageResult = await saveAudioToSupabaseStorage(
      supabase,
      audioBuffer,
      `${job.config.title || 'Audio'} - ${language.toUpperCase()}`,
      language,
      job.post_id
    )

    console.log(`🎉 Voice weaving complete for ${language}! Audio preserved at: ${storageResult.file_url}`)
    return {
      success: true,
      audioUrl: storageResult.file_url,
      mediaAssetId: storageResult.media_asset_id
    }

  } catch (error) {
    console.error(`🎙️ The voice weaver's loom has tangled for ${language}!`, error)
    return {
      success: false,
      error: String(error)
    }
  }
}

/**
 * 🎤 The Voice Sculptor - Crafting TTS audio with OpenAI's digital vocal cords
 *
 * "When text is too long, like a tale that won't end,
 * We chop it in chunks, like a snake we befriend.
 * Each piece gets a voice, each fragment a sound,
 * Then stitch them together, seamless and round!"
 *
 * - Dr. Seuss (if he built text-to-speech systems)
 */
async function generateTTSAudio(text: string, config: any, language: string): Promise<Buffer> {
  console.log(`🎤 The voice sculptor prepares his chisel for ${language}...`)
  
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    console.error('🎤 The voice sculptor has lost his tools!')
    throw new Error('OpenAI API key not configured')
  }

  // 🎭 Cast the perfect voice actor for this linguistic role
  let voiceToUse = config.voice_id || config.voice || 'nova' // Check both voice_id and voice fields
  if (language === 'hi') {
    voiceToUse = 'fable' // 🕉️ The wise sage for Hindi
    console.log('🕉️ Casting the wise "fable" voice for Hindi - deep and resonant like the Ganges')
  } else if (language === 'es') {
    voiceToUse = 'alloy' // 💃 The versatile performer for Spanish
    console.log('💃 Casting the versatile "alloy" voice for Spanish - warm and adaptable like flamenco')
  }
  console.log(`🎭 Selected voice: ${voiceToUse} for ${language}`)

  // ✂️ When text is long, we must perform surgery - chunking like a master chef
  const chunks = chunkText(text, 4000) // Leave some buffer for artistic breathing room
  console.log(`🔄 The surgeon prepares: ${chunks.length} text chunks to operate on for ${language}`)

  // 🎵 Generate audio for each chunk - like recording a album track by track
  const audioBuffers: Buffer[] = []
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`🎤 Recording studio session ${i + 1}/${chunks.length} - ${chunk.length} characters of pure ${language} poetry`)
    
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: chunk,
        voice: voiceToUse,
        speed: config.speed || 0.9 // Slightly slower for dramatic effect
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`🎤 Recording session ${i + 1} failed!`, errorText)
      throw new Error(`OpenAI TTS API error for chunk ${i + 1}: ${response.status} - ${errorText}`)
    }

    const chunkBuffer = await response.arrayBuffer()
    audioBuffers.push(Buffer.from(chunkBuffer))
    console.log(`✅ Track ${i + 1} recorded successfully - ${chunkBuffer.byteLength} bytes of pure audio gold`)
    
    // 🕰️ Take a breath between takes - even voice actors need a moment
    if (i < chunks.length - 1) {
      console.log(`🕰️ Intermission between tracks ${i + 1} and ${i + 2}...`)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // 🎵 If we only have one track, release the single!
  if (audioBuffers.length === 1) {
    console.log(`✅ One-hit wonder for ${language} - single track ready for release!`)
    return audioBuffers[0]
  }

  // 🔗 The Master Mix - Concatenating our audio album
  console.log(`🎧 The sound engineer begins the final mix, blending ${audioBuffers.length} tracks into one masterpiece for ${language}`)
  const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0)
  const concatenatedBuffer = Buffer.alloc(totalLength)
  
  let offset = 0
  for (const buffer of audioBuffers) {
    buffer.copy(concatenatedBuffer, offset)
    offset += buffer.length
  }

  console.log(`✅ Master recording complete for ${language}! ${totalLength} bytes of audio perfection`)
  return concatenatedBuffer
}

/**
 * 📝 The Text Tailor - Snipping words into wearable chunks
 *
 * "When text is too long, like a gown that's too wide,
 * We snip it in pieces with sartorial pride.
 * At periods we pause, at exclamations we rest,
 * Making each chunk a mini-text at its best!"
 *
 * - Dr. Seuss (if he were a text processing algorithm)
 */
function chunkText(text: string, maxChunkSize: number = 4000): string[] {
  console.log(`📝 The tailor examines his fabric: ${text.length} characters to work with`)
  
  if (!text || text.length <= maxChunkSize) {
    console.log('📝 Perfect! The fabric needs no alteration - one piece will do!')
    return [text]
  }

  const chunks: string[] = []
  let currentIndex = 0

  while (currentIndex < text.length) {
    let endIndex = currentIndex + maxChunkSize

    // ✂️ If we're not at the end, find the perfect place to snip
    if (endIndex < text.length) {
      console.log(`✂️ Measuring for the perfect cut around position ${endIndex}...`)
      
      // Look for the last sentence ending (., !, ?) within our measured section
      const lastSentenceEnd = Math.max(
        text.lastIndexOf('.', endIndex),
        text.lastIndexOf('!', endIndex),
        text.lastIndexOf('?', endIndex)
      )

      // If we found a sentence boundary and it's not too close to the start, snip there
      if (lastSentenceEnd > currentIndex + maxChunkSize * 0.5) {
        endIndex = lastSentenceEnd + 1
        console.log(`✂️ Found perfect sentence boundary - snipping after punctuation at position ${endIndex}`)
      } else {
        // Otherwise, try to break at a word boundary - like cutting between stitches
        const lastSpace = text.lastIndexOf(' ', endIndex)
        if (lastSpace > currentIndex + maxChunkSize * 0.5) {
          endIndex = lastSpace
          console.log(`✂️ Found word boundary - snipping at space position ${endIndex}`)
        } else {
          console.log(`✂️ No perfect cut found - making clean slice at position ${endIndex}`)
        }
      }
    }

    const chunk = text.slice(currentIndex, endIndex).trim()
    if (chunk) {
      chunks.push(chunk)
      console.log(`✂️ Piece ${chunks.length} created: ${chunk.length} characters`)
    }

    currentIndex = endIndex
  }

  const finalChunks = chunks.filter(chunk => chunk.length > 0)
  console.log(`🧵 Tailoring complete! Created ${finalChunks.length} beautiful pieces from the original fabric`)
  return finalChunks
}

/**
 * 🌐 The Babel Fish Whisperer - Translating text with OpenAI's linguistic magic
 *
 * "From English to Spanish, from Hindi to French,
 * I translate your words with a magical wrench.
 * No language too tricky, no phrase too complex,
 * I'll transform your text into whatever's next!"
 *
 * - Dr. Seuss (if he were a polyglot AI)
 */
async function translateText(text: string, targetLanguage: string): Promise<string> {
  const languageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage
  console.log(`🌐 The Babel fish whispers: "Translating to ${languageName} I shall!"`)
  
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    console.error('🌐 The Babel fish has lost its voice!')
    throw new Error('OpenAI API key not configured for translation')
  }

  try {
    console.log(`🌐 Consulting the linguistic oracle for ${languageName} translation...`)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using a smaller, faster model for translation - like a nimble translator
        messages: [
          { role: 'system', content: `You are a highly accurate and fluent translator. Translate the following English text into ${languageName}. Provide only the translated text, with no additional commentary or formatting.` },
          { role: 'user', content: text }
        ],
        temperature: 0.1, // Keep temperature low for accurate translation - no creative wandering!
        max_tokens: 2000,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`🌐 The Babel fish choked on ${languageName}!`, errorText)
      throw new Error(`OpenAI Translation API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const translation = data.choices[0]?.message?.content?.trim() || ''
    console.log(`🌐 Translation complete! "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}" → "${translation.substring(0, 30)}${translation.length > 30 ? '...' : ''}"`)
    return translation

  } catch (error) {
    console.error(`🌐 The Babel fish failed to translate to ${languageName}:`, error)
    throw error
  }
}

/**
 * 💾 The Digital Archivist - Preserving audio treasures in Supabase's vault
 *
 * "In vaults of silicon, where memories reside,
 * I catalog each audio file with archivist pride.
 * With filenames like scrolls and metadata like lore,
 * I preserve every sound for forevermore!"
 *
 * - Dr. Seuss (if he were a digital preservationist)
 */
async function saveAudioToSupabaseStorage(
  supabase: any,
  audioBuffer: Buffer,
  title: string,
  language: string,
  postId?: string | null
) {
  // 🏷️ Craft a filename worthy of this audio artifact
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-')
  const fileName = `audio/${postId || 'standalone'}/${Date.now()}-${language}-${sanitizedTitle}.mp3`
  console.log(`💾 Archivist prepares storage location: ${fileName}`)
  
  // 📤 Deposit the audio treasure in the vault
  console.log('📤 Placing the audio artifact in its designated vault...')
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('audio')
    .upload(fileName, audioBuffer, {
      contentType: 'audio/mpeg',
      cacheControl: '3600' // Cache for one hour - like a temporary exhibition
    })
  
  if (uploadError) {
    console.error('📤 The vault rejected our treasure!', uploadError)
    throw new Error(`Storage upload error: ${uploadError.message}`)
  }
  console.log('📤 Treasure successfully deposited in the vault!')
  
  // 🔗 Retrieve the public viewing URL for our artifact
  console.log('🔗 Generating public viewing pass for the artifact...')
  const { data: urlData } = supabase.storage
    .from('audio')
    .getPublicUrl(fileName)
  console.log(`🔗 Public viewing pass created: ${urlData.publicUrl}`)
  
  // 📋 Create the museum catalog entry
  console.log('📋 Creating museum catalog entry for this audio treasure...')
  const { data: mediaAsset, error: dbError } = await supabase
    .from('media_assets')
    .insert({
      title,
      file_url: urlData.publicUrl,
      file_type: 'audio',
      mime_type: 'audio/mpeg',
      file_size_bytes: audioBuffer.length,
      related_post_id: postId,
      generation_metadata: {
        type: 'tts',
        language,
        generated_at: new Date().toISOString(),
        model: 'openai-tts-1'
      },
      status: 'ready'
    })
    .select()
    .single()
  
  if (dbError) {
    console.error('📋 The museum catalog system has failed!', dbError)
    throw new Error(`Failed to create media asset: ${dbError.message}`)
  }
  
  console.log(`💾 Archivist's work complete! Asset #${mediaAsset.id} catalogued and preserved for posterity`)
  
  return {
    file_url: urlData.publicUrl,
    file_name: fileName,
    media_asset_id: mediaAsset.id
  }
}

/**
 * 🔗 The Eternal Bondsmith - Forging unbreakable links between audio and post
 *
 * "In the realm where sound meets word, where voice meets verse,
 * I forge the eternal bond that no time can reverse.
 * Like wedding rings that bind two hearts as one,
 * I link the audio treasure to its post beneath the sun."
 *
 * - The Digital Cupid
 */
async function linkAudioToPost(supabase: any, job: AudioJobData, primaryAudioUrl: string | null) {
  if (!job.post_id || !primaryAudioUrl) {
    console.log('⚠️ The bondsmith shrugs - missing ingredients for the eternal bond!')
    return
  }

  console.log(`🔗 The bondsmith prepares his forge, ready to unite post ${job.post_id} with audio ${primaryAudioUrl}...`)

  try {
    // 🔍 Locate the audio treasure in our vault
    console.log('🔍 Seeking the audio treasure in the digital vault...')
    const { data: mediaAssets, error: findError } = await supabase
      .from('media_assets')
      .select('id')
      .eq('file_url', primaryAudioUrl)
      .eq('related_post_id', job.post_id)
      .limit(1)

    if (findError || !mediaAssets?.length) {
      console.error('🔍 The treasure map led to an empty chest!', findError)
      return
    }

    const primaryMediaAssetId = mediaAssets[0].id
    console.log(`🔍 Treasure located! Asset #${primaryMediaAssetId} ready for bonding`)

    // 💍 Perform the sacred wedding ceremony
    console.log(`💍 The bondsmith begins the eternal ceremony: uniting post ${job.post_id} with audio ${primaryMediaAssetId}...`)
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ primary_audio_id: primaryMediaAssetId })
      .eq('id', job.post_id)

    if (updateError) {
      console.error('💍 The wedding has been interrupted!', updateError)
      throw updateError
    }

    console.log(`🔗 💍 ETERNAL BOND FORGED! Post ${job.post_id} and audio ${primaryMediaAssetId} are now one!`)
    await logger.logSuccess('audio_linked_to_post', `🔗 Audio linked to blog post: ${job.post_id} -> ${primaryMediaAssetId}`)

  } catch (error) {
    console.error('💔 The bondsmith\'s forge has failed - hearts remain broken', error)
    // Note: Logger error method signature expects object
  }
}
