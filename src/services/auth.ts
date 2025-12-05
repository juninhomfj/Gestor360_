// ARQUIVO DEPRECADO / LEGADO
// Mantido vazio ou com redirecionamento para evitar erros de importação antigos
// A nova lógica está em src/auth/userStorage.ts e src/auth/session.ts

import { User } from '../types';
import { getSession as getSess, clearSession as clearSess } from '../auth/session';

export const getSession = getSess;
export const logout = clearSess;

// Placeholder para compatibilidade se algum arquivo antigo ainda importar daqui
export const login = async (u: string, p: string) => null;
export const listUsers = () => [];