import { SearchResult } from "../types";

// Access keys from environment variables
const getTavilyKey = () => process.env.TAVILY_API_KEY || "";
const getExaKey = () => process.env.EXA_API_KEY || "";

/**
 * STRATEGY: Exa (Primary)
 * Optimized for semantic relevance, returning highlights and neural matches.
 * Uses type: 'auto' as recommended by Scira docs for balanced performance.
 */
const searchExa = async (query: string, numResults: number = 8): Promise<SearchResult[]> => {
    const apiKey = getExaKey();
    if (!apiKey) return [];

    try {
        const response = await fetch("https://api.exa.ai/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            },
            body: JSON.stringify({
                query: query,
                numResults: numResults,
                type: "auto", // Neural search (Scira standard)
                useAutoprompt: true,
                contents: {
                    text: false, 
                    highlights: {
                        numSentences: 2, // Concise snippets for RAG
                        query: query
                    }
                }
            }),
        });

        if (!response.ok) return [];
        const data = await response.json();

        return (data.results || []).map((item: any) => {
            let hostname = 'Source';
            try { hostname = new URL(item.url).hostname.replace('www.', ''); } catch (e) {}
            return {
                title: item.title || hostname,
                link: item.url,
                snippet: item.highlights?.[0] || item.text?.substring(0, 250) || "",
                displayLink: hostname,
                publishedDate: item.publishedDate
            };
        });
    } catch (e) {
        console.warn("Exa search failed", e);
        return [];
    }
};

/**
 * STRATEGY: Tavily (Fallback/News)
 * Optimized for real-time news and structured answers.
 * Uses search_depth: 'advanced' and include_answer: true.
 */
const searchTavily = async (query: string, numResults: number = 8): Promise<SearchResult[]> => {
    const apiKey = getTavilyKey();
    if (!apiKey) return [];

    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: "basic", // Basic for speed in multi-query, advanced for single deep
                include_answer: true,
                max_results: numResults,
                topic: "general"
            }),
        });

        if (!response.ok) return [];
        const data = await response.json();

        return (data.results || []).map((item: any) => {
            let hostname = 'Source';
            try { hostname = new URL(item.url).hostname.replace('www.', ''); } catch (e) {}
            return {
                title: item.title,
                link: item.url,
                snippet: item.content,
                displayLink: hostname,
                publishedDate: item.published_date
            };
        });
    } catch (e) {
        console.warn("Tavily search failed", e);
        return [];
    }
};

/**
 * ENGINE: Parallel Multi-Search (Scira Architecture)
 * 1. Takes a single query
 * 2. Executes in parallel against Exa and Tavily (if keys exist)
 * 3. Deduplicates by URL and Domain
 * 4. Aggregates into a dense result set (max 10)
 */
export const performMultiSearch = async (query: string): Promise<SearchResult[]> => {
    const exaKey = getExaKey();
    const tavilyKey = getTavilyKey();
    
    const promises: Promise<SearchResult[]>[] = [];

    // Parallel Execution: 5 results from each provider
    if (exaKey) {
        promises.push(searchExa(query, 5)); 
    }
    if (tavilyKey) {
        promises.push(searchTavily(query, 5));
    }
    
    if (promises.length === 0) return [];

    const resultsArray = await Promise.all(promises);
    const flatResults = resultsArray.flat();

    // Deduplication & Diversity Filtering
    const seenUrls = new Set<string>();
    const seenDomains = new Map<string, number>(); // Count results per domain
    const uniqueResults: SearchResult[] = [];

    for (const res of flatResults) {
        // 1. URL Dedup
        if (seenUrls.has(res.link)) continue;
        
        // 2. Domain Diversity (Cap max 2 results per domain)
        const domain = res.displayLink;
        const domainCount = seenDomains.get(domain) || 0;
        if (domainCount >= 2) continue;

        seenUrls.add(res.link);
        seenDomains.set(domain, domainCount + 1);
        uniqueResults.push(res);
    }

    // Limit total context to 10 high quality results
    return uniqueResults.slice(0, 10);
};

// Legacy single search export (mapped to multi-search engine)
export const searchFast = async (query: string) => {
    const results = await performMultiSearch(query);
    return { results };
};

export const searchNews = async (query: string) => {
    // For news specifically, Tavily often performs better on real-time
    // But sticking to the unified engine for consistency unless specified
    return searchFast(query);
};
