'use client';

import { User } from '@/types/database';

export const DEFAULT_USER: User = {
  id: 'user-filius-demo',
  token: 'A8X29K',
  name: 'Filius Kristanto',
  age: 20,
  phone: '+62 812-3456-7890',
  email: 'filius.kristanto@faithhub.id',
  community_group: {
    name: 'CG Central Youth 30',
    leader: 'Daniel Kristianto',
    schedule: 'Jumat, 19.00',
    location: 'Jl. Kartini no 118, Surabaya',
  },
  role: 'leader',
  status: 'active',
  created_at: new Date().toISOString(),
};

const USER_STORAGE_KEY = 'faith_hub_user';
const REGISTERED_USERS_KEY = 'faith_hub_registered_users';

export interface RegisteredAccount {
  name: string;
  age?: number | string;
  phone: string;
  email: string;
  password: string;
  community_group?: {
    name: string;
    leader: string;
    schedule: string;
    location: string;
  };
}

export function getStoredUser(): User {
  if (typeof window === 'undefined') return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_USER,
        ...parsed,
        community_group: {
          ...DEFAULT_USER.community_group,
          ...(parsed.community_group || {}),
        },
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_USER;
}

export function setStoredUser(user: User) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    document.cookie = `faith_hub_token=${user.token}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (err) {
    console.error('Failed to save user session', err);
  }
}

export function clearStoredUser() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem('faith_hub_chat_scroll_top');
    document.cookie = 'faith_hub_token=; path=/; max-age=0; SameSite=Lax';
  } catch (err) {
    console.error('Failed to clear user session', err);
  }
}

export function getRegisteredUsers(): RegisteredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [
    {
      name: 'Filius Kristanto',
      age: 20,
      phone: '081234567890',
      email: 'filius.kristanto@faithhub.id',
      password: 'password123',
      community_group: DEFAULT_USER.community_group,
    },
  ];
}

export function saveRegisteredUser(account: RegisteredAccount) {
  if (typeof window === 'undefined') return;
  try {
    const list = getRegisteredUsers();
    const existingIndex = list.findIndex(
      (a: RegisteredAccount) =>
        a.email.toLowerCase() === account.email.toLowerCase() ||
        a.phone.replace(/\D/g, '') === account.phone.replace(/\D/g, '')
    );
    if (existingIndex >= 0) {
      list[existingIndex] = account;
    } else {
      list.push(account);
    }
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save registered account', err);
  }
}
