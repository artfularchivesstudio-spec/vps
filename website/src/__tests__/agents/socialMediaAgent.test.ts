import { describe, it, expect, vi } from 'vitest';
import { SocialMediaAgent } from '@/agents/SocialMediaAgent';
import type { Task } from '@/agents/types';
import * as socialTools from '@/agents/tools/social';

/**
 * Checks the hashtag wrangler schedules with style 📅
 * Steps:
 * 1. Boot up the social butterfly.
 * 2. Pass a faux post payload.
 * 3. Watch it promise a glamorous debut.
 */
describe('SocialMediaAgent', () => {
  it('schedules a mock post', async () => {
    const agent = new SocialMediaAgent();
    const task: Task = {
      type: 'social',
      payload: { platform: 'ig', content: 'Hello world', schedule: '2025-08-29' },
    };
    const spy = vi.spyOn(socialTools, 'schedulePost').mockResolvedValue('CONFIRM');
    const result = await agent.performTask(task);
    expect(spy).toHaveBeenCalledWith('ig', 'Hello world', '2025-08-29');
    expect(result.data).toEqual({ confirmation: 'CONFIRM' });
  });
});
