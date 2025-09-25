import { describe, it, expect, vi } from 'vitest';
import { ProductAgent } from '@/agents/ProductAgent';
import type { Task } from '@/agents/types';
import * as productTools from '@/agents/tools/product';

/**
 * Confirms the merch smith forges templates on command 🛠️
 * Steps:
 * 1. Spin up the ProductAgent.
 * 2. Hand it a mock blueprint.
 * 3. Ensure the swag comes back with a wink.
 */
describe('ProductAgent', () => {
  it('generates a product template', async () => {
    const agent = new ProductAgent();
    const task: Task = { type: 'product', payload: { design: 'Skull', platform: 'printify' } };
    const templateSpy = vi.spyOn(productTools, 'createPrintTemplate').mockResolvedValue('TEMPLATE');
    const exportSpy = vi.spyOn(productTools, 'exportProduct').mockResolvedValue('URL');
    const result = await agent.performTask(task);
    expect(templateSpy).toHaveBeenCalledWith('Skull', 'printify');
    expect(exportSpy).toHaveBeenCalledWith('TEMPLATE');
    expect(result.data).toEqual({ template: 'TEMPLATE', productUrl: 'URL' });
  });
});
