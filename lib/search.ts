import { SearchResult } from "../types";

// Access keys from environment variables
const getTavilyKey = () => process.env.TAVILY_API_KEY || "";
const getExaKey = () => process.env.EXA_API_KEY || "";
const getFirecrawlKey = () => process.env.FIRECRAWL_API_KEY || "";
const getSupadataKey = () => process.env.SUPADATA_API_KEY || "";
const getValyuKey = () => process.env.VALYU_API_KEY || "";
const getSupermemoryKey = () => process.env.SUPERMEMORY_API_KEY || "";

/**
 * STRATEGY: Firecrawl (Deep Crawl & Search)
 */
const searchFirecrawl = async (query: string, numResults: number = 5): Promise<SearchResult[]> => {
    const apiKey = getFirecrawlKey();
    if (!apiKey) return [];

    try {
        const response = await fetch("https://api.firecrawl.dev/v0/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                query: query,
                limit: numResults,
                pageOptions: {
                    fetchPageContent: true // Get full content for RAG
                }
            }),
        });

        if (!response.ok) return [];
        const data = await response.json();

        return (data.data || []).map((item: any) => ({
            title: item.metadata?.title || item.title || "Web Result",
            link: item.url,
            snippet: item.markdown?.substring(0, 300) || item.content?.substring(0, 300) || "",
            displayLink: new URL(item.url).hostname,
            type: 'web'
        }));
    } catch (e) {
        console.warn("Firecrawl search failed", e);
        return [];
    }
};

/**
 * STRATEGY: Supadata (YouTube Transcript Search)
 */
const searchSupadata = async (query: string): Promise<SearchResult[]> => {
    const apiKey = getSupadataKey();
    if (!apiKey) return [];

    try {
        // Supadata usually takes a video ID or channel, but for search we might need a different endpoint
        // or use their YouTube search wrapper if available. 
        // Assuming a standard search endpoint for this implementation:
        const response = await fetch(`https://api.supadata.ai/v1/youtube/search?query=${encodeURIComponent(query)}`, {
            headers: { "x-api-key": apiKey }
        });

        if (!response.ok) return [];
        const data = await response.json();

        return (data.videos || []).map((item: any) => ({
            title: item.title,
            link: `https://www.youtube.com/watch?v=${item.videoId}`,
            snippet: item.description || "No description available",
            displayLink: "youtube.com",
            type: 'video',
            image: item.thumbnailUrl
        }));
    } catch (e) {
        console.warn("Supadata search failed", e);
        return [];
    }
};

/**
 * STRATEGY: Valyu (Financial & General Research)
 */
const searchValyu = async (query: string): Promise<SearchResult[]> => {
    const apiKey = getValyuKey();
    if (!apiKey) return [];

    try {
        const response = await fetch(`https://api.valyu.ai/v1/search?q=${encodeURIComponent(query)}`, {
            headers: { "Authorization": `Bearer ${apiKey}` }
        });

        if (!response.ok) return [];
        const data = await response.json();

        return (data.results || []).map((item: any) => ({
            title: item.title,
            link: item.url,
            snippet: item.snippet || item.summary,
            displayLink: new URL(item.url).hostname,
            type: 'finance'
        }));
    } catch (e) {
        console.warn("Valyu search failed", e);
        return [];
    }
};

/**
 * STRATEGY: Valyu Deep Research (Long-running)
 */
export const searchValyuDeep = async (query: string): Promise<SearchResult[]> => {
    const apiKey = getValyuKey();
    if (!apiKey) return [];

    try {
        // 1. Create Task
        const createResponse = await fetch("https://api.valyu.ai/v1/deepresearch", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: query,
                mode: "standard"
            })
        });

        if (!createResponse.ok) {
            console.warn("Valyu Deep Research create failed");
            return [];
        }

        const task = await createResponse.json();
        const taskId = task.deepresearch_id;

        // 2. Poll for Completion
        const maxRetries = 60; // 5s * 60 = 5 minutes max
        let attempts = 0;

        while (attempts < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
            attempts++;

            const pollResponse = await fetch(`https://api.valyu.ai/v1/deepresearch/${taskId}`, {
                headers: { "Authorization": `Bearer ${apiKey}` }
            });

            if (!pollResponse.ok) continue;
            const result = await pollResponse.json();

            if (result.status === 'completed') {
                const sources: SearchResult[] = (result.sources || []).map((s: any) => ({
                    title: s.title || "Deep Research Source",
                    link: s.url,
                    snippet: s.snippet || s.summary || "",
                    displayLink: new URL(s.url).hostname,
                    type: 'finance'
                }));

                if (result.output) {
                    sources.unshift({
                        title: "Deep Research Report",
                        link: "#",
                        snippet: result.output,
                        displayLink: "Valyu AI",
                        type: 'finance'
                    });
                }
                return sources;
            } else if (result.status === 'failed' || result.status === 'cancelled') {
                return [];
            }
        }
        
        return [];
    } catch (e) {
        console.warn("Valyu Deep Research error", e);
        return [];
    }
};

/**
 * STRATEGY: Supermemory (Personal Knowledge Base)
 */
const searchSupermemory = async (query: string): Promise<SearchResult[]> => {
    const apiKey = getSupermemoryKey();
    if (!apiKey) return [];

    try {
        const response = await fetch("https://api.supermemory.ai/v1/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) return [];
        const data = await response.json();

        return (data.results || []).map((item: any) => ({
            title: item.title || "Memory",
            link: item.url || "#",
            snippet: item.content,
            displayLink: "Supermemory",
            type: 'memory'
        }));
    } catch (e) {
        console.warn("Supermemory search failed", e);
        return [];
    }
};

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
export const searchWithProviders = async (query: string, providers: ('exa' | 'tavily' | 'firecrawl' | 'valyu')[]): Promise<SearchResult[]> => {
    const promises: Promise<SearchResult[]>[] = [];

    if (providers.includes('exa') && getExaKey()) promises.push(searchExa(query, 5));
    if (providers.includes('tavily') && getTavilyKey()) promises.push(searchTavily(query, 5));
    if (providers.includes('firecrawl') && getFirecrawlKey()) promises.push(searchFirecrawl(query, 3));
    if (providers.includes('valyu') && getValyuKey()) promises.push(searchValyu(query));

    if (promises.length === 0) return [];

    const resultsArray = await Promise.all(promises);
    const flatResults = resultsArray.flat();

    // Deduplication & Diversity Filtering
    const seenUrls = new Set<string>();
    const seenDomains = new Map<string, number>(); 
    const uniqueResults: SearchResult[] = [];

    for (const res of flatResults) {
        if (seenUrls.has(res.link)) continue;
        const domain = res.displayLink;
        const domainCount = seenDomains.get(domain) || 0;
        if (domainCount >= 2) continue;

        seenUrls.add(res.link);
        seenDomains.set(domain, domainCount + 1);
        uniqueResults.push(res);
    }

    return uniqueResults.slice(0, 15);
};

export const performMultiSearch = async (query: string): Promise<SearchResult[]> => {
    // Default Web Search: Exa + Tavily
    return searchWithProviders(query, ['exa', 'tavily']);
};

// Export individual search functions for specific modes
export const searchYoutube = async (query: string) => searchSupadata(query);
export const searchAcademic = async (query: string) => {
    // Combine Exa (academic filter) + Firecrawl (deep)
    const exaResults = await searchExa(`${query} site:.edu OR site:arxiv.org`, 5);
    const firecrawlResults = await searchFirecrawl(`${query} research paper`, 3);
    return [...exaResults, ...firecrawlResults];
};
export const searchGithub = async (query: string) => searchFirecrawl(`site:github.com ${query}`, 5);
export const searchMemory = async (query: string) => searchSupermemory(query);


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
