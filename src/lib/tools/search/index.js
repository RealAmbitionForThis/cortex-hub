import { searchWeb, fetchAndSummarize } from '@/lib/search/web';

export const searchTools = [
  {
    name: 'search.web',
    description: 'Search the web using DuckDuckGo',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        max_results: { type: 'number', description: 'Max results (default 5)' },
      },
      required: ['query'],
    },
    handler: async ({ query, max_results }) => {
      const results = await searchWeb(query, max_results);
      return { results };
    },
  },
  {
    name: 'search.read_url',
    description: 'Fetch and extract text content from a URL',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch' },
      },
      required: ['url'],
    },
    handler: async ({ url }) => fetchAndSummarize(url),
  },
];
