import { useEffect } from 'react';

interface UseKeyboardShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: () => void;
  enabled?: boolean;
}

/**
 * Hook untuk menambahkan keyboard shortcut
 * 
 * @example
 * useKeyboardShortcut({
 *   key: 'k',
 *   metaKey: true,
 *   callback: () => console.log('Command+K pressed')
 * });
 */
export function useKeyboardShortcut({
  key,
  ctrlKey = false,
  metaKey = false,
  shiftKey = false,
  altKey = false,
  callback,
  enabled = true,
}: UseKeyboardShortcutOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the pressed key matches
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      // Check modifier keys
      const ctrlMatch = ctrlKey ? event.ctrlKey : !event.ctrlKey;
      const metaMatch = metaKey ? event.metaKey : !event.metaKey;
      const shiftMatch = shiftKey ? event.shiftKey : !event.shiftKey;
      const altMatch = altKey ? event.altKey : !event.altKey;

      // Only trigger if all conditions match
      if (ctrlMatch && metaMatch && shiftMatch && altMatch) {
        // Don't trigger if user is typing in an input/textarea
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }

        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, ctrlKey, metaKey, shiftKey, altKey, callback, enabled]);
}

