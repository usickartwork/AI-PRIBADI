'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/app/components/faith/Header';
import Navigation from '@/app/components/faith/Navigation';
import EntranceAnimation from '@/app/components/faith/EntranceAnimation';
import { getStoredUser, DEFAULT_USER } from '@/lib/faith/session';
import { User } from '@/types/database';
import { MarkdownRenderer } from '@/app/components/faith/MarkdownRenderer';
import {
  Message,
  Conversation,
  getStoredConversations,
  saveConversations,
  getActiveConversationId,
  setActiveConversationId,
  createNewConversation,
  generateTitleFromMessage,
} from '@/lib/faith/chat/storage';
import {
  Square,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ArrowUp,
  Camera,
} from 'lucide-react';

const FAITH_STARTERS = [
  {
    tag: 'Keintiman Rohani',
    title: 'Membangun Hubungan dengan Allah',
    prompt: 'Bagaimana cara praktis membangun hubungan yang intim dan konsisten dengan Tuhan di tengah kesibukan sehari-hari?',
  },
  {
    tag: 'Ketenangan Batin',
    title: 'Saat Iman Terasa Kering',
    prompt: 'Akhir-akhir ini hatiku terasa sangat hampa dan doa rasanya hanya kata-kata kosong. Bagaimana aku harus menyikapi musim ini?',
  },
  {
    tag: 'Doa Penyerahan',
    title: 'Menyerahkan Kecemasan',
    prompt: 'Pikiranku sedang sangat cemas tentang masa depan dan keputusan hidup. Ajarkan aku cara benar-benar berserah kepada-Nya.',
  },
  {
    tag: 'Mencari Hikmat',
    title: 'Mengenali Kehendak Tuhan',
    prompt: 'Bagaimana aku bisa mengenali apakah langkah yang kuambil adalah kehendak Tuhan atau hanya keinginanku sendiri?',
  },
];

const SCROLL_POS_KEY = 'faith_hub_chat_scroll_top';

function formatTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
}

/**
 * Compresses camera image in-memory via HTML5 canvas (zero disk/database footprint).
 */
function compressImageClient(file: File, maxDimension = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Strips distracting quotation format wrapping ("...", “...”) that LLMs or offline templates
 * sometimes output, while preserving natural internal punctuation.
 */
function cleanQuotes(text: string): string {
  if (!text) return '';
  let s = text.trim();

  // Strip wrapping outer double quotes or typographical curly quotes
  if (
    (s.startsWith('"') && s.endsWith('"') && s.length > 1) ||
    (s.startsWith('“') && s.endsWith('”') && s.length > 1) ||
    (s.startsWith('«') && s.endsWith('»') && s.length > 1)
  ) {
    s = s.slice(1, -1).trim();
  }

  // Strip quotes wrapping markdown blockquotes (> "Ayat" -> > Ayat)
  s = s.replace(/^>\s*["“”](.*?)["“”]\s*$/gm, '> $1');

  // Strip stray standalone double quotes that wrap paragraphs or headings
  s = s.replace(/(^|\n)["“”]([^\n]+)["“”](\n|$)/g, '$1$2$3');

  // Strip all double quotes
  s = s.replace(/["“”]/g, '');

  return s;
}

/**
 * Splits assistant message into separate breathable bubbles by double newlines (\n\n+),
 * preserving markdown code blocks.
 */
function splitIntoBubbles(text: string): string[] {
  if (!text) return [];

  const lines = text.split('\n');
  const bubbles: string[] = [];
  let currentChunk: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    if (!inCodeBlock && line.trim() === '' && currentChunk.length > 0) {
      const joined = cleanQuotes(currentChunk.join('\n').trim());
      if (joined) {
        bubbles.push(joined);
      }
      currentChunk = [];
    } else {
      currentChunk.push(line);
    }
  }

  if (currentChunk.length > 0) {
    const joined = cleanQuotes(currentChunk.join('\n').trim());
    if (joined) {
      bubbles.push(joined);
    }
  }

  return bubbles.length > 0 ? bubbles : [cleanQuotes(text)];
}

let hasShownAppIntro = false;
let lastSavedChatScroll: string | null = null;

export default function FaithHubHomePage() {
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (hasShownAppIntro) return false;
    try {
      return !sessionStorage.getItem('faith_hub_intro_seen');
    } catch {
      return false;
    }
  });

  const handleIntroComplete = useCallback(() => {
    hasShownAppIntro = true;
    try {
      sessionStorage.setItem('faith_hub_intro_seen', 'true');
    } catch {}
    setShowIntro(false);
  }, []);

  // Auto-scroll states
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const isAutoScrollActiveRef = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const hasRestoredScrollRef = useRef(false);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Initial load: check auth, restore conversations & save scroll position on unmount/tab switch
  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser || DEFAULT_USER);
    setIsAuthenticated(true);
    setIsMounted(true);
    const stored = getStoredConversations();

    if (stored.length > 0) {
      setConversations(stored);
      const activeId = getActiveConversationId() || stored[0].id;
      const current = stored.find((c) => c.id === activeId) || stored[0];
      setActiveConvId(current.id);
      setMessages(current.messages || []);
    } else {
      const initial = createNewConversation();
      setConversations([initial]);
      setActiveConvId(initial.id);
      setMessages([]);
    }

    return () => {
      // Snapshot exact scroll position on unmount (e.g. switching tabs)
      const container = chatScrollContainerRef.current;
      if (container && container.scrollHeight > container.clientHeight && hasRestoredScrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
        const valToSave = distanceFromBottom < 30 ? 'bottom' : String(scrollTop);
        lastSavedChatScroll = valToSave;
        try {
          sessionStorage.setItem(SCROLL_POS_KEY, valToSave);
        } catch {}
      }
    };
  }, []);

  // Restore exact last view / scroll position once messages are rendered
  useEffect(() => {
    if (!isMounted || messages.length === 0 || hasRestoredScrollRef.current) return;

    const restore = () => {
      const container = chatScrollContainerRef.current;
      if (!container) return false;
      if (container.scrollHeight <= container.clientHeight && messages.length > 2) {
        return false;
      }

      let saved: string | null = null;
      try {
        saved = sessionStorage.getItem(SCROLL_POS_KEY);
      } catch {}
      if (!saved && lastSavedChatScroll !== null) {
        saved = lastSavedChatScroll;
      }

      if (saved === 'bottom' || saved === null) {
        container.scrollTop = container.scrollHeight;
      } else {
        const num = Number(saved);
        if (!isNaN(num)) {
          container.scrollTop = num;
        } else {
          container.scrollTop = container.scrollHeight;
        }
      }
      hasRestoredScrollRef.current = true;
      return true;
    };

    if (restore()) return;

    let rafId2: number | null = null;
    const rafId1 = requestAnimationFrame(() => {
      if (!restore()) {
        rafId2 = requestAnimationFrame(() => {
          restore();
        });
      }
    });

    const timer = setTimeout(() => {
      restore();
    }, 60);

    return () => {
      cancelAnimationFrame(rafId1);
      if (rafId2) cancelAnimationFrame(rafId2);
      clearTimeout(timer);
    };
  }, [isMounted, messages]);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(Math.max(el.scrollHeight, 38), 120);
    el.style.height = `${nextHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputPrompt, adjustTextareaHeight]);

  const scrollToBottom = useCallback((smooth = true) => {
    isAutoScrollActiveRef.current = true;
    setShowScrollBottomBtn(false);

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    } else if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = chatScrollContainerRef.current;
    if (!container) return;

    // Do not record premature scroll events before restoration has finished
    if (!hasRestoredScrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // Persist scroll position across tab switches
    if (scrollHeight > clientHeight) {
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      const isAtBottom = distanceFromBottom < 30;
      const valToSave = isAtBottom ? 'bottom' : String(scrollTop);
      lastSavedChatScroll = valToSave;
      try {
        sessionStorage.setItem(SCROLL_POS_KEY, valToSave);
      } catch {}

      // If user scrolled up by more than 70px, pause auto-scroll
      if (distanceFromBottom > 70) {
        isAutoScrollActiveRef.current = false;
        // Hanya tampilkan tombol jika memang sedang ada tanggapan baru yang masuk/dihasilkan
        if (isGenerating) {
          setShowScrollBottomBtn(true);
        }
      } else {
        isAutoScrollActiveRef.current = true;
        setShowScrollBottomBtn(false);
      }
    }
  }, [isGenerating]);

  // Real-time slide-down follower ONLY while streaming text (never on tab switch or mount!)
  useEffect(() => {
    if (!isGenerating || !isAutoScrollActiveRef.current) return;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      if (messagesEndRef.current && isAutoScrollActiveRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      }
    });

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [messages, isGenerating]);

  const syncConversationMessages = useCallback(
    (newMessages: Message[], convId: string) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === convId) {
            let title = conv.title;
            if (conv.title === 'Saat Teduh Baru') {
              const firstUserMsg = newMessages.find((m) => m.role === 'user');
              if (firstUserMsg) {
                title = generateTitleFromMessage(firstUserMsg.content);
              }
            }
            // Strip temporary imageUrl so image data is strictly ephemeral and never stored in database/localStorage
            const messagesToSave = newMessages.map(({ imageUrl, ...rest }) => rest);
            return {
              ...conv,
              title,
              messages: messagesToSave,
              updatedAt: new Date().toISOString(),
            };
          }
          return conv;
        });
        saveConversations(updated);
        return updated;
      });
    },
    []
  );

  function handleStartNewChat() {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const newConv = createNewConversation();
    const updated = [newConv, ...conversations];
    setConversations(updated);
    setActiveConvId(newConv.id);
    setActiveConversationId(newConv.id);
    setMessages([]);
    setInputPrompt('');
    isAutoScrollActiveRef.current = true;
    lastSavedChatScroll = null;
    hasRestoredScrollRef.current = true;
    try {
      sessionStorage.removeItem(SCROLL_POS_KEY);
    } catch {}
  }

  function handleSelectConversation(conv: Conversation) {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setActiveConvId(conv.id);
    setActiveConversationId(conv.id);
    setMessages(conv.messages || []);
    isAutoScrollActiveRef.current = true;
    lastSavedChatScroll = 'bottom';
    hasRestoredScrollRef.current = false;
    try {
      sessionStorage.removeItem(SCROLL_POS_KEY);
    } catch {}
    setTimeout(() => scrollToBottom(false), 50);
  }

  function handleDeleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const filtered = conversations.filter((c) => c.id !== id);
    if (filtered.length === 0) {
      const fresh = createNewConversation();
      setConversations([fresh]);
      setActiveConvId(fresh.id);
      setActiveConversationId(fresh.id);
      setMessages([]);
      saveConversations([fresh]);
    } else {
      setConversations(filtered);
      saveConversations(filtered);
      if (activeConvId === id) {
        setActiveConvId(filtered[0].id);
        setActiveConversationId(filtered[0].id);
        setMessages(filtered[0].messages || []);
      }
    }
  }

  async function handleSend(overridePrompt?: string) {
    const textToSend = (overridePrompt ?? inputPrompt).trim();
    if (!textToSend || isGenerating) return;

    setInputPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '38px';
    }

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
      status: 'complete',
    };

    const updatedWithUser = [...messages, userMessage];
    setMessages(updatedWithUser);
    syncConversationMessages(updatedWithUser, activeConvId);

    const assistantMessageId = `msg_ai_${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      status: 'streaming',
    };

    const updatedWithPlaceholder = [...updatedWithUser, assistantMessage];
    setMessages(updatedWithPlaceholder);
    setIsGenerating(true);
    isAutoScrollActiveRef.current = true;
    scrollToBottom(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const payloadMessages = updatedWithUser.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/faith/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let rawIncomingText = '';
      let streamDone = false;
      let streamError: Error | null = null;

      // Background task reading network stream continuously into rawIncomingText
      const readNetworkStream = async () => {
        try {
          while (true) {
            if (controller.signal.aborted) break;
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (chunk) {
              rawIncomingText += chunk;
            }
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            streamError = err instanceof Error ? err : new Error(String(err));
          }
        } finally {
          streamDone = true;
        }
      };

      const networkPromise = readNetworkStream();

      // Pacing consumer loop: smooth, visible typing animation
      let displayedContent = '';
      let cursorIndex = 0;

      while (true) {
        if (controller.signal.aborted) break;

        if (cursorIndex < rawIncomingText.length) {
          const remainingText = rawIncomingText.slice(cursorIndex);
          // Match next token: word with trailing whitespace (\S+\s*) or standalone whitespace (\s+)
          const match = remainingText.match(/^(\S+\s*|\s+)/);
          const nextChunk = match ? match[0] : remainingText.slice(0, 1);

          cursorIndex += nextChunk.length;
          displayedContent += nextChunk;

          const displayCleaned = cleanQuotes(displayedContent);

          setMessages((current) =>
            current.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: displayCleaned, status: 'streaming' }
                : msg
            )
          );

          // Pacing delay: visible, rhythmic typing so words don't appear in sudden blocks
          const unrevealedRemaining = rawIncomingText.length - cursorIndex;
          let delay = 40; // Default ~40ms per word: visible, elegant, human-like
          if (unrevealedRemaining > 250) {
            delay = 24;
          } else if (unrevealedRemaining > 80) {
            delay = 32;
          }

          await new Promise((r) => setTimeout(r, delay));
        } else {
          if (streamDone) break;
          // Wait briefly for next network packet
          await new Promise((r) => setTimeout(r, 20));
        }
      }

      await networkPromise;

      if (streamError && !controller.signal.aborted) {
        throw streamError;
      }

      const finalContent = cleanQuotes(displayedContent);
      setMessages((current) => {
        const finished = current.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: finalContent, status: 'complete' as const }
            : msg
        );
        syncConversationMessages(finished, activeConvId);
        return finished;
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages((current) => {
          const finished = current.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, status: 'complete' as const } : msg
          );
          syncConversationMessages(finished, activeConvId);
          return finished;
        });
      } else {
        console.error('Streaming failure:', err);
        setMessages((current) => {
          const withErr = current.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    msg.content ||
                    'Terjadi kendala jaringan sementara pada saat teduh ini. Silakan ulangi tanggapan.',
                  status: 'error' as const,
                }
              : msg
          );
          syncConversationMessages(withErr, activeConvId);
          return withErr;
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }

  function handleStopGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  function handleRegenerate() {
    if (isGenerating || messages.length === 0) return;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      handleSend(lastUser.content);
    }
  }

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isGenerating) return;

    // Reset input value so user can take another photo later
    e.target.value = '';

    try {
      // 1. Read & compress image in-memory via Canvas (instant, lightweight < 200KB)
      const base64Image = await compressImageClient(file, 1000, 0.82);

      // 2. Add user message in chat with temporary visual thumbnail during active session
      const userMessageId = `msg_user_${Date.now()}`;
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        content: inputPrompt.trim()
          ? `📷 [Foto Langsung] ${inputPrompt.trim()}`
          : '📷 [Foto Langsung — Mohon simpulkan isi dan maknanya]',
        imageUrl: base64Image, // In-memory ephemeral preview
        createdAt: new Date().toISOString(),
        status: 'complete',
      };

      const updatedWithUser = [...messages, userMessage];
      setMessages(updatedWithUser);
      // Strip imageUrl when persisting so photo is NEVER stored in database/localStorage!
      syncConversationMessages(
        updatedWithUser.map(({ imageUrl, ...m }) => m),
        activeConvId
      );

      // 3. Add assistant placeholder in chat
      const assistantMessageId = `msg_ai_${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        status: 'streaming',
      };

      setMessages([...updatedWithUser, assistantMessage]);
      setIsGenerating(true);
      isAutoScrollActiveRef.current = true;
      scrollToBottom(true);

      const promptToSend = inputPrompt.trim();
      if (promptToSend) {
        setInputPrompt('');
      }

      // 4. Send directly to Vision endpoint in-memory (zero database storage)
      const res = await fetch('/api/ai/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          prompt: promptToSend || undefined,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        data = { error: 'Gagal memproses tanggapan dari server.' };
      }

      if (!res.ok && !data.summary) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const summaryText = data.summary || data.error || 'Tidak dapat membaca isi foto.';

      // 5. Pace the streaming / typing output smoothly so it flows naturally
      let cursorIndex = 0;
      let accumulated = '';

      while (cursorIndex < summaryText.length) {
        const remainingText = summaryText.slice(cursorIndex);
        const match = remainingText.match(/^(\S+\s*|\s+)/);
        const nextChunk = match ? match[0] : remainingText.slice(0, 1);

        cursorIndex += nextChunk.length;
        accumulated += nextChunk;

        const display = cleanQuotes(accumulated);
        setMessages((current) =>
          current.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: display, status: 'streaming' }
              : msg
          )
        );

        const unrevealedRemaining = summaryText.length - cursorIndex;
        let delay = 38;
        if (unrevealedRemaining > 250) {
          delay = 24;
        } else if (unrevealedRemaining > 80) {
          delay = 30;
        }

        await new Promise((r) => setTimeout(r, delay));
      }

      setMessages((current) => {
        const finished = current.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: cleanQuotes(accumulated), status: 'complete' as const }
            : msg
        );
        syncConversationMessages(
          finished.map(({ imageUrl, ...m }) => m),
          activeConvId
        );
        return finished;
      });
    } catch (err: any) {
      console.error('Camera vision error:', err);
      setMessages((current) => {
        const withErr = current.map((msg) =>
          msg.role === 'assistant' && msg.status === 'streaming'
            ? {
                ...msg,
                content:
                  'Terjadi kendala saat menganalisis foto. Pastikan koneksi internet stabil dan coba ambil foto kembali.',
                status: 'error' as const,
              }
            : msg
        );
        syncConversationMessages(
          withErr.map(({ imageUrl, ...m }) => m),
          activeConvId
        );
        return withErr;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  }

  if (!isAuthenticated) {
    return <div className="h-full w-full bg-transparent" />;
  }

  return (
    <div className="h-full w-full bg-transparent flex flex-col items-center justify-center overflow-hidden">
      {/* Precision Studio Shell: Full screen on mobile, bright light container matching Alkitab */}
      <div
        className={`w-full max-w-4xl h-full bg-white dark:bg-[#121215] rounded-none sm:rounded-[36px] sm:border border-[#EAEAEB] dark:border-[#222226] sm:shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:sm:shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden relative transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showIntro ? 'scale-[0.985] opacity-90 translate-y-1' : 'scale-100 opacity-100 translate-y-0'
        }`}
      >
        {/* Top Header with Brand & New Chat (+) */}
        <Header
          user={user}
          onNewChat={handleStartNewChat}
        />

        {/* Middle Scrollable Chat / Content Area */}
        <main
          ref={chatScrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto px-3.5 sm:px-6 py-4 space-y-4 overscroll-contain flex flex-col"
        >
          {/* EMPTY STATE: Clean, Bright, Welcoming ChatGPT Style */}
          {!isMounted || messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-2xl mx-auto w-full text-center my-auto">
              {/* Standalone Sacred Cross (No box, pure black in light / pure white in dark) */}
              <div className="mb-5 sm:mb-6 flex items-center justify-center">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#111113] dark:text-white transition-transform hover:scale-105"
                  aria-hidden="true"
                >
                  <path d="M12 2v20M5 8h14" />
                </svg>
              </div>

              {/* Welcome Greeting with Account Name */}
              <div className="space-y-2 mb-7 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#111113] dark:text-white tracking-tight leading-snug">
                  Apa yang sedang ada di dalam hatimu hari ini,{' '}
                  <span className="font-bold text-[#111113] dark:text-white">{user.name}</span>?
                </h1>
                <p className="text-xs sm:text-sm text-[#8E8E93] max-w-md mx-auto leading-relaxed mt-2">
                  Tuliskan pertanyaan rohani, perikop firman, atau curahan isi hatimu dengan tenang.
                </p>
              </div>

              {/* Centered Pill Capsule Input Bar with Instant Camera */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="w-full bg-[#F2F2F4] dark:bg-[#18181D] hover:bg-[#ECECED] dark:hover:bg-[#1E1E24] focus-within:bg-white dark:focus-within:bg-[#1F1F26] focus-within:ring-2 focus-within:ring-black/5 dark:focus-within:ring-white/5 border border-[#DCDCE0] dark:border-[#2C2C32] focus-within:border-[#111113] dark:focus-within:border-zinc-400 rounded-full p-2 pl-3 sm:pl-3.5 pr-2.5 flex items-center gap-2 sm:gap-2.5 shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-8 h-8 rounded-full text-[#8E8E93] dark:text-zinc-400 hover:text-[#111113] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition flex-shrink-0 cursor-pointer active:scale-95"
                  title="Ambil foto instan (kamera langsung)"
                  aria-label="Ambil foto instan"
                >
                  <Camera size={18} strokeWidth={2} />
                </button>

                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Tanyakan hal rohani, atau foto catatan/firman..."
                  className="flex-1 bg-transparent text-sm sm:text-base text-[#111113] dark:text-white placeholder-[#8E8E93] dark:placeholder-zinc-500 focus:outline-none min-w-0 font-normal"
                />

                <button
                  type="submit"
                  disabled={!inputPrompt.trim()}
                  className="w-9 h-9 rounded-full bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black flex items-center justify-center shadow-xs transition disabled:opacity-30 dark:disabled:opacity-20 flex-shrink-0 cursor-pointer active:scale-95"
                  title="Kirim pesan"
                >
                  <ArrowUp size={16} strokeWidth={2.5} />
                </button>
              </form>

              {/* Starter Reflection Chips below capsule */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-xl">
                {FAITH_STARTERS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s.prompt)}
                    className="px-4 py-2 rounded-full bg-white dark:bg-[#18181D] hover:bg-neutral-50 dark:hover:bg-[#202026] text-xs font-medium text-[#111113] dark:text-zinc-200 border border-[#DCDCE0] dark:border-[#2C2C32] hover:border-[#111113] dark:hover:border-zinc-400 transition shadow-2xs cursor-pointer"
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* CONVERSATION STREAM WITH MULTI-BUBBLE RENDERING */
            <div className="space-y-4 pb-2">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isLastAssistant =
                  !isUser &&
                  index === messages.length - 1 &&
                  msg.status !== 'streaming' &&
                  !isGenerating;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isUser ? 'items-end' : 'items-start'
                    } transition-all duration-200 w-full`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center gap-1.5 px-2 mb-1 text-[11px] text-[#8E8E93]">
                      {!isUser ? (
                        <div className="w-4 h-4 rounded-full bg-[#111113] dark:bg-white text-white dark:text-black flex items-center justify-center">
                          <Sparkles size={10} />
                        </div>
                      ) : null}
                      <span className="font-semibold text-[#111113] dark:text-white">
                        {isUser ? user.name : 'Faith Companion'}
                      </span>
                      {msg.createdAt && (
                        <span className="text-[10px] text-[#8E8E93]">
                          • {formatTime(msg.createdAt)}
                        </span>
                      )}
                    </div>

                    {/* User Bubble */}
                    {isUser ? (
                      <div className="bg-[#111113] dark:bg-[#222228] text-white dark:text-zinc-100 border border-transparent dark:border-[#32323A] rounded-[22px] rounded-tr-xs px-4.5 py-3 text-[13.5px] leading-relaxed max-w-[85%] sm:max-w-[75%] shadow-xs">
                        {msg.imageUrl && (
                          <div className="mb-2.5 overflow-hidden rounded-xl border border-white/15 dark:border-white/10 max-w-xs shadow-xs">
                            <img
                              src={msg.imageUrl}
                              alt="Foto instan saat teduh"
                              className="w-full max-h-56 object-cover rounded-xl"
                            />
                          </div>
                        )}
                        <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                      </div>
                    ) : (
                      /* Assistant Multi-Bubble Cluster */
                      <div className="flex flex-col space-y-2 w-full">
                        {/* Thinking State */}
                        {msg.status === 'streaming' && !msg.content ? (
                          <div className="bg-[#ECECED] dark:bg-[#18181D] border border-[#DCDCE0] dark:border-[#27272D] rounded-[20px] rounded-tl-xs px-4 py-3 shadow-2xs inline-flex items-center gap-2.5 max-w-fit">
                            <div className="flex space-x-1.5 items-center">
                              <div className="w-1.5 h-1.5 bg-[#111113] dark:bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <div className="w-1.5 h-1.5 bg-[#111113] dark:bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <div className="w-1.5 h-1.5 bg-[#111113] dark:bg-white rounded-full animate-bounce" />
                            </div>
                            <span className="text-xs text-[#66666E] dark:text-[#A1A1AA] font-medium">
                              Mendengarkan &amp; merenungkan...
                            </span>
                          </div>
                        ) : (
                          <>
                            {splitIntoBubbles(msg.content).map((bubbleText, bIdx, allBubbles) => {
                              const isLastBubbleInMsg = bIdx === allBubbles.length - 1;
                              const isStreamingThisBubble = isLastBubbleInMsg && msg.status === 'streaming';

                              return (
                                <div
                                  key={bIdx}
                                  className="bg-[#F2F2F4] dark:bg-[#18181D] text-[#111113] dark:text-[#F4F4F6] border border-[#DCDCE0] dark:border-[#27272D] rounded-[22px] rounded-tl-xs px-4.5 py-3.5 shadow-2xs max-w-[94%] sm:max-w-[88%] text-[13.5px] leading-relaxed transition-all"
                                >
                                  <MarkdownRenderer
                                    content={bubbleText}
                                    isStreaming={isStreamingThisBubble}
                                  />
                                </div>
                              );
                            })}

                            {/* Action Toolbar on completed assistant message */}
                            {msg.status !== 'streaming' && msg.content && (
                              <div className="px-2 pt-0.5 flex items-center justify-between text-xs text-[#8E8E93] max-w-[94%] sm:max-w-[88%]">
                                <span className="text-[10px] text-[#8E8E93] flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#111113] dark:bg-white" />
                                  Refleksi pribadi
                                </span>

                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleCopy(msg.id, msg.content)}
                                    className="flex items-center gap-1 text-[#66666E] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white transition cursor-pointer text-[11px]"
                                    title="Salin renungan"
                                  >
                                    {copiedMsgId === msg.id ? (
                                      <>
                                        <Check size={12} className="text-[#111113] dark:text-white" />
                                        <span className="text-[#111113] dark:text-white font-semibold">Tersalin</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} />
                                        <span>Salin</span>
                                      </>
                                    )}
                                  </button>

                                  {isLastAssistant && (
                                    <button
                                      onClick={handleRegenerate}
                                      className="flex items-center gap-1 text-[#66666E] dark:text-[#A1A1AA] hover:text-[#111113] dark:hover:text-white transition cursor-pointer text-[11px]"
                                      title="Ulangi tanggapan"
                                    >
                                      <RotateCcw size={12} />
                                      <span>Ulangi</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Invisible Scroll Anchor */}
          <div ref={messagesEndRef} className="h-2 w-full shrink-0" aria-hidden="true" />
        </main>

        {/* Floating Scroll-to-bottom Button */}
        {showScrollBottomBtn && isGenerating && (
          <div className="absolute bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none">
            <button
              onClick={() => scrollToBottom(true)}
              className="pointer-events-auto bg-[#111113] dark:bg-zinc-800 text-white shadow-xl rounded-full px-3.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all animate-bounce cursor-pointer border border-black/10 dark:border-white/10"
            >
              <ChevronDown size={13} />
              <span>Tanggapan baru</span>
            </button>
          </div>
        )}

        {/* BOTTOM DOCK: Chat Input (when chat active) + Navigation */}
        <div className="flex-none bg-white dark:bg-[#121215] border-t border-[#EAEAEB] dark:border-[#222226] px-3 sm:px-6 py-2 pb-0 z-30 transition-colors">
          {/* Only render bottom input bar when conversation has messages */}
          {messages.length > 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="bg-[#F2F2F4] dark:bg-[#18181D] border border-[#DCDCE0] dark:border-[#2C2C32] focus-within:border-[#111113] dark:focus-within:border-zinc-400 focus-within:bg-white dark:focus-within:bg-[#1F1F26] rounded-[24px] p-1.5 pl-2 sm:pl-2.5 mb-2 flex items-end gap-2 transition-colors shadow-2xs"
            >
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-8 h-8 rounded-full text-[#8E8E93] dark:text-zinc-400 hover:text-[#111113] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition flex-shrink-0 cursor-pointer active:scale-95 mb-0.5"
                title="Ambil foto instan (kamera langsung)"
                aria-label="Ambil foto instan"
              >
                <Camera size={17} strokeWidth={2} />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Tanyakan hal rohani, atau foto catatan/firman..."
                className="flex-1 bg-transparent px-1 py-1.5 text-xs sm:text-sm text-[#111113] dark:text-white placeholder-[#8E8E93] dark:placeholder-zinc-500 focus:outline-none resize-none max-h-[120px] leading-relaxed"
              />

              {/* Action Button: Send or Stop */}
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  aria-label="Stop generation"
                  className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition flex-shrink-0 cursor-pointer shadow-xs mb-0.5"
                  title="Hentikan jawaban"
                >
                  <Square size={12} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputPrompt.trim()}
                  aria-label="Send message"
                  className="w-8 h-8 rounded-full bg-[#111113] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black flex items-center justify-center transition disabled:opacity-30 dark:disabled:opacity-20 flex-shrink-0 cursor-pointer shadow-xs mb-0.5"
                  title="Kirim pesan"
                >
                  <ArrowUp size={15} strokeWidth={2.5} />
                </button>
              )}
            </form>
          )}

          {/* Clean Navigation Bar Component */}
          <Navigation />
        </div>

        {/* Hidden Camera Input for Instant Camera & Photo Capture */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          onChange={handleCameraCapture}
          className="hidden"
          id="instant-camera-input"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {/* Sacred Sanctuary Entrance Transition (Only once on initial web entry) */}
      {showIntro && (
        <EntranceAnimation onComplete={handleIntroComplete} />
      )}
    </div>
  );
}
