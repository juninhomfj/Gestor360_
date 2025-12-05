import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../services/firebase";
import { User, UserRole } from "../types";
import { hashPassword, verifyPassword } from "./cryptoAuth";
import { saveSession } from "./session";

const USERS_COLLECTION = "users";

/**
 * Creates a new user in Firestore with a securely hashed password.
 * @returns An object indicating success or failure with a message.
 */
export const createUser = async (
  adminId: string,
  email: string,
  plainPassword: string,
  name: string,
  role: UserRole = "USER"
): Promise<{ success: boolean; message: string }> => {
  try {
    // Check if user already exists
    const q = query(
      collection(db, USERS_COLLECTION),
      where("username", "==", email.toLowerCase())
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      return { success: false, message: "Este e-mail já está cadastrado." };
    }

    // Hash the password before storing
    const passwordHash = await hashPassword(plainPassword);
    const uid = crypto.randomUUID(); // Generate a unique ID for the document

    const userDoc = {
      id: uid, // Store the ID within the document for easy access
      username: email.toLowerCase(),
      name,
      role,
      passwordHash,
      createdAt: new Date().toISOString(),
      createdBy: adminId
    };

    // Use the generated UID as the document ID in Firestore
    await setDoc(doc(db, USERS_COLLECTION, uid), userDoc);

    return { success: true, message: "Usuário criado com sucesso." };
  } catch (err: any) {
    console.error("Error creating user:", err);
    return {
      success: false,
      message: err?.message || "Erro desconhecido ao criar usuário."
    };
  }
};

/**
 * Authenticates a user against Firestore.
 * @returns The user object if successful, or null.
 */
export const loginUser = async (
  email: string,
  plainPassword: string
): Promise<User | null> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("username", "==", email.toLowerCase())
    );
    const snap = await getDocs(q);

    if (snap.empty) return null; // User not found

    const userData = snap.docs[0].data();
    
    // Securely verify password
    const isValid = await verifyPassword(plainPassword, userData.passwordHash);
    if (!isValid) return null; // Invalid password

    // Prepare a safe user object for the session (without the hash)
    const safeUser: User = {
      id: userData.id,
      username: userData.username,
      name: userData.name,
      role: userData.role,
      avatar: userData.avatar,
      createdAt: userData.createdAt,
      createdBy: userData.createdBy,
    };

    // Save the safe user object to the session
    saveSession(safeUser);

    return safeUser;
  } catch (err) {
    console.error("Login error:", err);
    return null;
  }
};

/**
 * Changes a user's password in Firestore.
 */
export const changeUserPassword = async (
  userId: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const newHash = await hashPassword(newPassword);
    const ref = doc(db, USERS_COLLECTION, userId);

    await updateDoc(ref, { passwordHash: newHash });

    return { success: true, message: "Senha alterada com sucesso." };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Erro ao alterar senha."
    };
  }
};

/**
 * Lists all users from Firestore (for Admin panel).
 * @returns An array of user objects without password hashes.
 */
export const listAllUsers = async (): Promise<User[]> => {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));

    return snap.docs.map(d => {
      const data = d.data();
      // Never return the password hash to the frontend list
      return {
        id: data.id,
        username: data.username,
        name: data.name,
        role: data.role,
        avatar: data.avatar,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
      } as User;
    });
  } catch {
    return [];
  }
};

/**
 * Removes a user from Firestore.
 */
export const removeUser = async (userId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
    return true;
  } catch {
    return false;
  }
};