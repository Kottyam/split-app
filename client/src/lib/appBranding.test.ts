import { describe, expect, it } from 'vitest';
import { get } from 'node:http';

describe('Kharcha app branding asset', () => {
  it('serves the configured logo asset from the local app endpoint', async () => {
    const logoPath = process.env.VITE_APP_LOGO ?? '/manus-storage/kharcha-logo-transparent_b8cc8f74.png';
    expect(logoPath).toMatch(/^\/manus-storage\/(?:kharcha-logo-|175679-removebg-preview)/);
    const response = await new Promise<{ statusCode?: number; headers: Record<string, string | string[] | undefined> }>((resolve, reject) => {
      const request = get(`http://127.0.0.1:3000${logoPath}`, { timeout: 5_000 }, incoming => {
        incoming.resume();
        incoming.once('end', () => resolve({ statusCode: incoming.statusCode, headers: incoming.headers }));
      });
      request.once('timeout', () => request.destroy(new Error('branding asset request timed out')));
      request.once('error', reject);
    });
    expect([200, 307]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      expect(String(response.headers['content-type'] ?? '')).toMatch(/image\//);
    } else {
      expect(String(response.headers.location ?? '')).toMatch(/^https:\/\//);
    }
  }, 10_000);
});
