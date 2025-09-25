import { describe, it, expect, vi } from 'vitest';
import { ContentAgent } from '@/agents/ContentAgent';
import type { Task } from '@/agents/types';
import * as contentTools from '@/agents/tools/content';

/**
 * Ensures the content wizard cooks up copy from a mock brief 🍳
 * Steps:
 * 1. Instantiate agent.
 * 2. Serve a faux task.
 * 3. Verify the platter comes back tasty.
 */
describe('ContentAgent', () => {
  it('creates content from a brief', async () => {
    const agent = new ContentAgent();
    const task: Task = { type: 'content', payload: { title: 'Mock Post', body: 'Body' } };
    const postSpy = vi.spyOn(contentTools, 'generateBlogPost').mockResolvedValue('POST');
    const audioSpy = vi.spyOn(contentTools, 'generateAudio').mockResolvedValue('AUDIO');
    const videoSpy = vi.spyOn(contentTools, 'generateVideoSnippets').mockResolvedValue(['VID1']);
    const result = await agent.performTask(task);
    expect(postSpy).toHaveBeenCalled();
    expect(audioSpy).toHaveBeenCalledWith('POST');
    expect(videoSpy).toHaveBeenCalledWith('AUDIO');
    expect(result.data).toEqual({ post: 'POST', audio: 'AUDIO', snippets: ['VID1'] });
  });
});
