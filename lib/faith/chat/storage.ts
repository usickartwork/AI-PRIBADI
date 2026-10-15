'use client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  status?: 'sending' | 'streaming' | 'complete' | 'error';
  imageUrl?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

const STORAGE_KEY = 'faith_hub_conversations';
const ACTIVE_CONV_KEY = 'faith_hub_active_conv_id';

export function generateTitleFromMessage(content: string): string {
  const cleaned = content.replace(/[#*`>]/g, '').trim();
  if (!cleaned) return 'Percakapan Rohani';
  const words = cleaned.split(/\s+/).slice(0, 6).join(' ');
  return words.length > 38 ? words.slice(0, 38) + '...' : words;
}

export function getStoredConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load conversations', err);
  }
  return [];
}

export function saveConversations(convs: Conversation[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  } catch (err) {
    console.error('Failed to save conversations', err);
  }
}

export function getActiveConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_CONV_KEY);
}

export function setActiveConversationId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_CONV_KEY, id);
}

export function createNewConversation(): Conversation {
  const id = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  return {
    id,
    title: 'Saat Teduh Baru',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}
