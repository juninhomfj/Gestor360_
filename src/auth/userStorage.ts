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

export const createUser = async (
  adminId: string,
  email: string,
  plainPassword: string,
  name: string,
  role: UserRole = "USER"
): Promise<{ success: boolean; message: string }> => {
  try {
    // Check duplication
    const q = query(
      collection(db, USERS_COLLECTION),
      where("username", "==", email.toLowerCase())
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      return { success: false, message: "Este e-mail já está cadastrado." };
    }

    const passwordHash = await hashPassword(plainPassword);
    const uid = crypto.randomUUID();

    const userDoc = {
      id: uid,
      username: email.toLowerCase(),
      name,
      role,
      passwordHash,
      createdAt: new Date().toISOString(),
      createdBy: adminId
    };

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

    if (snap.empty) return null;

    const userData = snap.docs[0].data();
    
    // Check password
    const isValid = await verifyPassword(plainPassword, userData.passwordHash);
    if (!isValid) return null;

    const safeUser: User = {
      id: userData.id,
      username: userData.username,
      name: userData.name,
      role: userData.role,
      avatar: userData.avatar,
      createdAt: userData.createdAt,
      createdBy: userData.createdBy,
    };

    saveSession(safeUser);
    return safeUser;
  } catch (err) {
    console.error("Login error:", err);
    return null;
  }
};

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
    return { success: false, message: err?.message || "Erro ao alterar senha." };
  }
};

export const updateUserProfile = async (
    userId: string, 
    updates: { name?: string, avatar?: string }
): Promise<boolean> => {
    try {
        const ref = doc(db, USERS_COLLECTION, userId);
        await updateDoc(ref, updates);
        return true;
    } catch {
        return false;
    }
}

export const listAllUsers = async (): Promise<User[]> => {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    return snap.docs.map(d => {
      const data = d.data();
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

export const removeUser = async (userId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
    return true;
  } catch {
    return false;
  }
};