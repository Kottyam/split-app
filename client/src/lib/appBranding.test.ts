import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Kharcha app branding asset', () => {
  it('keeps the Kharcha logo inside the local app bundle', () => {
    expect(existsSync(resolve(process.cwd(), 'client/public/icons/kharcha-logo-mark.png'))).toBe(true);
  });
});
