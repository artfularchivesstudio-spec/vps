import { describe, it, expect, vi } from 'vitest';
import { CompetitorAnalysisAgent } from '@/agents/CompetitorAnalysisAgent';
import type { Task } from '@/agents/types';
import * as competitorTools from '@/agents/tools/competitor';

/**
 * Ensures our snoop agent reports back gossip in good humor 🕵️‍♀️
 * Steps:
 * 1. Create the competitor scout.
 * 2. Send a bogus intel request.
 * 3. Confirm we get mirrored gossip.
 */
describe('CompetitorAnalysisAgent', () => {
  it('summarizes competitor intel', async () => {
    const agent = new CompetitorAnalysisAgent();
    const task: Task = { type: 'competitor', payload: { url: 'https://example.com' } };
    const fetchSpy = vi.spyOn(competitorTools, 'fetchCompetitorData').mockResolvedValue('RAW');
    const summarizeSpy = vi.spyOn(competitorTools, 'summarizeCompetitor').mockResolvedValue('SUM');
    const result = await agent.performTask(task);
    expect(fetchSpy).toHaveBeenCalledWith('https://example.com');
    expect(summarizeSpy).toHaveBeenCalledWith('RAW');
    expect(result.data).toEqual({ summary: 'SUM' });
  });
});
