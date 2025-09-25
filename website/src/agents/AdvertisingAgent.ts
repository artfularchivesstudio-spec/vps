import { Agent } from './Agent';
import { Task, TaskResult } from './types';
import { launchCampaign } from './tools/advertising';

/**
 * Buys ad spots and counts conversions like a bargain-hunting hawk 🦅
 */
export class AdvertisingAgent implements Agent {
  name = 'advertising';

  /**
   * Launches ad campaigns; currently just passes through a mock ack 🤷‍♀️
   */
  async performTask(task: Task): Promise<TaskResult> {
    const { platform, budget, creative } =
      (task.payload as { platform: string; budget: number; creative: string }) || {};
    const campaignId = await launchCampaign(platform, budget, creative);
    return { success: true, data: { campaignId } };
  }
}
