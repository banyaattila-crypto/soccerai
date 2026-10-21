import { eventBus } from '../utils/eventBus';

export const PIN_STORAGE_KEYS = {
  ENABLED: 'focitipp_pin_enabled',
  HASH: 'focitipp_pin_hash',
  SALT: 'focitipp_pin_salt',
  FAILED_ATTEMPTS: 'focitipp_pin_failed_attempts',
  LOCKOUT_UNTIL: 'focitipp_pin_lockout_until',
} as const;

export const MAX_PIN_FAILED_ATTEMPTS = 5;
export const PIN_LOCKOUT_DURATION_MS = 30_000; // 30 másodperc

export interface PinVerificationResult {
  success: boolean;
  remainingAttempts?: number;
  lockoutSeconds?: number;
  error?: string;
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
    return (globalThis as unknown as { localStorage: Storage }).localStorage;
  }
  return null;
}

/**
 * Ellenőrzi, hogy a bemenet pontosan 6 számjegyű-e.
 */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

/**
 * Biztonságos 16 bájtos véletlenszerű hex só (salt) generálása.
 */
export function generatePinSalt(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Visszaeső determinisztikus só nem-kripto környezetekhez
  return (
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  ).substring(0, 32);
}

/**
 * SHA-256 kriptográfiai hash előállítása a PIN kódból és a sóból.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${pin}:soccerai_pin_salt_v1`);

  if (
    typeof crypto !== 'undefined' &&
    crypto.subtle &&
    typeof crypto.subtle.digest === 'function'
  ) {
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Szükséghelyzeti hash függvény ha a crypto.subtle nem érhető el
  let hash1 = 0x811c9dc5;
  let hash2 = 0x01000193;
  for (let i = 0; i < data.length; i++) {
    hash1 ^= data[i];
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 ^= data[i];
    hash2 = Math.imul(hash2, 0x811c9dc5);
  }
  return (
    Math.abs(hash1).toString(16).padStart(8, '0') +
    Math.abs(hash2).toString(16).padStart(8, '0')
  );
}

/**
 * Ellenőrzi, hogy a 6-jegyű PIN védelem aktív-e.
 */
export function isPinEnabled(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  const enabled = storage.getItem(PIN_STORAGE_KEYS.ENABLED) === 'true';
  const hasHash = Boolean(storage.getItem(PIN_STORAGE_KEYS.HASH));
  const hasSalt = Boolean(storage.getItem(PIN_STORAGE_KEYS.SALT));
  return enabled && hasHash && hasSalt;
}

/**
 * Ellenőrzi, hogy van-e már elmentett PIN kód (akár inaktív állapotban is).
 */
export function hasPinConfigured(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return (
    Boolean(storage.getItem(PIN_STORAGE_KEYS.HASH)) &&
    Boolean(storage.getItem(PIN_STORAGE_KEYS.SALT))
  );
}

/**
 * Megadja a hátralévő kizárási (lockout) másodperceket brute-force kísérlet esetén.
 */
export function getPinLockoutRemainingSeconds(): number {
  const storage = getStorage();
  if (!storage) return 0;
  const lockoutUntilRaw = storage.getItem(PIN_STORAGE_KEYS.LOCKOUT_UNTIL);
  if (!lockoutUntilRaw) return 0;
  const lockoutUntil = parseInt(lockoutUntilRaw, 10);
  const now = Date.now();
  if (lockoutUntil > now) {
    return Math.ceil((lockoutUntil - now) / 1000);
  }
  return 0;
}

/**
 * Aktuális sikertelen kísérletek száma.
 */
export function getPinFailedAttempts(): number {
  const storage = getStorage();
  if (!storage) return 0;
  const attempts = storage.getItem(PIN_STORAGE_KEYS.FAILED_ATTEMPTS);
  return attempts ? parseInt(attempts, 10) : 0;
}

/**
 * Új 6-jegyű PIN kód beállítása és aktiválása.
 */
export async function setupPin(
  pin: string
): Promise<{ success: boolean; error?: string }> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'Tárhely (localStorage) nem elérhető!' };
  }

  if (!isValidPinFormat(pin)) {
    return {
      success: false,
      error: 'A PIN kódnak pontosan 6 számjegyből kell állnia!',
    };
  }

  const salt = generatePinSalt();
  const hash = await hashPin(pin, salt);

  storage.setItem(PIN_STORAGE_KEYS.SALT, salt);
  storage.setItem(PIN_STORAGE_KEYS.HASH, hash);
  storage.setItem(PIN_STORAGE_KEYS.ENABLED, 'true');
  storage.removeItem(PIN_STORAGE_KEYS.FAILED_ATTEMPTS);
  storage.removeItem(PIN_STORAGE_KEYS.LOCKOUT_UNTIL);

  eventBus.emit('pin_state_changed');
  return { success: true };
}

/**
 * Megadott PIN kód ellenőrzése (feloldás).
 */
export async function verifyPin(
  candidatePin: string
): Promise<PinVerificationResult> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'Tárhely nem érhető el!' };
  }

  const lockoutSec = getPinLockoutRemainingSeconds();
  if (lockoutSec > 0) {
    return {
      success: false,
      lockoutSeconds: lockoutSec,
      error: `Túl sok sikertelen próbálkozás. Kérlek várj ${lockoutSec} másodpercet!`,
    };
  }

  const storedHash = storage.getItem(PIN_STORAGE_KEYS.HASH);
  const storedSalt = storage.getItem(PIN_STORAGE_KEYS.SALT);

  if (!storedHash || !storedSalt) {
    return {
      success: false,
      error: 'Nincs beállított PIN kód a rendszerben!',
    };
  }

  const candidateHash = await hashPin(candidatePin, storedSalt);

  if (candidateHash === storedHash) {
    // Sikeres feloldás: hibaszámlálók nullázása
    storage.removeItem(PIN_STORAGE_KEYS.FAILED_ATTEMPTS);
    storage.removeItem(PIN_STORAGE_KEYS.LOCKOUT_UNTIL);
    return { success: true };
  }

  // Sikertelen feloldás: kísérletszámláló növelése
  const failedAttempts = getPinFailedAttempts() + 1;
  storage.setItem(
    PIN_STORAGE_KEYS.FAILED_ATTEMPTS,
    failedAttempts.toString()
  );

  if (failedAttempts >= MAX_PIN_FAILED_ATTEMPTS) {
    const lockoutUntil = Date.now() + PIN_LOCKOUT_DURATION_MS;
    storage.setItem(
      PIN_STORAGE_KEYS.LOCKOUT_UNTIL,
      lockoutUntil.toString()
    );
    return {
      success: false,
      lockoutSeconds: Math.ceil(PIN_LOCKOUT_DURATION_MS / 1000),
      remainingAttempts: 0,
      error: `5 hibás próbálkozás miatt az alkalmazás 30 másodpercre zárolva lett!`,
    };
  }

  const remaining = MAX_PIN_FAILED_ATTEMPTS - failedAttempts;
  return {
    success: false,
    remainingAttempts: remaining,
    error: `Helytelen PIN kód! Még ${remaining} próbálkozási lehetőség maradt.`,
  };
}

/**
 * PIN védelem kikapcsolása a jelenlegi PIN kód ellenőrzésével.
 */
export async function disablePin(
  currentPin: string
): Promise<{ success: boolean; error?: string }> {
  const storage = getStorage();
  if (!storage) {
    return { success: false, error: 'Tárhely nem érhető el!' };
  }

  const verifyRes = await verifyPin(currentPin);
  if (!verifyRes.success) {
    return {
      success: false,
      error: verifyRes.error || 'A megadott jelenlegi PIN kód helytelen!',
    };
  }

  storage.setItem(PIN_STORAGE_KEYS.ENABLED, 'false');
  storage.removeItem(PIN_STORAGE_KEYS.FAILED_ATTEMPTS);
  storage.removeItem(PIN_STORAGE_KEYS.LOCKOUT_UNTIL);

  eventBus.emit('pin_state_changed');
  return { success: true };
}

/**
 * PIN kód megváltoztatása (jelenlegi kód ellenőrzése + új kód mentése).
 */
export async function changePin(
  currentPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  const verifyRes = await verifyPin(currentPin);
  if (!verifyRes.success) {
    return {
      success: false,
      error: verifyRes.error || 'A jelenlegi PIN kód helytelen!',
    };
  }

  if (!isValidPinFormat(newPin)) {
    return {
      success: false,
      error: 'Az új PIN kódnak pontosan 6 számjegyből kell állnia!',
    };
  }

  return setupPin(newPin);
}

/**
 * Vészhelyzeti PIN visszaállítás (ha a felhasználó elfelejtette a kódot).
 * Törli a PIN konfigurációt és feloldja a zárolást.
 */
export function resetPinEmergency(): void {
  const storage = getStorage();
  if (!storage) return;

  storage.removeItem(PIN_STORAGE_KEYS.ENABLED);
  storage.removeItem(PIN_STORAGE_KEYS.HASH);
  storage.removeItem(PIN_STORAGE_KEYS.SALT);
  storage.removeItem(PIN_STORAGE_KEYS.FAILED_ATTEMPTS);
  storage.removeItem(PIN_STORAGE_KEYS.LOCKOUT_UNTIL);

  eventBus.emit('pin_state_changed');
}
