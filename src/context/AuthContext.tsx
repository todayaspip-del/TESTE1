import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';
import { User, Role, Organization } from '../types';
import { SEED_USERS, SEED_ORGANIZATION } from '../data/seedData';
import { hasPermission } from '../lib/rbac';
import { resolveRoleFromEmail } from '../lib/domainRoles';

interface AuthContextType {
  currentUser: User | null;
  organization: Organization;
  /** Only exposed for admin-facing student/user management screens — never for account switching. */
  usersList: User[];
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  register: (name: string, email: string, password: string) => { ok: true } | { ok: false; error: string };
  createStudentUser: (data: {
    name: string;
    email: string;
    password?: string;
    registrationNumber?: string;
    rank?: string;
    role?: Role;
  }) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  updateUserRole: (userId: string, newRole: Role) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  can: (action: string) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'vulcan_auth_current_user_id_v3';
const USERS_STORAGE_KEY = 'vulcan_auth_users_v3';
const FIRESTORE_USERS_DOC = 'lms_users_db';

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as User[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge any seed users that are not in parsed array
        const existingIds = new Set(parsed.map((u) => u.id));
        const missingSeeds = SEED_USERS.filter((s) => !existingIds.has(s.id));
        if (missingSeeds.length > 0) {
          const merged = [...parsed, ...missingSeeds];
          try {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return SEED_USERS;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usersList, setUsersList] = useState<User[]>(loadUsers);
  const [organization] = useState<Organization>(SEED_ORGANIZATION);

  // Firestore Real-Time Listener for registered users & accounts
  useEffect(() => {
    let isMounted = true;
    const docRef = doc(firestoreDb, 'system_data', FIRESTORE_USERS_DOC);

    // Initial check: if empty, seed with SEED_USERS
    getDoc(docRef).then((snap) => {
      if (!snap.exists()) {
        setDoc(docRef, { users: SEED_USERS, updatedAt: new Date().toISOString() });
      }
    }).catch(() => {});

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (!isMounted) return;
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data?.users) && data.users.length > 0) {
          setUsersList(data.users);
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(data.users));
        }
      }
    }, () => {
      // Fallback: fetch from /api/data
      fetch('/api/data')
        .then((res) => res.json())
        .then((json) => {
          if (json.ok && json.data && Array.isArray(json.data.users) && json.data.users.length > 0 && isMounted) {
            setUsersList(json.data.users);
          }
        })
        .catch(() => {});
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Only the currently authenticated user is ever held/exposed in session state.
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUserId) {
        const found = loadUsers().find((u) => u.id === savedUserId);
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const syncUsersToCloud = async (newUsers: User[]) => {
    try {
      const docRef = doc(firestoreDb, 'system_data', FIRESTORE_USERS_DOC);
      await setDoc(docRef, { users: newUsers, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: newUsers }),
      }).catch(() => {});
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList));
    } catch (e) {
      console.error(e);
    }
  }, [usersList]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, currentUser.id);
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [currentUser]);

  const login = (emailOrUsername: string, password: string): { ok: true } | { ok: false; error: string } => {
    const input = emailOrUsername.trim().toLowerCase();
    const existing = usersList.find(
      (u) =>
        u.email.toLowerCase() === input ||
        u.name.toLowerCase() === input ||
        (u.registrationNumber && u.registrationNumber.toLowerCase() === input)
    );

    if (!existing) {
      return { ok: false, error: 'Não encontramos uma conta com este e-mail ou usuário.' };
    }
    if (existing.password !== password) {
      return { ok: false, error: 'Senha incorreta. Verifique e tente novamente.' };
    }

    setCurrentUser(existing);
    return { ok: true };
  };

  const register = (name: string, email: string, password: string): { ok: true } | { ok: false; error: string } => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!name.trim()) {
      return { ok: false, error: 'Informe seu nome completo.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
    }
    if (usersList.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, error: 'Já existe uma conta com este e-mail. Faça login.' };
    }

    const role: Role | null = resolveRoleFromEmail(normalizedEmail);
    if (!role) {
      return {
        ok: false,
        error: 'Domínio de e-mail não autorizado para cadastro. Use um e-mail institucional válido.',
      };
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=ea580c`,
      organizationId: organization.id,
      rank: role === 'SUPER_ADMIN' ? 'Administrador Máximo' : role === 'INSTRUCTOR' ? 'Instrutor' : 'Aluno',
      createdAt: new Date().toISOString(),
    };

    const nextUsers = [...usersList, newUser];
    setUsersList(nextUsers);
    syncUsersToCloud(nextUsers);
    setCurrentUser(newUser);
    return { ok: true };
  };

  const createStudentUser = async (data: {
    name: string;
    email: string;
    password?: string;
    registrationNumber?: string;
    rank?: string;
    role?: Role;
  }): Promise<{ ok: true; user: User } | { ok: false; error: string }> => {
    const trimmedName = data.name.trim();
    const normalizedEmail = data.email.trim().toLowerCase();

    if (!trimmedName) {
      return { ok: false, error: 'Informe o nome completo do usuário.' };
    }
    if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      return { ok: false, error: 'Informe um endereço de e-mail válido.' };
    }
    if (usersList.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, error: 'Já existe um usuário cadastrado com este e-mail no sistema.' };
    }

    const assignedRole: Role = data.role || (resolveRoleFromEmail(normalizedEmail) === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT');
    const defaultPrefix = assignedRole === 'INSTRUCTOR' ? 'INST' : 'REC';
    const regNum =
      data.registrationNumber?.trim() || `${defaultPrefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const pass = data.password?.trim() || '123456';
    const defaultRank = assignedRole === 'INSTRUCTOR' ? 'Instrutor / Oficial' : 'Recruta / Aluno';

    const newUser: User = {
      id: `usr-${assignedRole === 'INSTRUCTOR' ? 'inst' : 'rec'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      email: normalizedEmail,
      password: pass,
      role: assignedRole,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}&backgroundColor=${
        assignedRole === 'INSTRUCTOR' ? '10b981' : 'ea580c'
      }`,
      organizationId: organization.id,
      registrationNumber: regNum,
      rank: data.rank?.trim() || defaultRank,
      createdAt: new Date().toISOString(),
    };

    const nextUsers = [...usersList, newUser];
    setUsersList(nextUsers);
    await syncUsersToCloud(nextUsers);
    return { ok: true, user: newUser };
  };

  const updateUserRole = async (userId: string, newRole: Role): Promise<{ ok: true } | { ok: false; error: string }> => {
    const target = usersList.find((u) => u.id === userId);
    if (!target) {
      return { ok: false, error: 'Usuário não encontrado.' };
    }

    const updatedUsers = usersList.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          role: newRole,
          rank:
            newRole === 'INSTRUCTOR' && (u.rank === 'Recruta / Aluno' || u.rank === 'Aluno')
              ? 'Instrutor / Oficial'
              : newRole === 'STUDENT' && (u.rank === 'Instrutor / Oficial' || u.rank === 'Instrutor')
              ? 'Recruta / Aluno'
              : u.rank,
        };
      }
      return u;
    });

    setUsersList(updatedUsers);
    await syncUsersToCloud(updatedUsers);

    // If current user is modified, update session state too
    if (currentUser?.id === userId) {
      const updatedSelf = updatedUsers.find((u) => u.id === userId);
      if (updatedSelf) setCurrentUser(updatedSelf);
    }

    return { ok: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const can = (action: string): boolean => {
    if (!currentUser) return false;
    return hasPermission(currentUser.role, action);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        organization,
        usersList,
        login,
        register,
        createStudentUser,
        updateUserRole,
        logout,
        can,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
