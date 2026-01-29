
import { SearchResult } from "../types";

const TAVILY_API_KEY = "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";
const EXA_API_KEY = "52f53d72-83fc-46a4-9c8b-eff326dac3f6";

// Heuristic to detect if a user likely wants to see images
const isVisualIntent = (query: string): boolean => {
  const q = query.toLowerCase();
  const visualKeywords = [
    'image', 'photo', 'picture', 'pic', 'show me', 'look like', 'appearance', 
    'outfit', 'style', 'design', 'logo', 'color', 'diagram', 'sketch', 
    'drawing', 'render', 'concept', 'map', 'chart', 'graph', 'infographic'
  ];
  if (visualKeywords.some(k => q.includes(k))) return true;
  return false;
};

// Optimized for speed < 1s using Exa
export const searchFast = async (query: string): Promise<{ results: SearchResult[]; images: string[] }> => {
  try {
    const visual = isVisualIntent(query);

    // If clearly visual, use Tavily which is better for image retrieval
    if (visual) {
        return searchWeb(query, 'fast-visual');
    }

    // Exa AI - Ultra Fast Neural Retrieval
    // Retrieving 6 results (optimized for RAG context window vs latency)
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": EXA_API_KEY,
      },
      body: JSON.stringify({
        query: query,
        numResults: 6, 
        type: "neural", // "keyword" is faster but "neural" is smarter for RAG grounding.
        useAutoprompt: true, 
        contents: {
          text: true,
          highlights: true 
        }
      }),
    });

    if (!response.ok) {
       // Fail fast to fallback
       return searchWeb(query, 'fast-fallback');
    }

    const data = await response.json();
    
    const results = data.results?.map((item: any) => {
        let hostname = 'Source';
        try { hostname = new URL(item.url).hostname; } catch (e) {}
        
        // Prefer highlight, fallback to text slice
        // RAG Optimization: Highlights are better for grounding than full text in fast mode
        const snippet = item.highlights?.[0] || item.text?.substring(0, 300) || "";

        return {
            title: item.title || hostname,
            link: item.url,
            snippet: snippet,
            displayLink: hostname,
            publishedDate: item.publishedDate
        };
    }) || [];

    return { results, images: [] };

  } catch (error) {
    return searchWeb(query, 'fast-fallback');
  }
};

export const searchWeb = async (query: string, mode: string = 'web'): Promise<{ results: SearchResult[]; images: string[] }> => {
  try {
    let includeDomains: string[] | undefined = undefined;
    let topic = "general";
    let searchDepth = "basic"; 
    let includeImages = true;
    let maxResults = 10; // Default 10 sources

    if (mode === 'x') {
      includeDomains = ['twitter.com', 'x.com'];
    } else if (mode === 'reddit') {
      includeDomains = ['reddit.com'];
    } else if (mode === 'videos') {
       includeDomains = ['youtube.com', 'vimeo.com'];
    } else if (mode === 'research') {
      searchDepth = "advanced";
      maxResults = 15;
    } else if (mode === 'fast-visual') {
        maxResults = 10;
        includeImages = true;
    } else if (mode === 'fast-fallback') {
        includeImages = false; 
        maxResults = 5;
        searchDepth = "basic";
    }

    let searchString = query;
    if (mode === 'factcheck') {
       searchString = `${query} fact check snopes politifact`;
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchString,
        search_depth: searchDepth,
        include_images: includeImages, 
        max_results: maxResults, 
        include_domains: includeDomains,
        topic: topic
      }),
    });

    if (!response.ok) throw new Error("Tavily Error");

    const data = await response.json();
    const globalImages = data.images || [];

    const results = data.results?.map((item: any) => {
      let hostname = 'Source';
      try { hostname = new URL(item.url).hostname; } catch (e) {}

      return {
        title: item.title,
        link: item.url,
        snippet: item.content,
        displayLink: hostname,
        publishedDate: item.published_date || undefined
      };
    }) || [];

    return { results, images: globalImages };

  } catch (error) {
    console.error("Search Error:", error);
    return { results: [], images: [] };
  }
};

export const searchNews = searchWeb;

export const getSuggestions = async (query: string): Promise<string[]> => {
  if (!query || query.trim().length < 2) return [];
  try {
    // Using Wikipedia OpenSearch as a reliable, CORS-friendly source for general knowledge autocomplete
    const response = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&origin=*&format=json`);
    const data = await response.json();
    // Index 1 contains the suggestions
    return data[1] || [];
  } catch (error) {
    console.error("Suggestion Error:", error);
    return [];
  }
};
