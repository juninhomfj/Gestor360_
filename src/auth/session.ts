import { User } from '../types';

const SESSION_KEY = "gestor360_session_v2";

/**
 * Saves the user session to sessionStorage.
 */
export function saveSession(user: User) {
  const sessionData: User = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
    // Ensure no sensitive data like passwordHash is stored
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

/**
 * Clears the user session.
 */
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Retrieves the current session.
 */
export function getSession(): User | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.id) return null;
    return parsed as User;
  } catch {
    clearSession();
    return null;
  }
}