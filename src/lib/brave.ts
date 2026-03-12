/** Brave Search helper — returns top result snippets as plain text */
export async function braveSearch(query: string, count = 5): Promise<string> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return '';

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': apiKey },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return '';
    const data = await res.json() as { web?: { results?: Array<{ title: string; description: string; url: string }> } };
    const results = data.web?.results ?? [];
    return results
      .map(r => `[${r.title}](${r.url})\n${r.description}`)
      .join('\n\n');
  } catch {
    return '';
  }
}
