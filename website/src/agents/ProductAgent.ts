import { Agent } from './Agent';
import { Task, TaskResult } from './types';
import { createPrintTemplate, exportProduct } from './tools/product';

/**
 * Assembles merch templates faster than you can say "hipster" 🧢
 */
export class ProductAgent implements Agent {
  name = 'product';

  /**
   * Pretend to generate a product template; returns a snarky note 🤖
   */
  async performTask(task: Task): Promise<TaskResult> {
    const { design, platform } = (task.payload as { design: string; platform: string }) || {};
    const template = await createPrintTemplate(design, platform);
    const productUrl = await exportProduct(template);
    return { success: true, data: { template, productUrl } };
  }
}
