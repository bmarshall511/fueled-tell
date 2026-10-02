import type { ClipboardEvent } from 'react';

/** A pasted block with 2+ non-empty lines is almost certainly a whole list. */
export const looksLikeList = (text: string) => text.split(/\r?\n/).filter((l) => l.trim()).length >= 2;

/** onPaste handler for any name or entry field: a pasted list opens the paste sheet instead of landing in one field. */
export const pasteListInto =
  (open: (text: string) => void) =>
  (e: ClipboardEvent): void => {
    const text = e.clipboardData.getData('text');
    if (!looksLikeList(text)) return;
    e.preventDefault();
    open(text);
  };
