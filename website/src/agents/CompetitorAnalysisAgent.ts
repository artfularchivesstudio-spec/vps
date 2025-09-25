import { Agent } from './Agent';
import { Task, TaskResult } from './types';
import { fetchCompetitorData, summarizeCompetitor } from './tools/competitor';

/**
 * Spies on rivals politely and reports the tea ☕
 */
export class CompetitorAnalysisAgent implements Agent {
  name = 'competitor';

  /**
   * Evaluate competitor intel; placeholder that simply echoes payload 🪞
   */
  async performTask(task: Task): Promise<TaskResult> {
    const { url } = (task.payload as { url: string }) || {};
    const raw = await fetchCompetitorData(url);
    const summary = await summarizeCompetitor(raw);
    return { success: true, data: { summary } };
  }
}
