import { describe, it, expect, vi } from 'vitest';
import { SocialMediaDataAgent } from '@/agents/SocialMediaDataAgent';
import type { Task } from '@/agents/types';
import * as analyticsTools from '@/agents/tools/analytics';

/**
 * Checks that analytics whiz parses mock metrics without breaking a sweat 📊
 * Steps:
 * 1. Boot the data agent.
 * 2. Toss some fake metrics.
 * 3. Verify the analysis echo.
 */
describe('SocialMediaDataAgent', () => {
  it('analyzes social metrics', async () => {
    const agent = new SocialMediaDataAgent();
    const task: Task = { type: 'social-data', payload: { platform: 'ig' } };
    const fetchSpy = vi.spyOn(analyticsTools, 'fetchMetrics').mockResolvedValue({ likes: 1, shares: 2 });
    const analyzeSpy = vi.spyOn(analyticsTools, 'analyzeMetrics').mockResolvedValue('INSIGHT');
    const result = await agent.performTask(task);
    expect(fetchSpy).toHaveBeenCalledWith('ig');
    expect(analyzeSpy).toHaveBeenCalledWith({ likes: 1, shares: 2 });
    expect(result.data).toEqual({ metrics: { likes: 1, shares: 2 }, insight: 'INSIGHT' });
  });
});
