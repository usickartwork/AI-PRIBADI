'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from '@/app/components/faith/Navigation';
import { useFaithNav } from '@/lib/faith/navigationContext';
import { getStoredUser, DEFAULT_USER } from '@/lib/faith/session';
import { User, Note } from '@/types/database';
import {
  getNotes,
  saveNote,
  deleteNote,
  createBlankNote,
  formatNoteDate,
  formatFullNoteDate,
} from '@/lib/faith/notes/storage';
import {
  ChevronLeft,
  SquarePen,
  Search,
  Pin,
  Trash2,
  Copy,
  Check,
  Share2,
  X,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  CheckSquare,
  Type,
  Heading,
  Palette,
  Highlighter,
  Undo2,
  Redo2,
  MoreVertical,
} from 'lucide-react';

const TEXT_COLORS = [
  { label: 'Hitam', value: '#111113', bg: 'bg-[#111113]' },
  { label: 'Emas Apple', value: '#D97706', bg: 'bg-amber-600' },
  { label: 'Biru', value: '#2563EB', bg: 'bg-blue-600' },
  { label: 'Hijau', value: '#16A34A', bg: 'bg-emerald-600' },
  { label: 'Merah', value: '#DC2626', bg: 'bg-rose-600' },
  { label: 'Ungu', value: '#9333EA', bg: 'bg-purple-600' },
  { label: 'Abu-abu', value: '#6B7280', bg: 'bg-gray-500' },
];

const CHECK_ICON_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

function createChecklistElement(text: string, checked: boolean = false): HTMLElement {
  const item = document.createElement('div');
  item.setAttribute('data-checklist-item', 'true');
  item.setAttribute('data-checked', checked ? 'true' : 'false');
  item.style.cssText = 'display:flex; align-items:flex-start; gap:10px; margin:5px 0; min-height:24px;';

  const box = document.createElement('span');
  box.setAttribute('data-checklist-box', 'true');
  box.setAttribute('contenteditable', 'false');
  box.style.cssText = checked
    ? 'width:19px; height:19px; min-width:19px; border-radius:50%; border:2px solid #D97706; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; margin-top:2px; user-select:none; transition:all 0.15s ease; background-color:#D97706; color:white;'
    : 'width:19px; height:19px; min-width:19px; border-radius:50%; border:2px solid #C7C7CC; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; margin-top:2px; user-select:none; transition:all 0.15s ease; background-color:white; color:transparent;';
  box.innerHTML = checked ? CHECK_ICON_SVG : '';

  const textDiv = document.createElement('div');
  textDiv.setAttribute('data-checklist-text', 'true');
  textDiv.setAttribute('contenteditable', 'true');
  textDiv.style.cssText = checked
    ? 'flex:1; min-width:0; outline:none; text-decoration:line-through; color:#8E8E93;'
    : 'flex:1; min-width:0; outline:none; text-decoration:none; color:inherit;';
  textDiv.innerHTML = text ? text : '<br>';

  item.appendChild(box);
  item.appendChild(textDiv);
  return item;
}

function updateChecklistItemVisual(item: HTMLElement, checked: boolean) {
  item.setAttribute('data-checked', checked ? 'true' : 'false');
  const box = item.querySelector('[data-checklist-box]') as HTMLElement;
  const text = item.querySelector('[data-checklist-text]') as HTMLElement;
  if (box) {
    box.style.borderColor = checked ? '#D97706' : '#C7C7CC';
    box.style.backgroundColor = checked ? '#D97706' : 'white';
    box.style.color = checked ? 'white' : 'transparent';
    box.innerHTML = checked ? CHECK_ICON_SVG : '';
  }
  if (text) {
    text.style.textDecoration = checked ? 'line-through' : 'none';
    text.style.color = checked ? '#8E8E93' : 'inherit';
  }
}

function placeCaretAt(el: HTMLElement, atStart: boolean = false) {
  try {
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    if (atStart && el.firstChild) {
      range.setStartBefore(el.firstChild);
      range.collapse(true);
    } else if (!atStart && el.lastChild) {
      range.setStartAfter(el.lastChild);
      range.collapse(false);
    } else {
      range.selectNodeContents(el);
      range.collapse(atStart);
    }
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (err) {
    console.error('placeCaretAt error', err);
  }
}

function isCaretAtStart(el: HTMLElement): boolean {
  try {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return false;
    const preRange = document.createRange();
    preRange.selectNodeContents(el);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString().length === 0;
  } catch {
    return false;
  }
}

function getEnclosingBlock(node: Node | null, root: HTMLElement): HTMLElement | null {
  if (!node) return null;
  // If inside a checklist item, always return the root checklist item
  const checkEl = (node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement)?.closest('[data-checklist-item]');
  if (checkEl && root.contains(checkEl)) {
    return checkEl as HTMLElement;
  }

  let curr: Node | null = node;
  while (curr && curr !== root) {
    if (curr.nodeType === Node.ELEMENT_NODE) {
      const el = curr as HTMLElement;
      if (
        el.getAttribute('data-checklist-item') === 'true' ||
        el.tagName === 'P' ||
        el.tagName === 'DIV' ||
        el.tagName === 'H1' ||
        el.tagName === 'H2' ||
        el.tagName === 'H3' ||
        el.tagName === 'LI'
      ) {
        return el;
      }
    }
    curr = curr.parentNode;
  }
  return null;
}

function isSelectionFormatted(cmd: string, tags: string[], sel: Selection, root: HTMLElement): boolean {
  if (!sel || !sel.rangeCount) return false;
  try {
    if (document.queryCommandState(cmd)) return true;
  } catch {
    // Ignore query error
  }

  const range = sel.getRangeAt(0);
  let node: Node | null = range.startContainer;
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const child = el.childNodes[range.startOffset] || el;
    node = child;
  }

  while (node && node !== root) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (tags.includes(el.tagName)) return true;
      if (cmd === 'bold' && (el.style.fontWeight === 'bold' || el.style.fontWeight === '700')) return true;
      if (cmd === 'italic' && el.style.fontStyle === 'italic') return true;
      if (cmd === 'underline' && el.style.textDecoration?.includes('underline')) return true;
    }
    node = node.parentNode;
  }
  return false;
}

function isHighlightElement(el: HTMLElement): boolean {
  if (el.tagName === 'MARK') return true;
  const bg = el.style.backgroundColor?.toLowerCase() || '';
  if (
    bg &&
    bg !== 'transparent' &&
    bg !== 'rgba(0, 0, 0, 0)' &&
    bg !== 'inherit' &&
    bg !== 'initial' &&
    bg !== 'white' &&
    bg !== 'rgb(255, 255, 255)' &&
    bg !== '#ffffff' &&
    bg !== '#fff'
  ) {
    return true;
  }
  const bgProp = el.style.background?.toLowerCase() || '';
  if (
    bgProp &&
    bgProp !== 'none' &&
    bgProp !== 'transparent' &&
    bgProp !== 'inherit' &&
    bgProp !== 'initial' &&
    bgProp !== 'white' &&
    bgProp !== 'rgb(255, 255, 255)' &&
    bgProp !== '#ffffff' &&
    bgProp !== '#fff'
  ) {
    return true;
  }
  return false;
}

function isSelectionHighlighted(sel: Selection, root: HTMLElement): boolean {
  if (!sel || !sel.rangeCount) return false;

  const range = sel.getRangeAt(0);

  // 1. Check startContainer ancestors
  let curr: Node | null = range.startContainer;
  while (curr && curr !== root) {
    if (curr.nodeType === Node.ELEMENT_NODE) {
      if (isHighlightElement(curr as HTMLElement)) return true;
    }
    curr = curr.parentNode;
  }

  // 2. Check endContainer ancestors
  curr = range.endContainer;
  while (curr && curr !== root) {
    if (curr.nodeType === Node.ELEMENT_NODE) {
      if (isHighlightElement(curr as HTMLElement)) return true;
    }
    curr = curr.parentNode;
  }

  // 3. Check any element intersecting the range
  if (!range.collapsed) {
    const els = root.querySelectorAll('mark, [style*="background-color"], [style*="background"]');
    for (let i = 0; i < els.length; i++) {
      const el = els[i] as HTMLElement;
      if (isHighlightElement(el)) {
        try {
          if (range.intersectsNode(el)) return true;
        } catch {}
      }
    }
  }

  return false;
}

export default function NotesPage() {
  const { setActiveTab } = useFaithNav();
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active note in editor (null means viewing notes list)
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [menuOpenNoteId, setMenuOpenNoteId] = useState<string | null>(null);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Format panel state (Apple Aa popover)
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [formatMenuTab, setFormatMenuTab] = useState<'text' | 'color'>('text');

  // Viewport tracking for mobile keyboard docking (Apple Notes style)
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportTop, setViewportTop] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const lastEnterHandledRef = useRef<number>(0);
  const lastBackspaceHandledRef = useRef<number>(0);
  const lastCmdTimeRef = useRef<number>(0);

  // Undo / Redo history tracking (Apple Notes style)
  const historyStackRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isHistoryNavigatingRef = useRef<boolean>(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    heading: false,
    highlight: false,
  });

  // Track visualViewport so the editor container resizes synchronously with the virtual keyboard
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      if (window.visualViewport) {
        const vv = window.visualViewport;
        const currentH = Math.round(vv.height);
        const currentTop = Math.round(vv.offsetTop);
        setViewportHeight(currentH);
        setViewportTop(currentTop);
        // Keyboard is active if visualViewport is noticeably smaller than window.innerHeight
        const totalHeight = window.innerHeight;
        const isOpen = totalHeight - currentH > 100;
        setIsKeyboardOpen(isOpen);
      } else {
        setViewportHeight(window.innerHeight);
        setViewportTop(0);
        setIsKeyboardOpen(false);
      }
    };

    updateViewport();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateViewport);
      vv.addEventListener('scroll', updateViewport);
    }
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    // Fast-response listener on focus/blur for instant keyboard movement
    const handleFocusActivity = () => {
      setTimeout(updateViewport, 30);
      setTimeout(updateViewport, 150);
      setTimeout(updateViewport, 350);
    };

    window.addEventListener('focusin', handleFocusActivity);
    window.addEventListener('focusout', handleFocusActivity);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateViewport);
        vv.removeEventListener('scroll', updateViewport);
      }
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      window.removeEventListener('focusin', handleFocusActivity);
      window.removeEventListener('focusout', handleFocusActivity);
    };
  }, []);

  // Check auth and load user notes on mount
  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
    setIsAuthenticated(true);

    const userId = currentUser.id || currentUser.token;

    async function loadUserNotes(targetId: string) {
      setIsLoading(true);
      try {
        const loaded = await getNotes(targetId);
        setNotes(loaded);
      } catch (err) {
        console.error('Failed to load notes', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserNotes(userId);
  }, []);

  // Open note for editing
  const handleOpenNote = (note: Note) => {
    setActiveNote(note);
    setTitleInput(note.title);
    setContentInput(note.content);
    setIsPinned(note.pinned);
    setSaveStatus('saved');
    setShowFormatMenu(false);

    // Populate contentEditable cleanly
    setTimeout(() => {
      if (editorRef.current) {
        if (note.content) {
          editorRef.current.innerHTML = note.content;
        } else {
          editorRef.current.innerHTML = '';
        }
        historyStackRef.current = [note.content || ''];
        historyIndexRef.current = 0;
        setCanUndo(false);
        setCanRedo(false);
      }
    }, 40);
  };

  // Create and immediately open new note
  const handleCreateNewNote = async () => {
    if (!user) return;
    const blank = createBlankNote(user.id || user.token);
    const created = await saveNote(blank);
    setNotes((prev) => [created, ...prev]);
    handleOpenNote(created);

    // Auto focus title input
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 120);
  };

  // Auto-save logic with debounce
  const triggerAutoSave = (newTitle: string, newContent: string, newPinned: boolean) => {
    if (!activeNote || !user) return;
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const toSave: Note = {
        ...activeNote,
        title: newTitle,
        content: newContent,
        pinned: newPinned,
        updated_at: new Date().toISOString(),
      };

      try {
        const saved = await saveNote(toSave);
        setActiveNote(saved);
        setNotes((prev) => {
          const filtered = prev.filter((n) => n.id !== saved.id);
          const next = [saved, ...filtered];
          next.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          });
          return next;
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto save error', err);
        setSaveStatus('saved');
      }
    }, 450);
  };

  // Title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitleInput(val);
    const currentHtml = editorRef.current?.innerHTML || contentInput;
    triggerAutoSave(val, currentHtml, isPinned);
  };

  const pushHistory = useCallback((html: string) => {
    if (isHistoryNavigatingRef.current) return;
    const current = historyStackRef.current[historyIndexRef.current];
    if (current === html) return;

    const newStack = historyStackRef.current.slice(0, historyIndexRef.current + 1);
    newStack.push(html);
    if (newStack.length > 50) newStack.shift();

    historyStackRef.current = newStack;
    historyIndexRef.current = newStack.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Editor content input
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setContentInput(html);
    pushHistory(html);
    triggerAutoSave(titleInput, html, isPinned);
  };

  const handleUndo = () => {
    if (!editorRef.current) return;
    if (historyIndexRef.current > 0) {
      isHistoryNavigatingRef.current = true;
      historyIndexRef.current -= 1;
      const targetHtml = historyStackRef.current[historyIndexRef.current];
      editorRef.current.innerHTML = targetHtml;
      setContentInput(targetHtml);
      triggerAutoSave(titleInput, targetHtml, isPinned);
      updateActiveFormats();
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
      setTimeout(() => {
        isHistoryNavigatingRef.current = false;
      }, 50);
    } else {
      document.execCommand('undo');
      handleEditorInput();
    }
  };

  const handleRedo = () => {
    if (!editorRef.current) return;
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      isHistoryNavigatingRef.current = true;
      historyIndexRef.current += 1;
      const targetHtml = historyStackRef.current[historyIndexRef.current];
      editorRef.current.innerHTML = targetHtml;
      setContentInput(targetHtml);
      triggerAutoSave(titleInput, targetHtml, isPinned);
      updateActiveFormats();
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
      setTimeout(() => {
        isHistoryNavigatingRef.current = false;
      }, 50);
    } else {
      document.execCommand('redo');
      handleEditorInput();
    }
  };

  // Helper to trigger commands smoothly on touch & click without double firing or selection loss
  const triggerCmd = (action: () => void) => (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (Date.now() - lastCmdTimeRef.current < 120) return;
    lastCmdTimeRef.current = Date.now();
    action();
  };

  // Inspect current cursor position/selection to update active format buttons
  const updateActiveFormats = () => {
    if (typeof document === 'undefined') return;
    try {
      const sel = window.getSelection();
      let isBold = false;
      let isItalic = false;
      let isUnderline = false;
      let isHeading = false;
      let isHighlight = false;

      if (sel && sel.rangeCount > 0 && editorRef.current) {
        isBold = isSelectionFormatted('bold', ['B', 'STRONG'], sel, editorRef.current);
        isItalic = isSelectionFormatted('italic', ['I', 'EM'], sel, editorRef.current);
        isUnderline = isSelectionFormatted('underline', ['U'], sel, editorRef.current);
        isHighlight = isSelectionHighlighted(sel, editorRef.current);

        const block = getEnclosingBlock(sel.anchorNode, editorRef.current);
        if (block && block.tagName === 'H2') {
          isHeading = true;
        }
      } else {
        isBold = document.queryCommandState('bold');
        isItalic = document.queryCommandState('italic');
        isUnderline = document.queryCommandState('underline');
      }

      if (!isHeading) {
        const val = document.queryCommandValue('formatBlock');
        if (val === 'h2' || val === 'H2' || val === 'heading 2') {
          isHeading = true;
        }
      }

      setActiveFormats({
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        heading: isHeading,
        highlight: isHighlight,
      });
    } catch {
      // Ignore query errors
    }
  };

  // Formatting execution (preserves active selection in contentEditable)
  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    if (!editorRef.current) return;

    const sel = window.getSelection();
    let isInside = false;
    if (sel && sel.rangeCount > 0) {
      const anchorNode = sel.anchorNode;
      if (anchorNode && editorRef.current.contains(anchorNode)) {
        isInside = true;
      }
    }

    if (!isInside) {
      editorRef.current.focus();
    }

    document.execCommand(cmd, false, val);
    updateActiveFormats();
    handleEditorInput();
  };

  // Dedicated toggler for inline styles (bold, italic, underline) with foolproof unwrapping
  const handleToggleInlineFormat = (cmd: 'bold' | 'italic' | 'underline', tags: string[]) => {
    if (!editorRef.current) return;

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
      editorRef.current.focus();
      document.execCommand(cmd);
      updateActiveFormats();
      handleEditorInput();
      return;
    }

    const range = sel.getRangeAt(0);
    const isFormatted = isSelectionFormatted(cmd, tags, sel, editorRef.current);

    if (isFormatted) {
      // UNFORMAT
      document.execCommand(cmd);

      let node: Node | null = range.startContainer;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const child = node.childNodes[range.startOffset];
        if (child && tags.includes(child.nodeName)) {
          node = child;
        }
      }

      let formatEl: HTMLElement | null = null;
      let curr: Node | null = node;
      while (curr && curr !== editorRef.current) {
        if (curr.nodeType === Node.ELEMENT_NODE) {
          const el = curr as HTMLElement;
          if (tags.includes(el.tagName)) {
            formatEl = el;
            break;
          }
          if (cmd === 'bold' && (el.style.fontWeight === 'bold' || el.style.fontWeight === '700')) {
            formatEl = el;
            break;
          }
        }
        curr = curr.parentNode;
      }

      // If browser execCommand failed to unwrap format tag
      if (formatEl && editorRef.current.contains(formatEl)) {
        if (range.collapsed) {
          const textNode = document.createTextNode('\u200B');
          formatEl.parentNode?.insertBefore(textNode, formatEl.nextSibling);
          const newRange = document.createRange();
          newRange.setStart(textNode, 1);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          const p = formatEl.parentNode;
          if (p) {
            while (formatEl.firstChild) {
              p.insertBefore(formatEl.firstChild, formatEl);
            }
            p.removeChild(formatEl);
          }
        }
      }

      // Also clean up any matching tags inside the selection range
      if (!range.collapsed) {
        const selector = tags.map((t) => t.toLowerCase()).join(', ');
        const matchingEls = editorRef.current.querySelectorAll(selector);
        matchingEls.forEach((el) => {
          if (sel.containsNode(el, true)) {
            const p = el.parentNode;
            if (p) {
              while (el.firstChild) {
                p.insertBefore(el.firstChild, el);
              }
              p.removeChild(el);
            }
          }
        });
      }
    } else {
      // FORMAT ON
      document.execCommand(cmd);
    }

    updateActiveFormats();
    handleEditorInput();
  };

  const handleToggleHeading = () => {
    if (!editorRef.current) return;

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
      editorRef.current.focus();
      return;
    }

    const range = sel.getRangeAt(0);
    const block = getEnclosingBlock(range.startContainer, editorRef.current);

    if (block && block.tagName === 'H2') {
      // It is already H2 -> toggle OFF to normal paragraph/div
      const div = document.createElement('div');
      div.innerHTML = block.innerHTML || '<br>';
      div.style.minHeight = '24px';
      block.parentNode?.replaceChild(div, block);
      placeCaretAt(div, false);
      updateActiveFormats();
      handleEditorInput();
      return;
    }

    if (block && block !== editorRef.current && block.getAttribute('data-checklist-item') !== 'true') {
      // It is a normal line -> toggle ON to H2
      const h2 = document.createElement('h2');
      h2.innerHTML = block.innerHTML || '<br>';
      block.parentNode?.replaceChild(h2, block);
      placeCaretAt(h2, false);
      updateActiveFormats();
      handleEditorInput();
      return;
    }

    // Fallback: formatBlock
    const current = document.queryCommandValue('formatBlock');
    if (current === 'h2' || current === 'H2' || current === 'heading 2') {
      document.execCommand('formatBlock', false, '<div>');
    } else {
      document.execCommand('formatBlock', false, '<h2>');
    }
    updateActiveFormats();
    handleEditorInput();
  };

  const handleToggleHighlight = () => {
    if (!editorRef.current) return;

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
      editorRef.current.focus();
      return;
    }

    const range = sel.getRangeAt(0);

    // If range is collapsed, expand selection to the word under cursor if possible
    if (range.collapsed) {
      let node: Node | null = range.startContainer;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const child = node.childNodes[range.startOffset];
        if (child) node = child;
      }
      if (node && node.nodeType === Node.TEXT_NODE && node.textContent) {
        const text = node.textContent;
        let start = range.startOffset;
        let end = range.startOffset;
        while (start > 0 && /\S/.test(text[start - 1])) start--;
        while (end < text.length && /\S/.test(text[end])) end++;
        if (end > start) {
          const newRange = document.createRange();
          newRange.setStart(node, start);
          newRange.setEnd(node, end);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
    }

    const currentRange = sel.getRangeAt(0);
    const isHighlighted = isSelectionHighlighted(sel, editorRef.current);

    if (isHighlighted) {
      // USER WANTS TO UN-STABILO (REMOVE HIGHLIGHT)
      try {
        document.execCommand('hiliteColor', false, 'inherit');
        document.execCommand('backColor', false, 'inherit');
      } catch {}

      const elementsToClear = new Set<HTMLElement>();

      // Ancestors of startContainer
      let curr: Node | null = currentRange.startContainer;
      while (curr && curr !== editorRef.current) {
        if (curr.nodeType === Node.ELEMENT_NODE && isHighlightElement(curr as HTMLElement)) {
          elementsToClear.add(curr as HTMLElement);
        }
        curr = curr.parentNode;
      }

      // Ancestors of endContainer
      curr = currentRange.endContainer;
      while (curr && curr !== editorRef.current) {
        if (curr.nodeType === Node.ELEMENT_NODE && isHighlightElement(curr as HTMLElement)) {
          elementsToClear.add(curr as HTMLElement);
        }
        curr = curr.parentNode;
      }

      // Any matching elements inside editor that intersect currentRange
      const allStyled = editorRef.current.querySelectorAll('mark, [style*="background-color"], [style*="background"]');
      allStyled.forEach((node) => {
        const el = node as HTMLElement;
        if (isHighlightElement(el)) {
          try {
            if (currentRange.intersectsNode(el)) {
              elementsToClear.add(el);
            }
          } catch {}
        }
      });

      // Clear highlights completely
      elementsToClear.forEach((el) => {
        el.style.backgroundColor = '';
        el.style.removeProperty('background-color');
        el.style.removeProperty('background');

        // If it's a MARK or SPAN with no other meaningful styles, unwrap it cleanly
        const hasOtherStyles =
          el.style.fontWeight ||
          el.style.fontStyle ||
          el.style.textDecoration ||
          el.style.color ||
          el.style.fontSize;

        if (el.tagName === 'MARK' || (!hasOtherStyles && el.tagName === 'SPAN')) {
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) {
              parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
          }
        }
      });
    } else {
      // USER WANTS TO STABILO (APPLY YELLOW HIGHLIGHT)
      let applied = false;
      try {
        applied = document.execCommand('hiliteColor', false, '#FEF08A');
        if (!applied) {
          applied = document.execCommand('backColor', false, '#FEF08A');
        }
      } catch {}

      if (!applied && !currentRange.collapsed) {
        try {
          const mark = document.createElement('mark');
          mark.style.backgroundColor = '#FEF08A';
          mark.style.color = 'inherit';
          mark.appendChild(currentRange.extractContents());
          currentRange.insertNode(mark);
          sel.removeAllRanges();
          const r = document.createRange();
          r.selectNodeContents(mark);
          sel.addRange(r);
        } catch {}
      }
    }

    updateActiveFormats();
    handleEditorInput();
  };

  const handleInsertChecklist = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
      const item = createChecklistElement('', false);
      editorRef.current.appendChild(item);
      const textSpan = item.querySelector('[data-checklist-text]') as HTMLElement;
      if (textSpan) placeCaretAt(textSpan, true);
      handleEditorInput();
      return;
    }

    const range = sel.getRangeAt(0);

    // 1. Direct check: Is cursor already inside a checklist item?
    let node: Node | null = range.startContainer;
    let existingCheckItem: HTMLElement | null = null;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.getAttribute('data-checklist-item') === 'true') {
          existingCheckItem = el;
          break;
        }
      }
      node = node.parentNode;
    }

    if (!existingCheckItem && range.startContainer === editorRef.current) {
      const child = editorRef.current.childNodes[range.startOffset] as HTMLElement | undefined;
      if (child && child.nodeType === Node.ELEMENT_NODE && child.getAttribute('data-checklist-item') === 'true') {
        existingCheckItem = child;
      }
    }

    if (existingCheckItem) {
      // TOGGLE OFF: Cannot add another checklist on the same line! Convert back to normal div line!
      const textSpan = existingCheckItem.querySelector('[data-checklist-text]') as HTMLElement | null;
      const content = textSpan ? textSpan.innerHTML : existingCheckItem.innerHTML;
      const normalLine = document.createElement('div');
      normalLine.innerHTML = content && content !== '<br>' ? content : '<br>';
      normalLine.style.minHeight = '24px';
      existingCheckItem.parentNode?.replaceChild(normalLine, existingCheckItem);
      placeCaretAt(normalLine, false);
      updateActiveFormats();
      handleEditorInput();
      return;
    }

    // 2. Not a checklist item: Convert existing line into checklist item
    const block = getEnclosingBlock(range.startContainer, editorRef.current);
    if (block && block !== editorRef.current) {
      const content = block.innerHTML;
      const cleanContent = content === '<br>' || content.trim() === '' ? '' : content;
      const item = createChecklistElement(cleanContent, false);
      block.parentNode?.replaceChild(item, block);
      const textSpan = item.querySelector('[data-checklist-text]') as HTMLElement;
      if (textSpan) placeCaretAt(textSpan, false);
      updateActiveFormats();
      handleEditorInput();
      return;
    }

    // 3. Fallback: Insert at current selection
    const item = createChecklistElement('', false);
    range.deleteContents();
    range.insertNode(item);
    const textSpan = item.querySelector('[data-checklist-text]') as HTMLElement;
    if (textSpan) placeCaretAt(textSpan, true);
    updateActiveFormats();
    handleEditorInput();
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // 1. Checklist circle clicked
    const box = target.closest('[data-checklist-box]') as HTMLElement | null;
    if (box) {
      e.preventDefault();
      e.stopPropagation();
      const item = box.closest('[data-checklist-item]') as HTMLElement | null;
      if (item) {
        const isChecked = item.getAttribute('data-checked') === 'true';
        updateChecklistItemVisual(item, !isChecked);
        handleEditorInput();
      }
      return;
    }

    // 2. Backward compatibility for legacy <input type="checkbox">
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      const input = target as HTMLInputElement;
      if (input.checked) {
        input.setAttribute('checked', 'checked');
      } else {
        input.removeAttribute('checked');
      }
      handleEditorInput();
    }
  };

  const handleEnterKey = (e: React.KeyboardEvent<HTMLDivElement> | React.FormEvent<HTMLDivElement>) => {
    if (Date.now() - lastEnterHandledRef.current < 250) {
      e.preventDefault();
      return true;
    }

    if (!editorRef.current) return false;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);

    // Find if caret is inside a checklist item
    let curr: Node | null = range.startContainer;
    let checkItem: HTMLElement | null = null;
    while (curr && curr !== editorRef.current) {
      if (curr.nodeType === Node.ELEMENT_NODE) {
        const el = curr as HTMLElement;
        if (el.getAttribute('data-checklist-item') === 'true') {
          checkItem = el;
          break;
        }
      }
      curr = curr.parentNode;
    }

    if (!checkItem && range.startContainer === editorRef.current) {
      const child = editorRef.current.childNodes[range.startOffset] as HTMLElement | undefined;
      if (child && child.nodeType === Node.ELEMENT_NODE && child.getAttribute('data-checklist-item') === 'true') {
        checkItem = child;
      }
    }

    if (!checkItem) {
      // Check if cursor is inside an H2 heading block
      const h2Block = getEnclosingBlock(range.startContainer, editorRef.current);
      if (h2Block && h2Block.tagName === 'H2') {
        e.preventDefault();
        lastEnterHandledRef.current = Date.now();

        let afterFrag: DocumentFragment | null = null;
        try {
          const afterRange = range.cloneRange();
          afterRange.selectNodeContents(h2Block);
          afterRange.setStart(range.endContainer, range.endOffset);
          afterFrag = afterRange.extractContents();
          if (!h2Block.innerHTML.trim()) {
            h2Block.innerHTML = '<br>';
          }
        } catch (err) {
          console.error('Error splitting H2', err);
        }

        const nextDiv = document.createElement('div');
        if (afterFrag && (afterFrag.textContent?.trim() || afterFrag.childNodes.length > 0)) {
          nextDiv.appendChild(afterFrag);
        } else {
          nextDiv.innerHTML = '<br>';
        }
        nextDiv.style.minHeight = '24px';
        h2Block.insertAdjacentElement('afterend', nextDiv);
        placeCaretAt(nextDiv, true);
        updateActiveFormats();
        handleEditorInput();
        return true;
      }

      return false;
    }

    // Inside checklist: always prevent default so mobile browser never inserts random space
    e.preventDefault();
    lastEnterHandledRef.current = Date.now();

    const textEl = checkItem.querySelector('[data-checklist-text]') as HTMLElement | null;
    const currentText = textEl ? (textEl.textContent || '').replace(/\u00A0/g, ' ').trim() : '';

    // If current item is empty AND previous item was also a checklist item:
    // User pressed Enter on a second empty checklist -> convert to normal text line
    const prevSibling = checkItem.previousElementSibling as HTMLElement | null;
    const prevIsChecklist = prevSibling?.getAttribute('data-checklist-item') === 'true';

    if (!currentText && prevIsChecklist) {
      const normalLine = document.createElement('div');
      normalLine.innerHTML = '<br>';
      normalLine.style.minHeight = '24px';
      checkItem.parentNode?.replaceChild(normalLine, checkItem);
      placeCaretAt(normalLine, true);
      handleEditorInput();
      return true;
    }

    // Split text if cursor is in middle of text
    let afterFrag: DocumentFragment | null = null;
    if (textEl && currentText) {
      try {
        const afterRange = range.cloneRange();
        afterRange.selectNodeContents(textEl);
        afterRange.setStart(range.endContainer, range.endOffset);
        afterFrag = afterRange.extractContents();

        if (!textEl.innerHTML.trim()) {
          textEl.innerHTML = '<br>';
        }
      } catch (err) {
        console.error('Error splitting checklist text', err);
      }
    }

    // Create next checklist item below and place caret
    const newItem = createChecklistElement('', false);
    const newTextEl = newItem.querySelector('[data-checklist-text]') as HTMLElement;
    if (afterFrag && (afterFrag.textContent?.trim() || afterFrag.childNodes.length > 0)) {
      newTextEl.innerHTML = '';
      newTextEl.appendChild(afterFrag);
      if (!newTextEl.innerHTML.trim()) {
        newTextEl.innerHTML = '<br>';
      }
    }

    checkItem.insertAdjacentElement('afterend', newItem);
    if (newTextEl) placeCaretAt(newTextEl, true);
    handleEditorInput();
    return true;
  };

  const handleBackspaceKey = (e: React.KeyboardEvent<HTMLDivElement> | React.FormEvent<HTMLDivElement>) => {
    if (Date.now() - lastBackspaceHandledRef.current < 150) {
      e.preventDefault();
      return true;
    }

    if (!editorRef.current) return false;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return false;

    let curr: Node | null = range.startContainer;
    let checkItem: HTMLElement | null = null;
    while (curr && curr !== editorRef.current) {
      if (curr.nodeType === Node.ELEMENT_NODE) {
        const el = curr as HTMLElement;
        if (el.getAttribute('data-checklist-item') === 'true') {
          checkItem = el;
          break;
        }
      }
      curr = curr.parentNode;
    }

    if (!checkItem) return false;

    const textEl = checkItem.querySelector('[data-checklist-text]') as HTMLElement | null;
    if (!textEl) return false;

    const isEmpty = !textEl.textContent?.trim();
    const atStart = isCaretAtStart(textEl);

    if (isEmpty) {
      e.preventDefault();
      lastBackspaceHandledRef.current = Date.now();
      const prevSibling = checkItem.previousElementSibling as HTMLElement | null;
      if (prevSibling) {
        checkItem.remove();
        const prevText =
          (prevSibling.querySelector('[data-checklist-text]') as HTMLElement) || prevSibling;
        placeCaretAt(prevText, false);
      } else {
        const normalLine = document.createElement('div');
        normalLine.innerHTML = '<br>';
        normalLine.style.minHeight = '24px';
        checkItem.parentNode?.replaceChild(normalLine, checkItem);
        placeCaretAt(normalLine, true);
      }
      handleEditorInput();
      return true;
    } else if (atStart) {
      e.preventDefault();
      lastBackspaceHandledRef.current = Date.now();
      const normalLine = document.createElement('div');
      normalLine.innerHTML = textEl.innerHTML || '<br>';
      normalLine.style.minHeight = '24px';
      checkItem.parentNode?.replaceChild(normalLine, checkItem);
      placeCaretAt(normalLine, true);
      handleEditorInput();
      return true;
    }

    return false;
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Undo / Redo keyboard shortcuts
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handleRedo();
      return;
    }

    if (e.key === 'Enter' || e.keyCode === 13 || e.which === 13) {
      if (!e.shiftKey) {
        handleEnterKey(e);
      }
    } else if (e.key === 'Backspace' || e.keyCode === 8) {
      handleBackspaceKey(e);
    }
  };

  const handleEditorBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    if (nativeEvent) {
      if (
        nativeEvent.inputType === 'insertParagraph' ||
        nativeEvent.inputType === 'insertLineBreak'
      ) {
        handleEnterKey(e);
      } else if (nativeEvent.inputType === 'deleteContentBackward') {
        handleBackspaceKey(e);
      }
    }
  };

  // Toggle Pin inside editor
  const handleTogglePinInEditor = () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    const currentHtml = editorRef.current?.innerHTML || contentInput;
    triggerAutoSave(titleInput, currentHtml, nextPinned);
  };

  // Toggle Pin from list view
  const handleTogglePinFromList = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    const updated: Note = {
      ...note,
      pinned: !note.pinned,
      updated_at: new Date().toISOString(),
    };
    const saved = await saveNote(updated);
    setNotes((prev) => {
      const next = prev.map((n) => (n.id === saved.id ? saved : n));
      next.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      return next;
    });
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    await deleteNote(noteId, user.id || user.token);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (activeNote?.id === noteId) {
      setActiveNote(null);
    }
    setDeleteConfirmId(null);
  };

  // Copy note from list view
  const handleCopyNoteFromList = (note: Note) => {
    const cleanText = note.content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    const textToCopy = `${note.title ? note.title + '\n\n' : ''}${cleanText}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedNoteId(note.id);
      setTimeout(() => setCopiedNoteId(null), 2000);
    }
  };

  // Share note from list view
  const handleShareNoteFromList = async (note: Note) => {
    const cleanText = note.content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    const textToShare = `${note.title ? note.title + '\n\n' : ''}${cleanText}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: note.title || 'Catatan Faith Hub',
          text: textToShare,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToShare);
      setCopiedNoteId(note.id);
      setTimeout(() => setCopiedNoteId(null), 2000);
    }
  };

  // Return from editor to list (flushes pending save and cleans up empty notes)
  const handleBackToList = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (activeNote && user) {
      const finalHtml = editorRef.current ? editorRef.current.innerHTML : contentInput;
      const stripped = finalHtml.replace(/<[^>]+>/g, '').trim();

      if (!titleInput.trim() && !stripped) {
        await handleDeleteNote(activeNote.id);
      } else {
        const finalNote: Note = {
          ...activeNote,
          title: titleInput.trim(),
          content: finalHtml,
          pinned: isPinned,
          updated_at: new Date().toISOString(),
        };
        const saved = await saveNote(finalNote);
        setNotes((prev) => {
          const filtered = prev.filter((n) => n.id !== saved.id);
          const next = [saved, ...filtered];
          next.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          });
          return next;
        });
      }
    }
    setActiveNote(null);
    setShowFormatMenu(false);
  };

  // Copy note text as clean formatted plain text
  const handleCopyNote = () => {
    const rawHtml = editorRef.current ? editorRef.current.innerHTML : contentInput;
    const cleanText = rawHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    const textToCopy = `${titleInput ? titleInput + '\n\n' : ''}${cleanText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share note text (Web Share API)
  const handleShareNote = async () => {
    const rawHtml = editorRef.current ? editorRef.current.innerHTML : contentInput;
    const cleanText = rawHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    const textToShare = `${titleInput ? titleInput + '\n\n' : ''}${cleanText}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: titleInput || 'Catatan Renungan',
          text: textToShare,
        });
      } catch {
        handleCopyNote();
      }
    } else {
      handleCopyNote();
    }
  };

  // Filter notes by search
  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const cleanContent = n.content.replace(/<[^>]+>/g, ' ').toLowerCase();
    return n.title.toLowerCase().includes(q) || cleanContent.includes(q);
  });

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned);

  // Word count & character count
  const rawText = contentInput.replace(/<[^>]+>/g, ' ').trim();
  const wordCount = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;
  const charCount = rawText.length;

  if (!isAuthenticated) {
    return <div className="h-[100dvh] w-full bg-[#E5E5E5]" />;
  }

  return (
    <div
      className="h-full max-h-full w-full bg-transparent flex flex-col items-center justify-center sm:p-2 sm:pb-3 overflow-hidden"
    >
      {/* Precision Shell matching Faith Hub & Apple iOS Notes */}
      <div className="w-full max-w-4xl h-full bg-[#F2F2F7] dark:bg-[#121214] rounded-none sm:rounded-[32px] sm:border border-[#EAEAEB] dark:border-white/10 sm:shadow-lg flex flex-col overflow-hidden relative">

        {/* ================================================================= */}
        {/* VIEW A: NOTES LIST VIEW (FOLDER VIEW)                             */}
        {/* ================================================================= */}
        {!activeNote ? (
          <>
            {/* Top iOS Header Bar */}
            <div className="flex-none bg-[#F2F2F7]/95 backdrop-blur-md px-4 sm:px-6 pt-3.5 pb-2.5 z-20 flex items-center justify-between border-b border-[#E5E5EA]">
              <button
                type="button"
                onClick={() => setActiveTab('tanya')}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#111113] hover:opacity-75 transition active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={18} strokeWidth={2.5} className="text-[#111113]" />
                <span>Tanya Rohani</span>
              </button>

              {/* Top Right Quick Compose */}
              <button
                type="button"
                onClick={handleCreateNewNote}
                className="w-8 h-8 rounded-full bg-white hover:bg-neutral-100 text-[#111113] flex items-center justify-center border border-[#E5E5EA] transition cursor-pointer shadow-2xs active:scale-95"
                title="Tulis Catatan Baru"
              >
                <SquarePen size={15} strokeWidth={2.2} />
              </button>
            </div>

            {/* Main Scrollable List Area */}
            <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              {/* Large iOS Header Title */}
              <div className="pt-1">
                <h1 className="text-3xl font-extrabold text-[#111113] tracking-tight">
                  Catatan
                </h1>
                <p className="text-xs text-[#8E8E93] font-medium mt-0.5">
                  Ruang Catatan Renungan &amp; Pokok Doa Pribadi
                </p>
              </div>

              {/* iOS Search Bar */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-2.5 text-[#8E8E93]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari catatan renungan..."
                  className="w-full bg-[#E5E5EA]/80 hover:bg-[#E5E5EA] focus:bg-white text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl border border-transparent focus:border-[#D1D1D6] focus:outline-none text-[#111113] placeholder-[#8E8E93] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-[#8E8E93] hover:text-[#111113]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className="py-16 text-center text-xs text-[#8E8E93] space-y-2">
                  <div className="w-5 h-5 border-2 border-[#111113] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Memuat catatan pribadi...</p>
                </div>
              ) : filteredNotes.length === 0 ? (
                /* Empty State */
                <div className="py-16 text-center max-w-sm mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E5EA] text-[#8E8E93] flex items-center justify-center mx-auto shadow-2xs">
                    <SquarePen size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#111113]">
                      {searchQuery ? 'Catatan Tidak Ditemukan' : 'Belum Ada Catatan'}
                    </h3>
                    <p className="text-xs text-[#8E8E93] leading-relaxed">
                      {searchQuery
                        ? 'Tidak ada catatan yang cocok dengan kata kunci pencarian.'
                        : 'Simpan renungan firman, isi khotbah, atau pokok doa pribadimu di sini.'}
                    </p>
                  </div>
                  {!searchQuery && (
                    <button
                      onClick={handleCreateNewNote}
                      className="px-4 py-2 rounded-full bg-[#111113] hover:bg-black text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <SquarePen size={13} />
                      <span>Buat Catatan Baru</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Grouped Notes Lists */
                <div className="space-y-4 pb-6">
                  {/* PINNED SECTION */}
                  {pinnedNotes.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                        <Pin size={11} className="fill-[#8E8E93]" />
                        <span>Dipatkan</span>
                      </div>

                      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-2xs divide-y divide-[#E5E5EA] relative">
                        {pinnedNotes.map((note) => renderNoteRow(note))}
                      </div>
                    </div>
                  )}

                  {/* UNPINNED SECTION */}
                  {unpinnedNotes.length > 0 && (
                    <div className="space-y-1.5">
                      {pinnedNotes.length > 0 && (
                        <div className="px-1 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                          Catatan
                        </div>
                      )}
                      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-2xs divide-y divide-[#E5E5EA] relative">
                        {unpinnedNotes.map((note) => renderNoteRow(note))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </main>

            {/* Bottom iOS Toolbar (Note count & Compose button) */}
            <div className="flex-none bg-[#F2F2F7]/95 backdrop-blur-md border-t border-[#E5E5EA] px-4 py-2.5 z-30">
              <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="w-8" />
                <span className="text-xs font-medium text-[#8E8E93]">
                  {notes.length === 0
                    ? 'Tidak ada catatan'
                    : `${notes.length} Catatan`}
                </span>
                <button
                  type="button"
                  onClick={handleCreateNewNote}
                  className="w-9 h-9 rounded-full bg-[#111113] hover:bg-black text-white flex items-center justify-center transition shadow-xs active:scale-95 cursor-pointer"
                  title="Tulis Catatan Baru"
                >
                  <SquarePen size={16} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* Bottom Global Navigation */}
            <Navigation />
          </>
        ) : (
          /* ================================================================= */
          /* VIEW B: NOTE EDITOR VIEW (APPLE NOTES CANVAS WITH RICH FORMATTING)*/
          /* ================================================================= */
          <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-200 relative">
            {/* Top Editor Toolbar */}
            <div className="flex-none bg-white/95 backdrop-blur-md border-b border-[#EAEAEB] px-3.5 sm:px-6 py-2.5 flex items-center justify-between z-20">
              {/* Back to Notes List */}
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#111113] hover:opacity-75 transition active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={18} strokeWidth={2.5} className="text-[#111113]" />
                <span>Catatan</span>
              </button>

              {/* Action Toolbar: Pin, Share, Delete, Done */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Save status badge */}
                <span className="text-[11px] text-[#8E8E93] mr-1 hidden sm:inline-block">
                  {saveStatus === 'saving' ? 'Menyimpan...' : 'Tersimpan'}
                </span>

                {/* Undo Button */}
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer ${
                    canUndo
                      ? 'hover:bg-[#F2F2F4] text-[#111113]'
                      : 'text-[#C7C7CC] opacity-40 cursor-not-allowed'
                  }`}
                  title="Urungkan (Undo)"
                >
                  <Undo2 size={15} />
                </button>

                {/* Redo Button */}
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer ${
                    canRedo
                      ? 'hover:bg-[#F2F2F4] text-[#111113]'
                      : 'text-[#C7C7CC] opacity-40 cursor-not-allowed'
                  }`}
                  title="Ulangi (Redo)"
                >
                  <Redo2 size={15} />
                </button>

                {/* Pin Toggle Button */}
                <button
                  type="button"
                  onClick={handleTogglePinInEditor}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer ${
                    isPinned
                      ? 'bg-amber-100 text-amber-800'
                      : 'hover:bg-[#F2F2F4] text-[#8E8E93] hover:text-[#111113]'
                  }`}
                  title={isPinned ? 'Lepas Sematan' : 'Sematkan Catatan'}
                >
                  <Pin size={14} className={isPinned ? 'fill-amber-600' : ''} />
                </button>

                {/* Share / Copy Button */}
                <button
                  type="button"
                  onClick={handleShareNote}
                  className="w-8 h-8 rounded-full hover:bg-[#F2F2F4] text-[#8E8E93] hover:text-[#111113] flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="Bagikan atau Salin Catatan"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(activeNote.id)}
                  className="w-8 h-8 rounded-full hover:bg-rose-50 text-[#8E8E93] hover:text-rose-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="Hapus Catatan"
                >
                  <Trash2 size={14} />
                </button>

                {/* Done Button */}
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="px-3 py-1 rounded-full bg-[#111113] hover:bg-black text-white text-xs font-semibold transition active:scale-95 cursor-pointer ml-1 shadow-2xs"
                >
                  Selesai
                </button>
              </div>
            </div>

            {/* Note Canvas / Writing Area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-10 py-4 space-y-3 pb-36">
              {/* Full iOS Date Header */}
              <div className="text-center">
                <span className="text-[11px] text-[#8E8E93] font-mono tracking-tight select-none">
                  {formatFullNoteDate(activeNote.updated_at || activeNote.created_at)}
                </span>
              </div>

              {/* Title Input */}
              <div>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleInput}
                  onChange={handleTitleChange}
                  placeholder="Judul Catatan"
                  className="w-full text-xl sm:text-2xl font-bold text-[#111113] placeholder-[#A1A1A6] focus:outline-none bg-transparent tracking-tight leading-snug"
                />
              </div>

              {/* Rich ContentEditable Canvas (Apple Notes style) */}
              <div className="pt-1">
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleEditorInput}
                  onClick={handleEditorClick}
                  onKeyDown={handleEditorKeyDown}
                  onBeforeInput={handleEditorBeforeInput}
                  onSelect={updateActiveFormats}
                  onKeyUp={updateActiveFormats}
                  onMouseUp={updateActiveFormats}
                  onTouchEnd={updateActiveFormats}
                  data-placeholder="Tulis renungan firman, catatan khotbah, atau pokok doa pribadimu di sini..."
                  className={`w-full text-sm sm:text-base leading-relaxed text-[#1C1C1E] focus:outline-none bg-transparent min-h-[360px] pb-12 selection:bg-amber-200/80 [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-[#111113] [&_h2]:tracking-tight [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h2]:leading-snug [&_b]:font-bold [&_strong]:font-bold ${
                    fontFamily === 'serif'
                      ? 'font-serif'
                      : fontFamily === 'mono'
                      ? 'font-mono text-[13.5px]'
                      : 'font-sans'
                  } empty:before:content-[attr(data-placeholder)] empty:before:text-[#A1A1A6] empty:before:pointer-events-none`}
                />
              </div>
            </div>

            {/* ============================================================= */}
            {/* iOS KEYBOARD ACCESSORY TOOLBAR (Docks directly above keyboard) */}
            {/* ============================================================= */}
            <div
              className={`flex-none bg-[#F9F9FA]/98 backdrop-blur-xl border-t border-[#EAEAEB] px-3.5 sm:px-6 py-2 flex items-center justify-between text-xs z-30 relative shadow-[0_-4px_12px_rgba(0,0,0,0.04)] ${
                isKeyboardOpen ? 'pb-2' : 'pb-[max(8px,env(safe-area-inset-bottom))]'
              }`}
            >

            {/* Left format tools: bold, italic, underline, checklist, pointer, stabilo */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {/* Bold */}
              <button
                type="button"
                onMouseDown={triggerCmd(() => handleToggleInlineFormat('bold', ['B', 'STRONG']))}
                onTouchStart={triggerCmd(() => handleToggleInlineFormat('bold', ['B', 'STRONG']))}
                className={`p-2 rounded-xl transition active:scale-95 shrink-0 cursor-pointer ${
                  activeFormats.bold
                    ? 'bg-[#111113] text-white shadow-xs'
                    : 'hover:bg-[#F2F2F4] text-[#111113]'
                }`}
                title="Tebal (Bold)"
              >
                <Bold size={15} strokeWidth={2.5} />
              </button>

              {/* Italic */}
              <button
                type="button"
                onMouseDown={triggerCmd(() => handleToggleInlineFormat('italic', ['I', 'EM']))}
                onTouchStart={triggerCmd(() => handleToggleInlineFormat('italic', ['I', 'EM']))}
                className={`p-2 rounded-xl transition active:scale-95 shrink-0 cursor-pointer ${
                  activeFormats.italic
                    ? 'bg-[#111113] text-white shadow-xs'
                    : 'hover:bg-[#F2F2F4] text-[#111113]'
                }`}
                title="Miring (Italic)"
              >
                <Italic size={15} />
              </button>

              {/* Underline */}
              <button
                type="button"
                onMouseDown={triggerCmd(() => handleToggleInlineFormat('underline', ['U']))}
                onTouchStart={triggerCmd(() => handleToggleInlineFormat('underline', ['U']))}
                className={`p-2 rounded-xl transition active:scale-95 shrink-0 cursor-pointer ${
                  activeFormats.underline
                    ? 'bg-[#111113] text-white shadow-xs'
                    : 'hover:bg-[#F2F2F4] text-[#111113]'
                }`}
                title="Garis Bawah (Underline)"
              >
                <Underline size={15} />
              </button>

              {/* Checklist */}
              <button
                type="button"
                onMouseDown={triggerCmd(handleInsertChecklist)}
                onTouchStart={triggerCmd(handleInsertChecklist)}
                className="p-2 rounded-xl hover:bg-[#F2F2F4] text-[#111113] transition active:scale-95 shrink-0 cursor-pointer"
                title="Daftar Centang (Checklist)"
              >
                <CheckSquare size={15} />
              </button>

              {/* Bullet List */}
              <button
                type="button"
                onMouseDown={triggerCmd(() => execCmd('insertUnorderedList'))}
                onTouchStart={triggerCmd(() => execCmd('insertUnorderedList'))}
                className="p-2 rounded-xl hover:bg-[#F2F2F4] text-[#111113] transition active:scale-95 shrink-0 cursor-pointer"
                title="Daftar Poin"
              >
                <List size={15} />
              </button>

              {/* Stabilo Highlight */}
              <button
                type="button"
                onMouseDown={triggerCmd(handleToggleHighlight)}
                onTouchStart={triggerCmd(handleToggleHighlight)}
                className={`p-2 rounded-xl transition active:scale-95 shrink-0 cursor-pointer ${
                  activeFormats.highlight
                    ? 'bg-amber-300 text-amber-950 font-bold shadow-xs ring-1 ring-amber-400'
                    : 'hover:bg-amber-100 text-amber-800'
                }`}
                title="Sorotan Stabilo Kuning"
              >
                <Highlighter size={15} />
              </button>
            </div>

            {/* Right: Word count & Dismiss keyboard / New note */}
            <div className="flex items-center gap-2 text-[11px] text-[#8E8E93] shrink-0 ml-2">
              <span className="hidden sm:inline">
                {wordCount} kata
              </span>
              {isKeyboardOpen ? (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (typeof document !== 'undefined') {
                      (document.activeElement as HTMLElement)?.blur();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#E5E5EA] hover:bg-[#DCDCE0] text-[#111113] font-semibold text-xs transition active:scale-95 cursor-pointer shadow-2xs"
                  title="Tutup Keyboard"
                >
                  Selesai
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateNewNote}
                  className="inline-flex items-center gap-1 font-semibold text-[#111113] hover:opacity-75 transition active:scale-95 cursor-pointer px-2 py-1"
                  title="Buat Catatan Baru"
                >
                  <SquarePen size={14} />
                  <span className="hidden sm:inline">Baru</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-xs w-full p-5 text-center space-y-4 shadow-xl border border-[#E5E5EA]">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#111113]">Hapus Catatan Ini?</h4>
                <p className="text-xs text-[#8E8E93] leading-relaxed">
                  Catatan ini akan dihapus secara permanen dari akun pribadimu.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="py-2 px-3 rounded-xl border border-[#DCDCE0] text-xs font-semibold text-[#111113] hover:bg-[#F2F2F3] transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteNote(deleteConfirmId)}
                  className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  // Helper row renderer for notes list
  function renderNoteRow(note: Note) {
    const cleanContent = note.content
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<\/div>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const firstLinePreview = cleanContent || '(Tidak ada teks tambahan)';
    const isMenuOpen = menuOpenNoteId === note.id;

    return (
      <div
        key={note.id}
        onClick={() => handleOpenNote(note)}
        className="group relative first:rounded-t-2xl last:rounded-b-2xl px-4 py-3 hover:bg-[#F9F9FB] cursor-pointer transition flex items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            {note.pinned && (
              <Pin size={11} className="fill-[#111113] text-[#111113] shrink-0" />
            )}
            <h4 className="text-sm font-semibold text-[#111113] truncate tracking-tight">
              {note.title.trim() || 'Catatan Baru'}
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
            <span className="shrink-0 font-medium text-[#111113]/70">
              {formatNoteDate(note.updated_at || note.created_at)}
            </span>
            <span className="truncate">{firstLinePreview}</span>
          </div>
        </div>

        {/* 3-dots action menu */}
        <div className="relative shrink-0 flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpenNoteId(isMenuOpen ? null : note.id);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer ${
              isMenuOpen
                ? 'bg-[#EAEAEB] text-[#111113]'
                : 'text-[#8E8E93] hover:text-[#111113] hover:bg-[#EAEAEB]/70'
            }`}
            title="Pilihan Catatan"
          >
            <MoreVertical size={16} />
          </button>

          {/* Action Menu Dropdown */}
          {isMenuOpen && (
            <>
              {/* Invisible backdrop to dismiss menu */}
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenNoteId(null);
                }}
              />
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-9 z-50 min-w-[160px] bg-white/98 backdrop-blur-xl border border-[#E5E5EA] rounded-2xl shadow-xl py-1.5 text-xs text-[#111113] animate-in fade-in zoom-in-95 duration-150 space-y-0.5"
              >
                {/* Salin */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyNoteFromList(note);
                    setMenuOpenNoteId(null);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#F2F2F4] text-left transition cursor-pointer font-medium"
                >
                  {copiedNoteId === note.id ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} className="text-[#8E8E93]" />
                  )}
                  <span>{copiedNoteId === note.id ? 'Tersalin' : 'Salin'}</span>
                </button>

                {/* Share */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareNoteFromList(note);
                    setMenuOpenNoteId(null);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#F2F2F4] text-left transition cursor-pointer font-medium"
                >
                  <Share2 size={14} className="text-[#8E8E93]" />
                  <span>Share</span>
                </button>

                {/* Sematkan / Lepas Sematan */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePinFromList(e, note);
                    setMenuOpenNoteId(null);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#F2F2F4] text-left transition cursor-pointer font-medium"
                >
                  <Pin size={14} className={note.pinned ? 'fill-amber-600 text-amber-600' : 'text-[#8E8E93]'} />
                  <span>{note.pinned ? 'Lepas Sematan' : 'Sematkan'}</span>
                </button>

                <div className="h-[1px] bg-[#E5E5EA] my-1" />

                {/* Hapus */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(note.id);
                    setMenuOpenNoteId(null);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-rose-50 text-rose-600 text-left transition cursor-pointer font-medium"
                >
                  <Trash2 size={14} className="text-rose-600" />
                  <span>Hapus</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}
