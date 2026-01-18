import { SearchResult } from "../types";

const TAVILY_API_KEY = "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";

// Using Tavily basic search for "Fast" mode as it's reliable and quick
export const searchFast = async (query: string): Promise<{ results: SearchResult[]; images: string[] }> => {
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: "basic", // Basic is faster than advanced
        max_results: 5,
        include_images: false,
        include_answer: false
      }),
    });

    if (!response.ok) {
       return { results: [], images: [] };
    }

    const data = await response.json();
    
    const results = data.results?.map((item: any) => {
        let hostname = 'Source';
        try { hostname = new URL(item.url).hostname; } catch (e) {}
        return {
            title: item.title,
            link: item.url,
            snippet: item.content,
            displayLink: hostname,
        };
    }) || [];

    return { results, images: [] };

  } catch (error) {
    console.error("Fast Search Error:", error);
    return { results: [], images: [] };
  }
};

// Kept for compatibility but points to the optimized fast search
export const searchOllama = searchFast;

export const searchWeb = async (query: string, mode: string = 'web'): Promise<{ results: SearchResult[]; images: string[] }> => {
  try {
    let includeDomains: string[] | undefined = undefined;
    let topic = "general";
    let searchDepth = "basic";

    // Mode handling for special cases only
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
        include_images: true, // Always include images for universal mode
        include_answer: false,
        max_results: 10, 
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