
import { GoogleGenAI } from "@google/genai";
import { SearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- CACHING LAYER ---
// In-memory cache for query embeddings to avoid re-fetching the same query
// Key: query text, Value: embedding vector
const QUERY_EMBEDDING_CACHE = new Map<string, number[]>();

// In-memory cache for result content embeddings to avoid re-embedding the same search result
// Key: "title:snippet" hash, Value: embedding vector
const CONTENT_EMBEDDING_CACHE = new Map<string, number[]>();

// Helper: Generate a cache key for search result content
const getContentKey = (title: string, snippet: string) => `${title}:${snippet.slice(0, 100)}`;

// Calculate Cosine Similarity (Optimized for V8 JIT)
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
};

export const rankResults = async (query: string, results: SearchResult[]): Promise<SearchResult[]> => {
  if (results.length === 0) return [];

  // Optimization: Only rank the top 10 results to reduce batch size and latency.
  // The probability of the best answer being outside the top 10 from Google/Exa is low.
  const candidates = results.slice(0, 10);

  try {
    // 1. Get Query Embedding (Check Cache First)
    let queryVec = QUERY_EMBEDDING_CACHE.get(query);
    
    if (!queryVec) {
      // If not in cache, fetch it
      const queryRes = await ai.models.embedContent({
        model: "text-embedding-004",
        content: { parts: [{ text: query }] },
      });
      queryVec = queryRes.embedding?.values;
      if (queryVec) QUERY_EMBEDDING_CACHE.set(query, queryVec);
    }

    if (!queryVec) return results; // Fallback to original order if embedding fails

    // 2. Identify Missing Content Embeddings
    // We construct the text to embed as "Title: Snippet" for best semantic matching
    const missingItems: { index: number; text: string; key: string }[] = [];
    const candidateTexts = candidates.map(r => `${r.title}: ${r.snippet}`);

    candidateTexts.forEach((text, i) => {
      const key = getContentKey(candidates[i].title, candidates[i].snippet);
      if (!CONTENT_EMBEDDING_CACHE.has(key)) {
        missingItems.push({ index: i, text, key });
      }
    });

    // 3. Batch Embed Missing Items (Single API Call)
    if (missingItems.length > 0) {
      const batchRes = await ai.models.batchEmbedContents({
        model: "text-embedding-004",
        requests: missingItems.map(item => ({
          content: { parts: [{ text: item.text }] }
        }))
      });

      const newEmbeddings = batchRes.embeddings || [];
      newEmbeddings.forEach((emb, i) => {
        const originalItem = missingItems[i];
        if (emb.values) {
           CONTENT_EMBEDDING_CACHE.set(originalItem.key, emb.values);
        }
      });
    }

    // 4. Calculate Scores and Rank
    const rankedWithScore = candidates.map((item, i) => {
      const key = getContentKey(item.title, item.snippet);
      const vec = CONTENT_EMBEDDING_CACHE.get(key);
      const score = vec ? cosineSimilarity(queryVec!, vec) : 0;
      return { item, score };
    });

    // 5. Sort & Threshold
    const sorted = rankedWithScore
      .sort((a, b) => b.score - a.score)
      // Filter out low relevance noise (score < 0.35)
      .filter(x => x.score > 0.35) 
      .map(x => x.item);

    // If filtering was too aggressive (removed all results), return the top 3 unranked
    return sorted.length > 0 ? sorted : candidates.slice(0, 3);

  } catch (error) {
    console.warn("RAG Ranking failed, using default order:", error);
    return results; // Fail gracefully ensuring the user still gets results
  }
};
