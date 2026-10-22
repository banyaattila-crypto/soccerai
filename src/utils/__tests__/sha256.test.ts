import { describe, it, expect } from 'vitest';
import { sha256Hex } from '../sha256';

async function webCryptoSha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

describe('sha256Hex', () => {
  it('ismert tesztvektorok', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('megegyezik a WebCrypto eredményével több hosszon (blokkhatárok, UTF-8)', async () => {
    for (const len of [1, 54, 55, 56, 63, 64, 65, 119, 120, 1000]) {
      const s = 'á'.repeat(len);
      expect(sha256Hex(s)).toBe(await webCryptoSha256(s));
    }
    const rec = 'm1|1790000000000|2026-10-22T10:00:00.000Z|1X2_HOME|0.5123|2.1';
    expect(sha256Hex(rec)).toBe(await webCryptoSha256(rec));
  });
});
