import { User } from '../types';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const SESSION_KEY = "gestor360_session_v2";

export function saveSession(user: User) {
  const sessionData: User = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
    // NO passwordHash stored here
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

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

/**
 * Revalidates the session against Firestore.
 * This is crucial to ensure the user still exists and role hasn't changed.
 */
export async function revalidateSession(): Promise<User | null> {
    const localUser = getSession();
    if (!localUser) return null;

    try {
        const userRef = doc(db, "users", localUser.id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            // Construct safe user object from DB fresh data
            const freshUser: User = {
                id: userData.id,
                username: userData.username,
                name: userData.name,
                role: userData.role,
                avatar: userData.avatar,
                createdAt: userData.createdAt,
                createdBy: userData.createdBy
            };
            // Update session storage with fresh data
            saveSession(freshUser);
            return freshUser;
        } else {
            // User deleted from DB? Kill session.
            clearSession();
            return null;
        }
    } catch (e) {
        console.error("Session revalidation error", e);
        // If DB unreachable, assume local is valid (offline mode or temp failure)
        // But for security, if it's a permission error, we should logout.
        // For now, allow continued use if cached, but log warning.
        // Ideally, implement robust offline logic.
        // Returning localUser is safer for UX in flaky networks, but less secure if user was banned.
        // Given it's a personal/team tool, UX priority:
        return localUser; 
    }
}