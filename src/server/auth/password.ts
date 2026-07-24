import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Format: `saltHex:hashHex` using scrypt (local/dev Credentials login only). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): boolean {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) {
    return false;
  }

  const stored = Buffer.from(storedHash, "hex");
  const supplied = scryptSync(password, salt, 64);

  if (stored.length !== supplied.length) {
    return false;
  }

  return timingSafeEqual(stored, supplied);
}
