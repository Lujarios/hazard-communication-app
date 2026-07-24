/**
 * Short join codes for trainee assessment access.
 * Uppercase alphanumeric without ambiguous characters (0/O, 1/I/L).
 */
const JOIN_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const JOIN_CODE_LENGTH = 6;

const JOIN_CODE_PATTERN = new RegExp(
  `^[A-Z0-9]{${JOIN_CODE_LENGTH}}$`,
  "i",
);

export function normalizeJoinCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidJoinCodeFormat(code: string): boolean {
  return JOIN_CODE_PATTERN.test(normalizeJoinCode(code));
}

export function generateJoinCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(JOIN_CODE_LENGTH));
  let code = "";
  for (const byte of bytes) {
    code += JOIN_CODE_CHARSET[byte % JOIN_CODE_CHARSET.length];
  }
  return code;
}

export function joinPathForCode(code: string): string {
  return `/join/${normalizeJoinCode(code)}`;
}
