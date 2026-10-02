import { useEffect } from 'react';
import { UI_COPY } from '../copy';

/** Sets the tab title as "<title> · Tell" (or just "Tell"). */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ${UI_COPY.appName}` : UI_COPY.appName;
  }, [title]);
}
