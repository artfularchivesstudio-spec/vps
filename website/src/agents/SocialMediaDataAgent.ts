import { Agent } from './Agent';
import { Task, TaskResult } from './types';
import { fetchMetrics, analyzeMetrics } from './tools/analytics';

/**
 * Sifts through likes and shares to divine what's hot or not 🔮
 */
export class SocialMediaDataAgent implements Agent {
  name = 'social-data';

  /**
   * Crunch social metrics; for now we just parrot the input 🦜
   */
  async performTask(task: Task): Promise<TaskResult> {
    const { platform } = (task.payload as { platform: string }) || {};
    const metrics = await fetchMetrics(platform);
    const insight = await analyzeMetrics(metrics);
    return { success: true, data: { metrics, insight } };
  }
}
