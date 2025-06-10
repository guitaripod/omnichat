interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  snippet?: string;
}

interface BraveSearchResponse {
  web?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      extra_snippets?: string[];
    }>;
  };
}

export class BraveSearchService {
  private apiKey: string;
  private baseUrl = 'https://api.search.brave.com/res/v1/web/search';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Brave Search API key is required');
    }
    this.apiKey = apiKey;
  }

  async search(query: string, limit: number = 5): Promise<BraveSearchResult[]> {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.append('q', query);
      url.searchParams.append('count', limit.toString());

      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.status} - ${response.statusText}`);
      }

      const data = (await response.json()) as BraveSearchResponse;

      if (!data.web?.results) {
        return [];
      }

      return data.web.results.map((result) => ({
        title: result.title,
        url: result.url,
        description: result.description,
        snippet: result.extra_snippets?.[0] || result.description,
      }));
    } catch (error) {
      console.error('Brave Search error:', error);
      throw new Error(
        `Failed to perform web search: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  formatResultsForChat(results: BraveSearchResult[]): string {
    if (results.length === 0) {
      return 'No search results found.';
    }

    return `Web search results:\n\n${results
      .map(
        (result, index) =>
          `${index + 1}. **${result.title}**\n   URL: ${result.url}\n   ${result.snippet || result.description}`
      )
      .join('\n\n')}`;
  }
}
