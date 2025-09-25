import { describe, it, expect, vi } from 'vitest';
import { Orchestrator } from '@/agents/Orchestrator';
import { ContentAgent } from '@/agents/ContentAgent';
import { ProductAgent } from '@/agents/ProductAgent';
import { SocialMediaAgent } from '@/agents/SocialMediaAgent';
import { AdvertisingAgent } from '@/agents/AdvertisingAgent';
import { SocialMediaDataAgent } from '@/agents/SocialMediaDataAgent';
import { CompetitorAnalysisAgent } from '@/agents/CompetitorAnalysisAgent';
import type { Agent } from '@/agents/Agent';
import * as contentTools from '@/agents/tools/content';
import * as productTools from '@/agents/tools/product';
import * as socialTools from '@/agents/tools/social';
import * as adTools from '@/agents/tools/advertising';
import * as analyticsTools from '@/agents/tools/analytics';
import * as competitorTools from '@/agents/tools/competitor';

/**
 * Test the maestro to ensure every instrument plays on cue 🎻
 */
describe('Orchestrator', () => {
  /**
   * Confirms tasks reach the right section of the orchestra 🥁
   */
  it('delegates tasks to the correct agent', async () => {
    const orchestrator = new Orchestrator();
    orchestrator.register(new ContentAgent());
    orchestrator.register(new ProductAgent());
    orchestrator.register(new SocialMediaAgent());
    orchestrator.register(new AdvertisingAgent());
    orchestrator.register(new SocialMediaDataAgent());
    orchestrator.register(new CompetitorAnalysisAgent());

    vi.spyOn(contentTools, 'generateBlogPost').mockResolvedValue('POST');
    vi.spyOn(contentTools, 'generateAudio').mockResolvedValue('AUDIO');
    vi.spyOn(contentTools, 'generateVideoSnippets').mockResolvedValue(['VID']);
    vi.spyOn(productTools, 'createPrintTemplate').mockResolvedValue('TPL');
    vi.spyOn(productTools, 'exportProduct').mockResolvedValue('URL');
    vi.spyOn(socialTools, 'schedulePost').mockResolvedValue('CONFIRM');
    vi.spyOn(adTools, 'launchCampaign').mockResolvedValue('ID');
    vi.spyOn(analyticsTools, 'fetchMetrics').mockResolvedValue({ likes: 1, shares: 1 });
    vi.spyOn(analyticsTools, 'analyzeMetrics').mockResolvedValue('INS');
    vi.spyOn(competitorTools, 'fetchCompetitorData').mockResolvedValue('RAW');
    vi.spyOn(competitorTools, 'summarizeCompetitor').mockResolvedValue('SUM');

    const contentResult = await orchestrator.delegate({ type: 'content', payload: { title: 'test' } });
    expect(contentResult.data).toEqual({ post: 'POST', audio: 'AUDIO', snippets: ['VID'] });

    const productResult = await orchestrator.delegate({ type: 'product', payload: { design: 'd', platform: 'p' } });
    expect(productResult.data).toEqual({ template: 'TPL', productUrl: 'URL' });

    const socialResult = await orchestrator.delegate({ type: 'social', payload: { platform: 'ig', content: 'hi', schedule: 'now' } });
    expect(socialResult.data).toEqual({ confirmation: 'CONFIRM' });

    const adResult = await orchestrator.delegate({ type: 'advertising', payload: { platform: 'meta', budget: 1, creative: 'x' } });
    expect(adResult.data).toEqual({ campaignId: 'ID' });

    const dataResult = await orchestrator.delegate({ type: 'social-data', payload: { platform: 'ig' } });
    expect(dataResult.data).toEqual({ metrics: { likes: 1, shares: 1 }, insight: 'INS' });

    const compResult = await orchestrator.delegate({ type: 'competitor', payload: { url: 'https://example.com' } });
    expect(compResult.data).toEqual({ summary: 'SUM' });
  });

  /**
   * Checks that the conductor shrugs when an unknown instrument appears 🤷
   */
  it('returns failure if no agent registered', async () => {
    const orchestrator = new Orchestrator();
    const result = await orchestrator.delegate({ type: 'mystery' });
    expect(result.success).toBe(false);
  });

  /**
   * Verifies delegation calls the agent via a mock trumpet 🎺
   */
  it('invokes agent performTask via mock', async () => {
    const orchestrator = new Orchestrator();
    const mockAgent: Agent = { name: 'mock', performTask: vi.fn().mockResolvedValue({ success: true }) };
    orchestrator.register(mockAgent);
    await orchestrator.delegate({ type: 'mock' });
    expect(mockAgent.performTask).toHaveBeenCalled();
  });
});
