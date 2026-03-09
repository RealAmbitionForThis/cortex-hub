export async function searchWeb(query, maxResults = 5) {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CortexHub/1.0)' },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const results = [];
    const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;

    while ((match = resultRegex.exec(html)) && results.length < maxResults) {
      const url = decodeURIComponent(match[1].replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, '').split('&')[0]);
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const snippet = match[3].replace(/<[^>]+>/g, '').trim();
      if (url && title) results.push({ url, title, snippet });
    }

    return results;
  } catch (error) {
    return [{ error: error.message }];
  }
}

export async function fetchAndSummarize(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CortexHub/1.0)' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return { error: `HTTP ${res.status}` };

    const html = await res.text();
    // Strip tags, scripts, styles
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000);

    return { url, text };
  } catch (error) {
    return { error: error.message };
  }
}
