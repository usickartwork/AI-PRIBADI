export type UserRole = 'member' | 'leader' | 'admin';
export type PrayerStatus = 'praying' | 'waiting' | 'answered';
export type PrayerCategory = 'Family' | 'Study' | 'Work' | 'Future' | 'Relationship' | 'Personal';
export type PrayerVisibility = 'public' | 'anonymous' | 'private';

export interface User {
  id: string;
  token: string;
  name: string;
  age?: number | string;
  phone?: string;
  email?: string;
  community_group?: {
    name: string;
    leader: string;
    schedule: string;
    location: string;
  };
  avatar_url?: string | null;
  role: UserRole;
  status: string;
  created_at: string;
}

export interface Prayer {
  id: string;
  user_id: string;
  content: string;
  category: PrayerCategory;
  status: PrayerStatus;
  answered_at?: string | null;
  created_at: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  verse_reference: string;
  question?: string | null;
  content: string;
  created_at: string;
}

export interface Gratitude {
  id: string;
  user_id: string;
  content: string;
  category?: string | null;
  created_at: string;
}

export interface PrayerRequest {
  id: string;
  user_id: string;
  content: string;
  visibility: PrayerVisibility;
  prayer_count: number;
  status: string;
  created_at: string;
  user?: {
    name: string;
    avatar_url?: string | null;
  };
  has_prayed?: boolean;
}

export interface CGEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "19:00 WIB"
  location: string;
  maps_url?: string | null;
  description?: string | null;
  notes?: string | null;
  status: string;
  created_at: string;
}

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  totalDays: number;
  days: {
    day: number;
    passage: string;
    description: string;
  }[];
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  plan_id: string;
  day: number;
  completed: boolean;
  completed_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}
