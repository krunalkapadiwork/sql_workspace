import crypto from 'crypto';

/**
 * Returns the SHA-256 hash of a string (used for invitation tokens and refresh tokens)
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generates a cryptographically secure random URL-safe base64 string
 */
export const generateRandomToken = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('base64url');
};

