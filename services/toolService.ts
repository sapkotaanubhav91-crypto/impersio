import { SearchModeType, SearchResult } from '../types';
import { performMultiSearch, searchWithProviders, searchYoutube, searchAcademic, searchGithub, searchMemory, searchValyuDeep } from '../lib/search';

// --- Tool Interfaces ---
export interface Tool {
  id: string;
  name: string;
  description: string;
  execute: (query: string) => Promise<any>;
}

// --- Specific Tool Implementations ---

// 1. Weather Tool (Open-Meteo)
const weatherTool: Tool = {
  id: 'weather',
  name: 'Weather',
  description: 'Get current weather and forecast',
  execute: async (query: string) => {
    // Simple geocoding mock or direct call if we had coordinates
    // For now, return a placeholder that the UI can render or LLM can interpret
    return { type: 'weather', location: query, data: 'Weather data would go here' };
  }
};

// 2. Crypto Tool (CoinGecko)
const cryptoTool: Tool = {
  id: 'crypto',
  name: 'Crypto',
  description: 'Get cryptocurrency prices and charts',
  execute: async (query: string) => {
    try {
      // Basic CoinGecko search/price fetch
      const coinId = query.toLowerCase().replace(' ', '-'); // Very naive mapping
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`);
      const data = await response.json();
      return { type: 'crypto', data };
    } catch (e) {
      return { error: 'Failed to fetch crypto data' };
    }
  }
};

// 3. Stock Tool (Yahoo Finance / Tavily fallback)
const stockTool: Tool = {
  id: 'stocks',
  name: 'Stocks',
  description: 'Get stock market data',
  execute: async (query: string) => {
    // In a real app, we'd use a specific finance API. 
    // Here we might just rely on the search engine to return finance snippets
    // or use a free API if available.
    return { type: 'stock', symbol: query.toUpperCase() };
  }
};

// --- Tool Registry ---
const tools: Record<string, Tool> = {
  weather: weatherTool,
  crypto: cryptoTool,
  stocks: stockTool,
};

// --- Main Service ---

export const executeToolsForMode = async (mode: SearchModeType, query: string): Promise<any> => {
  // Map modes to specific tools if applicable
  switch (mode) {
    case 'crypto':
      return await tools.crypto.execute(query);
    case 'stocks':
      return await tools.stocks.execute(query);
    case 'weather':
      return await tools.weather.execute(query);
    default:
      return null;
  }
};

export const searchForMode = async (mode: SearchModeType, query: string): Promise<SearchResult[]> => {
  // Customize search strategy based on mode
  let searchContext = query;
  
  switch (mode) {
    case 'web':
      return await searchWithProviders(query, ['exa', 'tavily']);
    case 'academic':
      // Exa + Firecrawl
      return await searchWithProviders(`${query} site:.edu OR site:arxiv.org OR "research paper"`, ['exa', 'firecrawl']);
    case 'extreme': // Deep Research
      // Valyu Deep Research
      return await searchValyuDeep(query);
    case 'scraping':
      // Firecrawl
      return await searchWithProviders(query, ['firecrawl']);
    case 'reddit':
      searchContext = `${query} site:reddit.com`;
      break;
    case 'github':
      return await searchGithub(query);
    case 'youtube':
      return await searchYoutube(query);
    case 'memory':
      return await searchMemory(query);
    case 'x':
      searchContext = `${query} site:twitter.com OR site:x.com`;
      break;
    case 'code':
      searchContext = `${query} programming code example`;
      break;
    // ... others
  }

  // Default fallback (Web)
  return await performMultiSearch(searchContext);
};
