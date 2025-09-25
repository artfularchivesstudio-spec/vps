import { describe, it, expect, vi } from 'vitest';
import { Orchestrator } from '@/agents/Orchestrator';
import { ContentAgent } from '@/agents/ContentAgent';
import { ProductAgent } from '@/agents/ProductAgent';
import { SocialMediaAgent } from '@/agents/SocialMediaAgent';
import { AdvertisingAgent } from '@/agents/AdvertisingAgent';
import { SocialMediaDataAgent } from '@/agents/SocialMediaDataAgent';
import { CompetitorAnalysisAgent } from '@/agents/CompetitorAnalysisAgent';
import * as contentTools from '@/agents/tools/content';
import * as productTools from '@/agents/tools/product';
import * as socialTools from '@/agents/tools/social';
import * as adTools from '@/agents/tools/advertising';
import * as analyticsTools from '@/agents/tools/analytics';
import * as competitorTools from '@/agents/tools/competitor';

/**
 * Ensures the mega workflow hits every stop on the tour bus 🚌
 */
describe('Orchestrator runContentCampaign', () => {
  /**
   * Mocks each tool so the pipeline can strut its stuff 💃
   */
  it('chains content, social, product, ads, metrics, and competitor intel', async () => {
    const orchestrator = new Orchestrator();
    orchestrator.register(new ContentAgent());
    orchestrator.register(new ProductAgent());
    orchestrator.register(new SocialMediaAgent());
    orchestrator.register(new AdvertisingAgent());
    orchestrator.register(new SocialMediaDataAgent());
    orchestrator.register(new CompetitorAnalysisAgent());

    vi.spyOn(contentTools, 'generateBlogPost').mockResolvedValue('POST');
    vi.spyOn(contentTools, 'generateAudio').mockResolvedValue('AUDIO');
    vi.spyOn(contentTools, 'generateVideoSnippets').mockResolvedValue(['SNIP']);
    vi.spyOn(productTools, 'createPrintTemplate').mockResolvedValue('TPL');
    vi.spyOn(productTools, 'exportProduct').mockResolvedValue('URL');
    vi.spyOn(socialTools, 'schedulePost').mockResolvedValue('SOC');
    vi.spyOn(adTools, 'launchCampaign').mockResolvedValue('AD');
    vi.spyOn(analyticsTools, 'fetchMetrics').mockResolvedValue({ likes: 1 });
    vi.spyOn(analyticsTools, 'analyzeMetrics').mockResolvedValue('INS');
    vi.spyOn(competitorTools, 'fetchCompetitorData').mockResolvedValue('RAW');
    vi.spyOn(competitorTools, 'summarizeCompetitor').mockResolvedValue('SUM');

    const result = await orchestrator.runContentCampaign({ title: 'Hello' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      content: { post: 'POST', audio: 'AUDIO', snippets: ['SNIP'] },
      social: { confirmation: 'SOC' },
      product: { template: 'TPL', productUrl: 'URL' },
      advertising: { campaignId: 'AD' },
      metrics: { metrics: { likes: 1 }, insight: 'INS' },
      competitor: { summary: 'SUM' },
    });
  });
});
