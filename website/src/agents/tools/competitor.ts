/**
 * Crawl a competitor page and grab the raw text.
 */
export async function fetchCompetitorData(url: string): Promise<string> {
  return `Content from ${url}`;
}

/**
 * Summarize competitor intel with a dash of snark.
 */
export async function summarizeCompetitor(data: string): Promise<string> {
  return `${data} — seems derivative but shiny.`;
}
