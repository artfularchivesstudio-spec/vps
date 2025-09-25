import { Agent } from './Agent';
import { Task, TaskResult } from './types';
import { schedulePost } from './tools/social';

/**
 * Schedules posts and collects hashtags like rare stamps #️⃣
 */
export class SocialMediaAgent implements Agent {
  name = 'social';

  /**
   * Schedule a post; for now we just wave politely 👋
   */
  async performTask(task: Task): Promise<TaskResult> {
    const { platform, content, schedule } =
      (task.payload as { platform: string; content: string; schedule: string }) || {};
    const confirmation = await schedulePost(platform, content, schedule);
    return { success: true, data: { confirmation } };
  }
}
