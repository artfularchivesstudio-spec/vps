import { Agent } from './Agent';
import { Task, TaskResult } from './types';
import { generateBlogPost, generateAudio, generateVideoSnippets } from './tools/content';

/**
 * Crafts blog posts and funky reels like it's going out of style 💃
 */
export class ContentAgent implements Agent {
  name = 'content';

  /**
   * Generate content; currently just echoes the payload because we're shy 🙈
   */
  async performTask(task: Task): Promise<TaskResult> {
    const { title, body } = (task.payload as { title: string; body?: string }) || {};
    const post = await generateBlogPost({ title, body });
    const audio = await generateAudio(post);
    const snippets = await generateVideoSnippets(audio);
    return { success: true, data: { post, audio, snippets } };
  }
}
