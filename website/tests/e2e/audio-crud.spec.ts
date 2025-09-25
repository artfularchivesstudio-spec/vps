import { test, expect } from '@playwright/test';

test.describe('Audio Jobs CRUD Operations', () => {
  const API_KEY = process.env.CHATGPT_ACTIONS_KEY;
  const BASE_URL = 'http://localhost:3000/api/external/ai';

  test('should create/list/get/update/delete audio job', async ({ request }) => {
    // Test CREATE
    const createResponse = await request.post(`${BASE_URL}/audio-jobs`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      data: {
        text: 'Test audio narration content',
        provider: 'elevenlabs',
        voice_id: 'EXAVITQu4vr4xnSDxMaL'
      }
    });
    expect(createResponse.status()).toBe(202);
    const { job_id } = await createResponse.json().data;

    // Test LIST
    const listResponse = await request.get(`${BASE_URL}/audio-jobs`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    expect(listResponse.status()).toBe(200);
    expect(await listResponse.json().data.audio_jobs.some(j => j.job_id === job_id)).toBe(true);

    // Test GET
    const getResponse = await request.get(`${BASE_URL}/audio-jobs/${job_id}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    expect(getResponse.status()).toBe(200);
    expect(await getResponse.json().data.job_id).toBe(job_id);

    // Test UPDATE
    const updateResponse = await request.put(`${BASE_URL}/audio-jobs/${job_id}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      data: {
        provider: 'openai',
        voice_id: 'alloy'
      }
    });
    expect(updateResponse.status()).toBe(200);

    // Test DELETE
    const deleteResponse = await request.delete(`${BASE_URL}/audio-jobs/${job_id}`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    expect(deleteResponse.status()).toBe(200);
  });

  test('should handle invalid audio job operations', async ({ request }) => {
    // Test invalid job ID
    const invalidResponse = await request.get(`${BASE_URL}/audio-jobs/invalid_id`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    expect(invalidResponse.status()).toBe(404);

    // Test unauthorized access
    const unauthorizedResponse = await request.get(`${BASE_URL}/audio-jobs`, {
      headers: { Authorization: 'Bearer invalid_key' }
    });
    expect(unauthorizedResponse.status()).toBe(401);
  });
});