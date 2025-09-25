import { describe, it, expect, vi } from 'vitest';
import { AdvertisingAgent } from '@/agents/AdvertisingAgent';
import type { Task } from '@/agents/types';
import * as adTools from '@/agents/tools/advertising';

/**
 * Validates the ad guru politely acknowledges campaign briefs 📣
 * Steps:
 * 1. Spin up advertising agent.
 * 2. Feed it a pretend campaign.
 * 3. Ensure we get a courteous nod.
 */
describe('AdvertisingAgent', () => {
  it('handles ad campaign tasks', async () => {
    const agent = new AdvertisingAgent();
    const task: Task = {
      type: 'advertising',
      payload: { platform: 'meta', budget: 100, creative: 'abc' },
    };
    const spy = vi.spyOn(adTools, 'launchCampaign').mockResolvedValue('ID');
    const result = await agent.performTask(task);
    expect(spy).toHaveBeenCalledWith('meta', 100, 'abc');
    expect(result.data).toEqual({ campaignId: 'ID' });
  });
});
