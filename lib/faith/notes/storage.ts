'use client';

import { Note } from '@/types/database';
import { isSupabaseConfigured, supabase } from '@/lib/faith/supabase/client';

const STORAGE_PREFIX = 'faith_hub_notes_';

/**
 * Returns storage key scoped strictly to the authenticated user ID.
 */
function getUserStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/**
 * Fetches notes for a specific user.
 * Strategy: Offline-first with immediate local cache return, then background/direct Supabase sync.
 */
export async function getNotes(userId: string): Promise<Note[]> {
  if (typeof window === 'undefined' || !userId) return [];

  // 1. Load local cache
  let localNotes: Note[] = [];
  try {
    const raw = localStorage.getItem(getUserStorageKey(userId));
    if (raw) {
      localNotes = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse local notes', err);
  }

  // 2. If Supabase is available, sync and merge
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        const cloudNotes: Note[] = data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          title: item.title || '',
          content: item.content || '',
          pinned: Boolean(item.pinned),
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));

        // Merge: keep newest version of each note
        const noteMap = new Map<string, Note>();
        for (const n of cloudNotes) {
          noteMap.set(n.id, n);
        }
        for (const n of localNotes) {
          if (!noteMap.has(n.id)) {
            noteMap.set(n.id, n);
          } else {
            const existing = noteMap.get(n.id)!;
            if (new Date(n.updated_at) > new Date(existing.updated_at)) {
              noteMap.set(n.id, n);
            }
          }
        }

        const merged = Array.from(noteMap.values()).sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );

        // Update local cache
        localStorage.setItem(getUserStorageKey(userId), JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('Supabase notes fetch error, falling back to local store', err);
    }
  }

  return localNotes;
}

/**
 * Saves or updates a note both locally and to Supabase.
 */
export async function saveNote(note: Note): Promise<Note> {
  const updatedNote: Note = {
    ...note,
    updated_at: new Date().toISOString(),
  };

  // 1. Update local cache immediately
  if (typeof window !== 'undefined' && note.user_id) {
    try {
      const raw = localStorage.getItem(getUserStorageKey(note.user_id));
      const currentList: Note[] = raw ? JSON.parse(raw) : [];
      const index = currentList.findIndex((n) => n.id === updatedNote.id);

      let nextList: Note[];
      if (index >= 0) {
        nextList = [...currentList];
        nextList[index] = updatedNote;
      } else {
        nextList = [updatedNote, ...currentList];
      }

      // Sort with pinned first, then by updated_at descending
      nextList.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      localStorage.setItem(getUserStorageKey(note.user_id), JSON.stringify(nextList));
    } catch (err) {
      console.warn('Failed to save note locally', err);
    }
  }

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('notes').upsert({
        id: updatedNote.id,
        user_id: updatedNote.user_id,
        title: updatedNote.title,
        content: updatedNote.content,
        pinned: updatedNote.pinned,
        created_at: updatedNote.created_at,
        updated_at: updatedNote.updated_at,
      });
    } catch (err) {
      console.warn('Failed to sync note to Supabase (saved locally)', err);
    }
  }

  return updatedNote;
}

/**
 * Deletes a note permanently.
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  // 1. Remove from local cache
  if (typeof window !== 'undefined' && userId) {
    try {
      const raw = localStorage.getItem(getUserStorageKey(userId));
      if (raw) {
        const currentList: Note[] = JSON.parse(raw);
        const filtered = currentList.filter((n) => n.id !== noteId);
        localStorage.setItem(getUserStorageKey(userId), JSON.stringify(filtered));
      }
    } catch (err) {
      console.warn('Failed to delete note locally', err);
    }
  }

  // 2. Delete from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Failed to delete note in Supabase', err);
    }
  }
}

/**
 * Creates a brand new empty note for a given user.
 */
export function createBlankNote(userId: string): Note {
  const now = new Date().toISOString();
  return {
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    title: '',
    content: '',
    pinned: false,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Formats note date in Apple iOS Notes style:
 * - Today: "10:15"
 * - Yesterday: "Kemarin"
 * - This week / month: "28 Sep"
 * - Previous year: "28/09/2025"
 */
export function formatNoteDate(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Kemarin';
    }

    const sameYear = d.getFullYear() === now.getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    if (sameYear) {
      return `${d.getDate()} ${months[d.getMonth()]}`;
    }

    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return '';
  }
}

/**
 * Full date header displayed inside the note editor (e.g. "30 September 2026 pukul 10:15").
 */
export function formatFullNoteDate(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} pukul ${h}:${m}`;
  } catch {
    return '';
  }
}
