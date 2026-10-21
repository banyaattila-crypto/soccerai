import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isValidPinFormat,
  setupPin,
  verifyPin,
  isPinEnabled,
  changePin,
  disablePin,
  resetPinEmergency,
  getPinFailedAttempts,
  getPinLockoutRemainingSeconds,
  PIN_STORAGE_KEYS,
  MAX_PIN_FAILED_ATTEMPTS,
} from '../pinService';

const storageMock: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => storageMock[key] ?? null,
    setItem: (key: string, val: string) => {
      storageMock[key] = String(val);
    },
    removeItem: (key: string) => {
      delete storageMock[key];
    },
    clear: () => {
      for (const k of Object.keys(storageMock)) delete storageMock[k];
    },
    get length() {
      return Object.keys(storageMock).length;
    },
    key: (index: number) => Object.keys(storageMock)[index] ?? null,
  },
  configurable: true,
  writable: true,
});

describe('6-digit PIN Service & Security Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('PIN Format Validation', () => {
    it('accepts valid 6-digit numeric strings', () => {
      expect(isValidPinFormat('123456')).toBe(true);
      expect(isValidPinFormat('000000')).toBe(true);
      expect(isValidPinFormat('987654')).toBe(true);
    });

    it('rejects invalid lengths and non-numeric characters', () => {
      expect(isValidPinFormat('12345')).toBe(false);
      expect(isValidPinFormat('1234567')).toBe(false);
      expect(isValidPinFormat('abcdef')).toBe(false);
      expect(isValidPinFormat('12345a')).toBe(false);
      expect(isValidPinFormat('')).toBe(false);
      expect(isValidPinFormat(' 123456 ')).toBe(false);
    });
  });

  describe('Setup and Verification Flow', () => {
    it('starts with PIN disabled by default', () => {
      expect(isPinEnabled()).toBe(false);
    });

    it('sets up a 6-digit PIN with secure salt and hash', async () => {
      const res = await setupPin('482910');
      expect(res.success).toBe(true);
      expect(isPinEnabled()).toBe(true);

      const salt = localStorage.getItem(PIN_STORAGE_KEYS.SALT);
      const hash = localStorage.getItem(PIN_STORAGE_KEYS.HASH);
      expect(salt).toBeTruthy();
      expect(hash).toBeTruthy();
      expect(hash?.length).toBe(64); // SHA-256 hex length
    });

    it('verifies correct PIN successfully', async () => {
      await setupPin('554433');
      const verifyRes = await verifyPin('554433');
      expect(verifyRes.success).toBe(true);
      expect(getPinFailedAttempts()).toBe(0);
    });

    it('rejects incorrect PIN and decrements remaining attempts', async () => {
      await setupPin('112233');
      const verifyRes = await verifyPin('999999');
      expect(verifyRes.success).toBe(false);
      expect(verifyRes.remainingAttempts).toBe(MAX_PIN_FAILED_ATTEMPTS - 1);
      expect(getPinFailedAttempts()).toBe(1);
    });
  });

  describe('Brute-Force & Rate Limiting Protection', () => {
    it('triggers a 30-second lockout after 5 consecutive failed attempts', async () => {
      await setupPin('654321');

      for (let i = 1; i <= 4; i++) {
        const res = await verifyPin('000000');
        expect(res.success).toBe(false);
        expect(res.remainingAttempts).toBe(MAX_PIN_FAILED_ATTEMPTS - i);
      }

      // 5th attempt triggers lockout
      const fifthRes = await verifyPin('000000');
      expect(fifthRes.success).toBe(false);
      expect(fifthRes.remainingAttempts).toBe(0);
      expect(fifthRes.lockoutSeconds).toBeGreaterThan(0);
      expect(getPinLockoutRemainingSeconds()).toBeGreaterThan(0);

      // Subsequent attempt blocked even with correct PIN while locked out
      const blockedRes = await verifyPin('654321');
      expect(blockedRes.success).toBe(false);
      expect(blockedRes.lockoutSeconds).toBeGreaterThan(0);
    });
  });

  describe('Change and Disable Flow', () => {
    it('changes PIN when current PIN is verified', async () => {
      await setupPin('123456');
      const changeRes = await changePin('123456', '654321');
      expect(changeRes.success).toBe(true);

      // Old PIN fails
      const oldCheck = await verifyPin('123456');
      expect(oldCheck.success).toBe(false);

      // New PIN succeeds
      const newCheck = await verifyPin('654321');
      expect(newCheck.success).toBe(true);
    });

    it('rejects PIN change when current PIN is wrong', async () => {
      await setupPin('123456');
      const changeRes = await changePin('000000', '654321');
      expect(changeRes.success).toBe(false);
    });

    it('disables PIN when current PIN is verified', async () => {
      await setupPin('123456');
      expect(isPinEnabled()).toBe(true);

      const disableRes = await disablePin('123456');
      expect(disableRes.success).toBe(true);
      expect(isPinEnabled()).toBe(false);
    });

    it('rejects disable when current PIN is wrong', async () => {
      await setupPin('123456');
      const disableRes = await disablePin('000000');
      expect(disableRes.success).toBe(false);
      expect(isPinEnabled()).toBe(true);
    });
  });

  describe('Emergency Reset', () => {
    it('resets and wipes all PIN credentials on emergency reset', async () => {
      await setupPin('998877');
      expect(isPinEnabled()).toBe(true);

      resetPinEmergency();

      expect(isPinEnabled()).toBe(false);
      expect(localStorage.getItem(PIN_STORAGE_KEYS.HASH)).toBeNull();
      expect(localStorage.getItem(PIN_STORAGE_KEYS.SALT)).toBeNull();
    });
  });
});
