import { createClient } from '@/lib/supabase/server'
import { EventEmitter } from 'events'

/**
 * @file /Users/gurindersingh/Documents/Developer/website/src/lib/hooks/system.ts
 * @description
 * Behold, the grand conductor of our digital orchestra, the HookSystem!
 * This marvel of engineering listens for the whispers of events across the land
 * and, with a flourish, unleashes a cascade of actions. It's a symphony of
 * triggers and responses, a ballet of data and side effects.
 *
 * Here, we define the very essence of a hook-based architecture, where the
 * mundane becomes magical, and the system itself seems to possess a life of its own.
 * So tread carefully, for you are in the realm of the digital gods, where a single
 * event can set in motion a chain of events that will echo through the system.
 */
export interface Hook {
  id: string // The unique identifier, a name whispered in the halls of the database.
  name: string // The common name, for us mortals to comprehend.
  description: string // A tale of its purpose, a ballad of its function.
  trigger: HookTrigger // The spark that ignites the flame, the event that awakens the beast.
  conditions: HookCondition[] // The sacred laws that must be met, the gates that must be passed.
  actions: HookAction[] // The grand performance, the symphony of side effects.
  enabled: boolean // A simple switch, to unleash or contain its power.
  priority: number // The pecking order, for when the hooks clamor for attention.
  created_at: string // The moment of its birth, a timestamp etched in eternity.
  updated_at: string // The moment of its transformation, a record of its evolution.
  created_by: string // The architect of its existence, the one who dared to dream.
  execution_count: number // A tally of its deeds, a measure of its impact.
  last_executed: string | null // A memory of its last performance, a whisper of its recent past.
  success_rate: number // A testament to its prowess, a score of its triumphs and failures.
}

/**
 * @interface HookCondition
 * @description
 * A single rule in the grand book of laws, a test of worthiness.
 * It's a riddle that the event data must solve to prove its mettle.
 */
export interface HookCondition {
  field: string // The subject of the riddle, the path to the data's soul.
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains' | 'exists' | 'not_exists' | 'in' | 'not_in' // The nature of the test, the heart of the comparison.
  value: any // The answer to the riddle, the key to the gate.
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' // The form of the answer, the shape of the key.
}

/**
 * @interface HookAction
 * @description
 * A single note in the symphony, a step in the dance.
 * It's a command to be executed, a spell to be cast.
 */
export interface HookAction {
  type: string // The name of the spell, the incantation to be uttered.
  parameters: Record<string, any> // The ingredients of the potion, the components of the magic.
  order: number // The sequence of the dance, the rhythm of the performance.
  retry_count: number // The number of second chances, for when the magic falters.
  timeout: number // The sands of time, the limit of its patience.
}

/**
 * @enum HookTrigger
 * @description
 * The celestial signs, the omens of change.
 * These are the events that stir the hooks from their slumber.
 */
export enum HookTrigger {
  // Content Lifecycle: The epic saga of a blog post, from its humble birth to its glorious publication.
  POST_CREATED = 'post.created', // A new story begins.
  POST_UPDATED = 'post.updated', // The tale is revised.
  POST_PUBLISHED = 'post.published', // The story is shared with the world.
  POST_DELETED = 'post.deleted', // The story is lost to the ages.
  POST_UNPUBLISHED = 'post.unpublished', // The story is withdrawn from the public eye.

  // Media Events: The chronicles of our digital artifacts, the images and sounds that adorn our tales.
  MEDIA_UPLOADED = 'media.uploaded', // A new artifact is forged.
  MEDIA_UPDATED = 'media.updated', // The artifact is reshaped.
  MEDIA_DELETED = 'media.deleted', // The artifact is shattered.
  MEDIA_ANALYZED = 'media.analyzed', // The artifact's secrets are revealed.

  // AI Events: The whispers of the digital muse, the creations of the artificial mind.
  AI_ANALYSIS_STARTED = 'ai.analysis.started', // The muse begins its contemplation.
  AI_ANALYSIS_COMPLETED = 'ai.analysis.completed', // The muse delivers its verdict.
  AI_ANALYSIS_FAILED = 'ai.analysis.failed', // The muse is stumped.
  AUDIO_GENERATION_STARTED = 'audio.generation.started', // The siren begins to sing.
  AUDIO_GENERATION_COMPLETED = 'audio.generation.completed', // The siren's song is complete.
  AUDIO_GENERATION_FAILED = 'audio.generation.failed', // The siren's voice cracks.

  // User Events: The comings and goings of the mortals who grace our realm.
  USER_REGISTERED = 'user.registered', // A new soul joins our fellowship.
  USER_LOGIN = 'user.login', // A familiar face returns.
  USER_LOGOUT = 'user.logout', // A departure, until we meet again.

  // System Events: The inner workings of the machine, the gears of the digital clockwork.
  SCHEDULED_TASK = 'system.scheduled', // The clock strikes the hour.
  API_CALL = 'api.call', // A message from a distant land.
  ERROR_OCCURRED = 'error.occurred', // A crack in the digital firmament.

  // Custom Events: For when the predefined signs are not enough, and we must create our own omens.
  CUSTOM_EVENT = 'custom.event'
}

/**
 * @interface HookExecutionContext
 * @description
 * The stage upon which the hook's drama unfolds.
 * It holds the context of the event, the props for the performance.
 */
export interface HookExecutionContext {
  trigger: HookTrigger // The reason for this gathering, the event that started it all.
  eventData: any // The protagonist of our story, the data that drives the plot.
  timestamp: string // The moment in time, frozen for eternity.
  userId?: string // The mortal who set this in motion, if any.
  sessionId?: string // The thread that connects this moment to others.
  metadata?: Record<string, any> // The footnotes of the story, the details in the margins.
}

/**
 * @interface HookExecutionResult
 * @description
 * The epilogue of the hook's tale, the summary of its deeds.
 * It tells of triumphs and failures, of actions taken and errors made.
 */
export interface HookExecutionResult {
  success: boolean // Did our hero triumph, or was it all for naught?
  executedActions: number // The number of spells cast.
  failedActions: number // The number of spells that fizzled.
  duration: number // The time it took to tell the tale.
  errors: string[] // The list of grievances, the tales of woe.
  results: any[] // The fruits of the labor, the treasures unearthed.
}

/**
 * @class HookSystem
 * @extends EventEmitter
 * @description
 * The master of hooks, the puppeteer of the digital stage.
 * It loads the hooks, listens for the triggers, and orchestrates the grand performance.
 * It's a stateful being, a singleton that holds the knowledge of all hooks.
 */
export class HookSystem extends EventEmitter {
  private supabase: ReturnType<typeof createClient> | null = null
  private hooks: Map<string, Hook> = new Map()
  private actionHandlers: Map<string, Function> = new Map()
  private executionQueue: Array<{ hook: Hook; context: HookExecutionContext }> = []
  private processing = false

  constructor() {
    super()
    this.setupDefaultActionHandlers()
    // We don't want to awaken the hooks during the great slumber of the build process.
    if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production') {
      this.loadHooks()
    }
  }

  private getSupabase() {
    if (!this.supabase) {
      // Lazily summon the Supabase client, for it is a mighty beast.
      this.supabase = createClient()
    }
    return this.supabase
  }

  /**
   * @method registerActionHandler
   * @description
   * Teach the system a new trick, a new spell to cast.
   * @param {string} actionType - The name of the spell.
   * @param {Function} handler - The incantation itself.
   */
  registerActionHandler(actionType: string, handler: Function) {
    this.actionHandlers.set(actionType, handler)
  }

  /**
   * @method loadHooks
   * @description
   * Awaken the hooks from their slumber in the database.
   * A sacred ritual performed at the dawn of the system.
   */
  private async loadHooks() {
    try {
      const { data: hooks, error } = await this.getSupabase()
        .from('hooks')
        .select('*')
        .eq('enabled', true)
        .order('priority', { ascending: true })

      if (error) {
        console.error('The spirits of the database are displeased. Failed to load hooks:', error)
        return
      }

      this.hooks.clear()
      hooks?.forEach(hook => {
        this.hooks.set(hook.id, hook)
      })

      console.log(`The ancient scrolls have been read. ${hooks?.length || 0} hooks have been awakened.`)
    } catch (error) {
      console.error('A disturbance in the force. Error loading hooks:', error)
    }
  }

  /**
   * @method createHook
   * @description
   * Forge a new hook, a new pact between an event and its consequences.
   * @param {Omit<Hook, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'last_executed' | 'success_rate'>} hookData - The blueprint of the new hook.
   * @returns {Promise<Hook>} - The newly forged hook, still warm from the fires of creation.
   */
  async createHook(hookData: Omit<Hook, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'last_executed' | 'success_rate'>) {
    try {
      const { data: hook, error } = await this.getSupabase()
        .from('hooks')
        .insert({
          ...hookData,
          execution_count: 0,
          success_rate: 0
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      this.hooks.set(hook.id, hook)
      this.emit('hook.created', hook)
      
      return hook
    } catch (error) {
      console.error('The forge has gone cold. Failed to create hook:', error)
      throw error
    }
  }

  /**
   * @method updateHook
   * @description
   * Reshape an existing hook, altering its very essence.
   * @param {string} hookId - The name of the hook to be transformed.
   * @param {Partial<Hook>} updates - The changes to be wrought.
   * @returns {Promise<Hook>} - The hook in its new form, a familiar yet different being.
   */
  async updateHook(hookId: string, updates: Partial<Hook>) {
    try {
      const { data: hook, error } = await this.getSupabase()
        .from('hooks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', hookId)
        .select()
        .single()

      if (error) {
        throw error
      }

      this.hooks.set(hookId, hook)
      this.emit('hook.updated', hook)
      
      return hook
    } catch (error) {
      console.error('The chisel has slipped. Failed to update hook:', error)
      throw error
    }
  }

  /**
   * @method deleteHook
   * @description
   * Banish a hook from our realm, erasing it from the annals of history.
   * @param {string} hookId - The name of the hook to be forgotten.
   * @returns {Promise<boolean>} - A confirmation of its demise.
   */
  async deleteHook(hookId: string) {
    try {
      const { error } = await this.getSupabase()
        .from('hooks')
        .delete()
        .eq('id', hookId)

      if (error) {
        throw error
      }

      this.hooks.delete(hookId)
      this.emit('hook.deleted', hookId)
      
      return true
    } catch (error) {
      console.error('The spell of unmaking has failed. Failed to delete hook:', error)
      throw error
    }
  }

  /**
   * @method triggerHooks
   * @description
   * Sound the horn, beat the drum, for an event has occurred!
   * This is the call to arms, the signal for the hooks to assemble.
   * @param {HookTrigger} trigger - The banner under which the hooks will rally.
   * @param {any} eventData - The message from the front lines.
   * @param {Partial<HookExecutionContext>} context - The lay of the land.
   * @returns {Promise<number>} - The number of hooks that answered the call.
   */
  async triggerHooks(trigger: HookTrigger, eventData: any, context: Partial<HookExecutionContext> = {}) {
    const executionContext: HookExecutionContext = {
      trigger,
      eventData,
      timestamp: new Date().toISOString(),
      ...context
    }

    // Find applicable hooks
    const applicableHooks = Array.from(this.hooks.values())
      .filter(hook => hook.trigger === trigger && hook.enabled)
      .filter(hook => this.evaluateConditions(hook.conditions, eventData))
      .sort((a, b) => a.priority - b.priority)

    console.log(`A call to arms! ${applicableHooks.length} hooks rally to the cause of: ${trigger}`)

    // Queue the warriors for the coming battle.
    for (const hook of applicableHooks) {
      this.executionQueue.push({ hook, context: executionContext })
    }

    // Process queue
    this.processExecutionQueue()

    return applicableHooks.length
  }

  /**
   * @method processExecutionQueue
   * @description
   * The marshalling of the troops, the orderly procession into battle.
   * We process the queue of hooks, one by one, lest chaos reign.
   */
  private async processExecutionQueue() {
    if (this.processing || this.executionQueue.length === 0) {
      return
    }

    this.processing = true

    while (this.executionQueue.length > 0) {
      const { hook, context } = this.executionQueue.shift()!
      
      try {
        await this.executeHook(hook, context)
      } catch (error) {
        console.error(`A warrior has fallen. Hook execution failed: ${hook.name}`, error)
      }
    }

    this.processing = false
  }

  /**
   * @method executeHook
   * @description
   * The clash of steel, the casting of spells. This is the heart of the battle.
   * A single hook, in all its glory, unleashed upon the event.
   * @param {Hook} hook - The champion of the hour.
   * @param {HookExecutionContext} context - The battlefield.
   * @returns {Promise<HookExecutionResult>} - The spoils of war, the tale of the battle.
   */
  private async executeHook(hook: Hook, context: HookExecutionContext): Promise<HookExecutionResult> {
    const startTime = Date.now()
    const result: HookExecutionResult = {
      success: true,
      executedActions: 0,
      failedActions: 0,
      duration: 0,
      errors: [],
      results: []
    }

    try {
      console.log(`The champion, ${hook.name}, enters the fray!`)

      // The champion's moves, in order of elegance.
      const sortedActions = [...hook.actions].sort((a, b) => a.order - b.order)

      // A flurry of blows, a symphony of destruction.
      for (const action of sortedActions) {
        try {
          const actionResult = await this.executeAction(action, context)
          result.results.push(actionResult)
          result.executedActions++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          result.errors.push(`Action ${action.type} failed: ${errorMessage}`)
          result.failedActions++
          
          // Some wounds are too deep to continue.
          if (!action.parameters.continueOnFailure) {
            result.success = false
            break
          }
        }
      }

      // Update hook statistics
      await this.updateHookStats(hook.id, result.success)

      // Log execution
      await this.logHookExecution(hook, context, result)

      this.emit('hook.executed', { hook, context, result })

    } catch (error) {
      result.success = false
      result.errors.push(error instanceof Error ? error.message : String(error))
      console.error(`The champion has been vanquished. Hook execution failed: ${hook.name}`, error)
    }

    result.duration = Date.now() - startTime
    return result
  }

  /**
   * @method executeAction
   * @description
   * A single spell, a moment of magic.
   * @param {HookAction} action - The spell to be cast.
   * @param {HookExecutionContext} context - The focus of the spell.
   * @returns {Promise<any>} - The result of the magic, be it a puff of smoke or a bolt of lightning.
   */
  private async executeAction(action: HookAction, context: HookExecutionContext): Promise<any> {
    const handler = this.actionHandlers.get(action.type)
    
    if (!handler) {
      throw new Error(`A forgotten incantation. Unknown action type: ${action.type}`)
    }

    // The sands of time are ever-flowing.
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('The magic took too long to coalesce. Action timeout.')), action.timeout || 30000)
    })

    // We weave the spell, hoping for the best.
    const actionPromise = handler(action.parameters, context)

    try {
      return await Promise.race([actionPromise, timeoutPromise])
    } catch (error) {
      // Sometimes, the magic needs a second chance.
      if (action.retry_count > 0) {
        console.log(`A moment of hesitation. Retrying action ${action.type} (${action.retry_count} attempts left)`)
        action.retry_count--
        
        // A moment of rest before the next attempt.
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - action.retry_count) * 1000))
        
        return this.executeAction(action, context)
      }
      
      throw error
    }
  }

  /**
   * @method evaluateConditions
   * @description
   * The gatekeeper of the hook, the guardian of the sacred laws.
   * It tests the event data against the hook's conditions.
   * @param {HookCondition[]} conditions - The ancient laws.
   * @param {any} eventData - The one who seeks passage.
   * @returns {boolean} - True if the seeker is worthy, false otherwise.
   */
  private evaluateConditions(conditions: HookCondition[], eventData: any): boolean {
    if (!conditions || conditions.length === 0) {
      return true
    }

    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(eventData, condition.field)
      return this.evaluateCondition(fieldValue, condition)
    })
  }

  /**
   * @method evaluateCondition
   * @description
   * A single trial, a test of a single law.
   * @param {any} fieldValue - The soul of the seeker.
   * @param {HookCondition} condition - The law to be tested.
   * @returns {boolean} - The verdict.
   */
  private evaluateCondition(fieldValue: any, condition: HookCondition): boolean {
    const { operator, value, type } = condition

    // Type conversion
    const convertedValue = this.convertValue(fieldValue, type)
    const expectedValue = this.convertValue(value, type)

    switch (operator) {
      case 'eq':
        return convertedValue === expectedValue
      case 'ne':
        return convertedValue !== expectedValue
      case 'gt':
        return convertedValue > expectedValue
      case 'lt':
        return convertedValue < expectedValue
      case 'gte':
        return convertedValue >= expectedValue
      case 'lte':
        return convertedValue <= expectedValue
      case 'contains':
        return String(convertedValue).includes(String(expectedValue))
      case 'not_contains':
        return !String(convertedValue).includes(String(expectedValue))
      case 'exists':
        return convertedValue !== null && convertedValue !== undefined
      case 'not_exists':
        return convertedValue === null || convertedValue === undefined
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(convertedValue)
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(convertedValue)
      default:
        return false
    }
  }

  /**
   * @method getFieldValue
   * @description
   * A journey into the heart of the data, a quest for a single value.
   * @param {any} obj - The treasure map.
   * @param {string} field - The 'X' that marks the spot.
   * @returns {any} - The treasure, or the void if it is not found.
   */
  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * @method convertValue
   * @description
   * The alchemist's touch, turning lead into gold, or at least into the right type.
   * @param {any} value - The raw material.
   * @param {string} type - The desired form.
   * @returns {any} - The transmuted value.
   */
  private convertValue(value: any, type: string): any {
    if (value === null || value === undefined) {
      return value
    }

    switch (type) {
      case 'string':
        return String(value)
      case 'number':
        return Number(value)
      case 'boolean':
        return Boolean(value)
      case 'date':
        return new Date(value)
      case 'array':
        return Array.isArray(value) ? value : [value]
      default:
        return value
    }
  }

  /**
   * @method updateHookStats
   * @description
   * The historian's duty, to record the deeds of the hook.
   * @param {string} hookId - The name of the hero.
   * @param {boolean} success - The outcome of the latest adventure.
   */
  private async updateHookStats(hookId: string, success: boolean) {
    try {
      const hook = this.hooks.get(hookId)
      if (!hook) return

      const newExecutionCount = hook.execution_count + 1
      const newSuccessRate = success 
        ? ((hook.success_rate * hook.execution_count) + 100) / newExecutionCount
        : (hook.success_rate * hook.execution_count) / newExecutionCount

      await this.getSupabase()
        .from('hooks')
        .update({
          execution_count: newExecutionCount,
          success_rate: Math.round(newSuccessRate * 100) / 100,
          last_executed: new Date().toISOString()
        })
        .eq('id', hookId)

      // Update local cache
      hook.execution_count = newExecutionCount
      hook.success_rate = newSuccessRate
      hook.last_executed = new Date().toISOString()
      
    } catch (error) {
      console.error('The annals of history are smudged. Failed to update hook stats:', error)
    }
  }

  /**
   * @method logHookExecution
   * @description
   * The scribe's task, to write the tale of the hook's execution.
   * @param {Hook} hook - The protagonist.
   * @param {HookExecutionContext} context - The setting.
   * @param {HookExecutionResult} result - The plot.
   */
  private async logHookExecution(hook: Hook, context: HookExecutionContext, result: HookExecutionResult) {
    try {
      await this.getSupabase()
        .from('hook_executions')
        .insert({
          hook_id: hook.id,
          trigger: context.trigger,
          event_data: context.eventData,
          execution_context: context,
          result,
          success: result.success,
          duration_ms: result.duration,
          executed_at: context.timestamp
        })
    } catch (error) {
      console.error('The quill has broken. Failed to log hook execution:', error)
    }
  }

  /**
   * @method setupDefaultActionHandlers
   * @description
   * The grimoire of common spells, the book of everyday magic.
   * Here, we define the action handlers that are the bread and butter of our system.
   */
  private setupDefaultActionHandlers() {
    // Generate Audio Action: The siren's call, turning text into song.
    this.registerActionHandler('generate_audio', async (params: any, context: HookExecutionContext) => {
      const { text, voice_id, title, post_id } = params
      
      // Call audio generation API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/external/ai/generate-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HOOKS_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voice_id,
          title,
          save_to_storage: true
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error)
      }

      // Associate with post if provided
      if (post_id && result.data.storage?.media_asset_id) {
        await this.getSupabase()
          .from('blog_posts')
          .update({ primary_audio_id: result.data.storage.media_asset_id })
          .eq('id', post_id)
      }

      return result.data
    })

    // SEO Optimization Action
    this.registerActionHandler('optimize_seo', async (params: any, context: HookExecutionContext) => {
      const { post_id } = params
      
      // Get post data
      const { data: post } = await this.getSupabase()
        .from('blog_posts')
        .select('*')
        .eq('id', post_id)
        .single()

      if (!post) {
        throw new Error('Post not found')
      }

      // Generate SEO optimizations
      const seoTitle = this.generateSEOTitle(post.title, post.content)
      const seoDescription = this.generateSEODescription(post.content)
      const optimizedSlug = this.generateOptimizedSlug(post.title)

      // Update post
      await this.getSupabase()
        .from('blog_posts')
        .update({
          seo_title: seoTitle,
          seo_description: seoDescription,
          slug: optimizedSlug
        })
        .eq('id', post_id)

      return { seoTitle, seoDescription, optimizedSlug }
    })

    // Social Media Posting Action
    this.registerActionHandler('post_to_social', async (params: any, context: HookExecutionContext) => {
      const { post_id, platforms, message_template } = params
      
      // Get post data
      const { data: post } = await this.getSupabase()
        .from('blog_posts')
        .select('*')
        .eq('id', post_id)
        .single()

      if (!post) {
        throw new Error('Post not found')
      }

      const results = []
      
      for (const platform of platforms) {
        try {
          const message = this.generateSocialMessage(post, message_template)
          const result = await this.postToSocialPlatform(platform, message, post)
          results.push({ platform, success: true, result })
        } catch (error) {
          results.push({ 
            platform, 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          })
        }
      }

      return results
    })

    // Email Notification Action
    this.registerActionHandler('send_email', async (params: any, context: HookExecutionContext) => {
      const { to, subject, template, data } = params
      
      // TODO: A promise to the future, a task for another day.
      console.log('A message in a bottle, cast into the digital sea:', { to, subject, template, data })
      
      return { sent: true, to, subject }
    })

    // Webhook Action
    this.registerActionHandler('webhook', async (params: any, context: HookExecutionContext) => {
      const { url, method = 'POST', headers = {}, body } = params
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({ ...body, context })
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    })

    // Content Analysis Action
    this.registerActionHandler('analyze_content', async (params: any, context: HookExecutionContext) => {
      const { post_id, analysis_type = 'quality' } = params
      
      // Get post data
      const { data: post } = await this.getSupabase()
        .from('blog_posts')
        .select('*')
        .eq('id', post_id)
        .single()

      if (!post) {
        throw new Error('Post not found')
      }

      // Perform content analysis
      const analysis = await this.performContentAnalysis(post, analysis_type)
      
      // Store analysis results
      await this.getSupabase()
        .from('content_analyses')
        .insert({
          post_id,
          analysis_type,
          results: analysis,
          analyzed_at: new Date().toISOString()
        })

      return analysis
    })
  }

  // Helper methods for actions

  private generateSEOTitle(title: string, content: string): string {
    // A simple incantation to please the search engine gods.
    const keywords = this.extractKeywords(content)
    const optimizedTitle = keywords.length > 0 
      ? `${title} - ${keywords.slice(0, 2).join(', ')}`
      : title
    
    return optimizedTitle.length > 60 
      ? optimizedTitle.substring(0, 57) + '...'
      : optimizedTitle
  }

  private generateSEODescription(content: string): string {
    // The art of the summary, the essence of the story in a single breath.
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20)
    const description = sentences[0]?.trim() || content.substring(0, 150)
    
    return description.length > 160 
      ? description.substring(0, 157) + '...'
      : description
  }

  private generateOptimizedSlug(title: string): string {
    // The naming ceremony, where a title is given its true name.
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
  }

  private extractKeywords(content: string): string[] {
    // The diviner's art, finding the hidden gems in a sea of words.
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || []
    const frequency = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
  }

  private generateSocialMessage(post: any, template: string): string {
    // The diplomat's craft, tailoring the message for the audience.
    return template
      .replace('{{title}}', post.title)
      .replace('{{excerpt}}', post.excerpt || '')
      .replace('{{url}}', `${process.env.NEXT_PUBLIC_BASE_URL}/blog/${post.slug}`)
      .replace('{{hashtags}}', '#art #blog #ai')
  }

  private async postToSocialPlatform(platform: string, message: string, post: any): Promise<any> {
    // A journey to a distant land, a message to a foreign court.
    // TODO: The map is not yet drawn, the path is not yet clear.
    console.log(`A proclamation is sent to the realm of ${platform}:`, message)
    return { posted: true, platform, message }
  }

  private async performContentAnalysis(post: any, analysisType: string): Promise<any> {
    // The alchemist's experiment, turning content into data.
    // TODO: The formula is not yet perfected, the results are not yet known.
    return {
      type: analysisType,
      score: Math.random() * 100,
      suggestions: ['Improve readability', 'Add more keywords', 'Optimize structure']
    }
  }
}

// Export singleton instance - a lone guardian, a solitary watchman.
let hookSystemInstance: HookSystem | null = null

export const getHookSystem = () => {
  if (!hookSystemInstance) {
    hookSystemInstance = new HookSystem()
  }
  return hookSystemInstance
}

// Export default hooks configuration - the first spells in our grimoire.
export const defaultHooks = [
  {
    name: 'Auto-Generate Audio for Published Posts',
    description: 'When a story is told, let it also be sung.',
    trigger: HookTrigger.POST_PUBLISHED,
    conditions: [
      { field: 'content', operator: 'exists', value: true, type: 'string' },
      { field: 'content.length', operator: 'gt', value: 100, type: 'number' }
    ],
    actions: [
      {
        type: 'generate_audio',
        parameters: {
          text: '{{content}}',
          voice_id: 'EXAVITQu4vr4xnSDxMaL',
          title: 'Audio: {{title}}',
          post_id: '{{id}}'
        },
        order: 1,
        retry_count: 2,
        timeout: 30000
      }
    ],
    enabled: true,
    priority: 1
  },
  {
    name: 'SEO Optimization on Post Update',
    description: 'When a story is revised, let it be made more pleasing to the gods of the web.',
    trigger: HookTrigger.POST_UPDATED,
    conditions: [
      { field: 'seo_title', operator: 'not_exists', value: true, type: 'string' },
      { field: 'seo_description', operator: 'not_exists', value: true, type: 'string' }
    ],
    actions: [
      {
        type: 'optimize_seo',
        parameters: {
          post_id: '{{id}}'
        },
        order: 1,
        retry_count: 1,
        timeout: 10000
      }
    ],
    enabled: true,
    priority: 2
  },
  {
    name: 'Social Media Auto-Post',
    description: 'When a story is published, let the town crier shout it from the rooftops.',
    trigger: HookTrigger.POST_PUBLISHED,
    conditions: [
      { field: 'featured_image_url', operator: 'exists', value: true, type: 'string' },
      { field: 'status', operator: 'eq', value: 'published', type: 'string' }
    ],
    actions: [
      {
        type: 'post_to_social',
        parameters: {
          post_id: '{{id}}',
          platforms: ['twitter', 'facebook'],
          message_template: '🎨 New blog post: {{title}} {{url}} {{hashtags}}'
        },
        order: 1,
        retry_count: 3,
        timeout: 15000
      }
    ],
    enabled: false, // Disabled by default
    priority: 3
  }
]