import { Agent } from './Agent';
import { Task, TaskResult } from './types';

/**
 * The maestro conducting our agent symphony 🎼
 */
export class Orchestrator {
  private agents: Map<string, Agent> = new Map();

  /**
   * Register an agent so it can join the jam session 🎷
   */
  register(agent: Agent): void {
    this.agents.set(agent.name, agent);
  }

  /**
   * Delegate a task to the appropriate agent. If nobody responds, we throw a tomato 🍅
   */
  async delegate(task: Task): Promise<TaskResult> {
    const agent = this.agents.get(task.type);
    if (!agent) {
      return { success: false, data: `No agent for task type: ${task.type}` };
    }
    // Timestamp for accountability ⏱️
    console.log(`[${new Date().toISOString()}] Delegating ${task.type}`);
    return agent.performTask(task);
  }

  /**
   * Run the full content pipeline: draft post → schedule snippet → merch → ads → metrics → stalk competitors.
   * Returns a mega-bundle of results because we're overachievers 📦
   */
  async runContentCampaign(params: {
    title: string;
    body?: string;
    platform?: string;
    competitorUrl?: string;
  }): Promise<TaskResult> {
    const { title, body, platform = 'ig', competitorUrl = 'https://example.com' } = params;

    // 1. Write the post and carve media 🎨
    const content = await this.delegate({ type: 'content', payload: { title, body } });
    if (!content.success) return content;

    const snippet = (content.data as any).snippets?.[0] ?? '';

    // 2. Schedule on social 📅
    const social = await this.delegate({
      type: 'social',
      payload: { platform, content: snippet, schedule: 'now' },
    });

    // 3. Spin up merch 🛍️
    const product = await this.delegate({
      type: 'product',
      payload: { design: (content.data as any).post, platform: 'printify' },
    });

    // 4. Launch ads 💸
    const advertising = await this.delegate({
      type: 'advertising',
      payload: { platform, budget: 100, creative: snippet },
    });

    // 5. Grab metrics 📊
    const metrics = await this.delegate({ type: 'social-data', payload: { platform } });

    // 6. Spy on the competition 🕵️
    const competitor = await this.delegate({ type: 'competitor', payload: { url: competitorUrl } });

    return {
      success: true,
      data: { content: content.data, social: social.data, product: product.data, advertising: advertising.data, metrics: metrics.data, competitor: competitor.data },
    };
  }
}
