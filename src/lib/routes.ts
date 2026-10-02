/** Static-export-safe Personal DNA path for GitHub Pages / Netlify. */
export function personalResultHref(participantId: string): string {
  const id = encodeURIComponent(participantId);
  return `/r/_/?participantId=${id}`;
}
