import { SearchResult } from "../types";

const TAVILY_API_KEY = "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";
const OLLAMA_API_KEY = "b5bbc8deeef54c5bbd5700d88a2bf8c1.uOWGnsg4JUxbZPUrc90pLGBv";

// NOTE: If you have Google Custom Search JSON API keys, you can replace the implementation below.
// Currently configured to "only use Tavily" as requested.

export const searchOllama = async (query: string): Promise<{ results: SearchResult[]; images: string[] }> => {
  try {
    const response = await fetch("https://ollama.com/api/web_search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OLLAMA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        max_results: 10
      }),
    });

    if (!response.ok) {
      // Fallback to empty if API fails
      console.warn(`Ollama API Error: ${response.status}`);
      return { results: [], images: [] };
    }

    const data = await response.json();
    
    // Map Ollama results to our SearchResult interface
    const results = (data.results || []).map((item: any) => {
        let hostname = 'Ollama Search';
        try {
            hostname = new URL(item.url).hostname;
        } catch (e) {}

        return {
            title: item.title,
            link: item.url,
            snippet: item.content,
            displayLink: hostname,
            publishedDate: undefined // Ollama API response doesn't strictly provide date in basic format
        };
    });

    return { results, images: [] };

  } catch (error) {
    console.error("Ollama Search Error:", error);
    return { results: [], images: [] };
  }
};

export const searchWeb = async (query: string, mode: string = 'web'): Promise<{ results: SearchResult[]; images: string[] }> => {
  try {
    let includeDomains: string[] | undefined = undefined;
    let topic = "general";
    let searchDepth = "basic";

    // Mode handling
    if (mode === 'x') {
      includeDomains = ['twitter.com', 'x.com'];
    } else if (mode === 'reddit') {
      includeDomains = ['reddit.com'];
    } else if (mode === 'research') {
      searchDepth = "advanced";
    }

    // Append fact check terms if needed
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
        include_images: true,
        include_answer: false,
        max_results: 10, // Increased to 10 to ensure ~25 unique sources across 5 queries
        include_domains: includeDomains,
        topic: topic
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Tavily API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    const globalImages = data.images || [];

    const results = data.results?.map((item: any) => {
      let hostname = '';
      try {
        hostname = new URL(item.url).hostname;
      } catch (e) {
        hostname = 'Source';
      }

      return {
        title: item.title,
        link: item.url,
        snippet: item.content,
        displayLink: hostname,
        publishedDate: item.published_date || undefined
      };
    }) || [];

    // Filter out very short snippets or irrelevant results if needed
    // For now, we return all robust results from Tavily

    return { results, images: globalImages };

  } catch (error) {
    console.error("Tavily Web Search Error:", error);
    return { results: [], images: [] };
  }
};

export const searchNews = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        topic: "news",
        days: 3, 
        include_images: true, 
        max_results: 15,
      }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`News API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    const globalImages = data.images || [];

    return data.results?.map((item: any, index: number) => {
      let hostname = '';
      try {
        hostname = new URL(item.url).hostname;
      } catch (e) {
        hostname = 'News';
      }

      let imageUrl = item.image_url;
      // Fallback to global images list if specific item image is missing
      if (!imageUrl && globalImages.length > index) {
        imageUrl = globalImages[index];
      }

      return {
        title: item.title,
        link: item.url,
        snippet: item.content,
        displayLink: hostname,
        publishedDate: item.published_date || "Recently",
        image: imageUrl || undefined 
      };
    }) || [];
  } catch (error) {
    console.error("News Search Error:", error);
    return [];
  }
};