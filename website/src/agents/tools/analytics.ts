/**
 * Fetch raw engagement metrics from a platform.
 */
export async function fetchMetrics(platform: string): Promise<{ likes: number; shares: number }> {
  return { likes: 42, shares: 7 };
}

/**
 * Analyze metrics and provide a sassy insight.
 */
export async function analyzeMetrics(metrics: { likes: number; shares: number }): Promise<string> {
  return metrics.likes > metrics.shares
    ? 'Your fans double-tap more than they share. Lazy thumbs!'
    : 'Sharing is caring — keep feeding them. 🧁';
}
