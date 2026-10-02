/** The URL phones open: same origin, room in the query (keeps ?transport=local for same-browser demos). */
export function joinUrl(code: string): string {
  const url = new URL('/play', window.location.origin);
  url.searchParams.set('room', code);
  if (new URLSearchParams(window.location.search).get('transport') === 'local') url.searchParams.set('transport', 'local');
  return url.toString();
}

/** The join URL as it's printed on screen: no protocol, no query. */
export const displayUrl = (url: string): string => url.replace(/^https?:\/\//, '').split('?')[0] ?? url;
