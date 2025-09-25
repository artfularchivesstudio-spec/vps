/**
 * 📝 generateSlug - convert a title into a URL-friendly slug.
 * Because SEO goblins love tidy breadcrumbs 🥖.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

/**
 * ✂️ generateExcerpt - snip content down to 160 characters.
 * Keeps things brief so the attention-span sprites stay happy 🧚.
 */
export function generateExcerpt(content: string): string {
  const plainText = content.replace(/<[^>]*>/g, '');
  return plainText.length > 160 ? plainText.substring(0, 157) + '...' : plainText;
}

/**
 * 🌍 getTextLanguages - list languages with available translations.
 * Starts with English, then sprinkles in any translated tongues 🎤.
 */
export function getTextLanguages(post: { content_translations?: Record<string, string> | null }): string[] {
  const langs = new Set<string>(['en']);
  if (post.content_translations) {
    Object.keys(post.content_translations).forEach(l => langs.add(l));
  }
  return Array.from(langs);
}

/**
 * 🎧 getAudioLanguages - gather completed audio languages from jobs.
 * Merges the choir so every finished voice takes a bow 🎼.
 */
export function getAudioLanguages(jobs: Array<{ completed_languages?: string[] | null; audio_urls?: Record<string, string> }>): string[] {
  const langs = new Set<string>();
  for (const job of jobs) {
    job.completed_languages?.forEach(l => langs.add(l));
    if (job.audio_urls) {
      Object.keys(job.audio_urls).forEach(l => langs.add(l));
    }
  }
  return Array.from(langs);
}
