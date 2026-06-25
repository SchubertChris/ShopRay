import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptSecret, decryptSecret, isPlaintext, encryptionEnabled } from './totpCrypto';

const SECRET = 'JBSWY3DPEHPK3PXP'; // typisches Base32-TOTP-Secret

describe('totpCrypto — ohne TOTP_ENC_KEY (rückwärtskompatibel)', () => {
  beforeEach(() => { delete process.env.TOTP_ENC_KEY; });

  it('encryptionEnabled ist false', () => {
    expect(encryptionEnabled()).toBe(false);
  });

  it('encryptSecret gibt Klartext unverändert zurück', () => {
    expect(encryptSecret(SECRET)).toBe(SECRET);
  });

  it('decryptSecret reicht Legacy-Klartext durch', () => {
    expect(decryptSecret(SECRET)).toBe(SECRET);
  });

  it('isPlaintext erkennt Klartext', () => {
    expect(isPlaintext(SECRET)).toBe(true);
  });
});

describe('totpCrypto — mit TOTP_ENC_KEY', () => {
  beforeEach(() => { process.env.TOTP_ENC_KEY = 'test-key-0123456789abcdef'; });
  afterEach(() => { delete process.env.TOTP_ENC_KEY; });

  it('encryptionEnabled ist true', () => {
    expect(encryptionEnabled()).toBe(true);
  });

  it('verschlüsselt mit Präfix und nicht im Klartext', () => {
    const enc = encryptSecret(SECRET);
    expect(enc).toMatch(/^enc:v1:/);
    expect(enc).not.toContain(SECRET);
    expect(isPlaintext(enc)).toBe(false);
  });

  it('Round-Trip: decrypt(encrypt(x)) === x', () => {
    expect(decryptSecret(encryptSecret(SECRET))).toBe(SECRET);
  });

  it('zwei Verschlüsselungen ergeben verschiedene Ciphertexts (zufälliger IV)', () => {
    expect(encryptSecret(SECRET)).not.toBe(encryptSecret(SECRET));
  });

  it('entschlüsselt weiterhin Legacy-Klartext (Migrationsfall)', () => {
    expect(decryptSecret(SECRET)).toBe(SECRET);
  });

  it('manipuliertes Ciphertext wirft (GCM-Auth-Tag)', () => {
    const enc = encryptSecret(SECRET);
    const tampered = enc.slice(0, -4) + (enc.endsWith('A') ? 'B' : 'A') + '===';
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
