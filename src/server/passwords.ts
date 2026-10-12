import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password: unknown, stored: string): boolean {
  if (typeof password !== 'string') return false;
  if (!stored.startsWith('scrypt$')) return password === stored;
  const [, salt, digest] = stored.split('$');
  try {
    const expected = Buffer.from(digest, 'hex');
    const actual = scryptSync(password, salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch { return false; }
}
