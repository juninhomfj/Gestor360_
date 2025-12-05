import bcrypt from 'bcryptjs';

/**
 * Configuration for bcrypt
 * 10 rounds is the industry standard balance between security and performance
 */
const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password using bcrypt with salt.
 * @param plainPassword The user's input password
 * @returns Promise<string> The resulting hash
 */
export const hashPassword = async (plainPassword: string): Promise<string> => {
  // genSalt is asynchronous, making the entire function async
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainPassword, salt);
};

/**
 * Verifies a plain password against a stored hash.
 * @param plainPassword The user's input password
 * @param hashedPassword The hash stored in Firestore
 * @returns Promise<boolean> True if matches
 */
export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  // compare is a secure, built-in function to prevent timing attacks
  return bcrypt.compare(plainPassword, hashedPassword);
};