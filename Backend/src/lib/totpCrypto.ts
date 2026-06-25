// ═══════════════════════════════════════════════════════════════════════════
// TOTP-Secret-Verschlüsselung (at-rest)
//
// 2FA-Secrets lagen zuvor im Klartext in admin_totp / mod_totp. Wer DB- bzw.
// Service-Key-Zugriff (oder einen Backup-Dump) hatte, konnte die 2FA klonen.
// Hier: AES-256-GCM mit einem aus TOTP_ENC_KEY abgeleiteten Schlüssel.
//
// RÜCKWÄRTSKOMPATIBEL — kein Breakage beim Deploy:
//   • Ohne gesetztes TOTP_ENC_KEY wird unverändert Klartext gespeichert/gelesen.
//   • Bereits gespeicherte Klartext-Secrets werden beim Lesen unverändert
//     durchgereicht (decryptSecret erkennt fehlendes Präfix).
//   • Sobald der Key gesetzt ist, werden NEUE Secrets verschlüsselt; alte können
//     per Lazy-Migration beim nächsten erfolgreichen Login re-verschlüsselt werden.
// ═══════════════════════════════════════════════════════════════════════════

import crypto from 'crypto';

const PREFIX = 'enc:v1:';

/** Leitet aus TOTP_ENC_KEY einen 32-Byte-Schlüssel ab (akzeptiert beliebige Länge). */
function getKey(): Buffer | null {
  const raw = process.env.TOTP_ENC_KEY;
  if (!raw) return null;
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

/** True, wenn ein TOTP_ENC_KEY gesetzt ist (Verschlüsselung aktiv). */
export function encryptionEnabled(): boolean {
  return Boolean(process.env.TOTP_ENC_KEY);
}

/** True, wenn der gespeicherte Wert noch unverschlüsselter Klartext ist. */
export function isPlaintext(stored: string): boolean {
  return !stored.startsWith(PREFIX);
}

/** Verschlüsselt ein TOTP-Secret. Ohne Key → Klartext zurück (rückwärtskompatibel). */
export function encryptSecret(plain: string): string {
  const key = getKey();
  if (!key) return plain;
  const iv     = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc    = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
}

/** Entschlüsselt ein TOTP-Secret. Legacy-Klartext (ohne Präfix) wird durchgereicht. */
export function decryptSecret(stored: string): string {
  if (isPlaintext(stored)) return stored;
  const key = getKey();
  if (!key) throw new Error('TOTP_ENC_KEY fehlt — verschlüsseltes 2FA-Secret nicht lesbar.');
  const raw = Buffer.from(stored.slice(PREFIX.length), 'base64');
  const iv  = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const enc = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
