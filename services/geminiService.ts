
import { GoogleGenAI } from "@google/genai";
import { SearchResult, WidgetData, Message, CopilotPayload } from "../types";
import { searchFast } from './googleSearchService';
import { streamPollinations } from './pollinationsService';
import { streamGroq } from './groqService';
import { streamOpenRouter } from './openRouterService';

// Safe access to environment variable following guidelines
const getApiKey = () => {
    try {
        if (typeof process !== 'undefined' && process.env?.GOOGLE_API_KEY) {
            return process.env.GOOGLE_API_KEY;
        }
    } catch (e) {}

    try {
        // @ts-ignore
        if (import.meta.env?.VITE_GOOGLE_API_KEY) {
            // @ts-ignore
            return import.meta.env.VITE_GOOGLE_API_KEY;
        }
    } catch (e) {}

    return undefined;
};

const getAiClient = () => {
    const key = getApiKey();
    return new GoogleGenAI({ apiKey: key || "dummy_key_for_init" });
};

// Helper for retry logic
const generateWithRetry = async (ai: any, params: any, retries = 3, delay = 2000): Promise<any> => {
    try {
        return await ai.models.generateContentStream(params);
    } catch (e: any) {
        if (retries > 0 && (e.status === 429 || e.status === 'RESOURCE_EXHAUSTED' || e.message?.includes('429'))) {
            console.warn(`Quota exceeded (429). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(ai, params, retries - 1, delay * 2);
        }
        throw e;
    }
};

// --- Intent Detection (Search vs Pure Gen) ---
// Note: Keeping this for potential future use or non-copilot smart mode, 
// but currently App.tsx uses strict isCopilotMode check.
export const shouldSearch = async (query: string): Promise<boolean> => {
    const lower = query.toLowerCase();

    if (lower.startsWith('write') || 
        lower.startsWith('code') || 
        lower.startsWith('generate') || 
        lower.startsWith('create') || 
        lower.startsWith('draft') ||
        lower.startsWith('translate') ||
        lower.startsWith('hi ') ||
        lower.startsWith('hello') ||
        lower === 'hi' ||
        lower === 'hello' ||
        lower.includes('explain this code') ||
        lower.includes('fix this') ||
        lower.includes('debug')) {
        return false;
    }

    if (lower.includes('latest') || 
        lower.includes('news') || 
        lower.includes('weather') || 
        lower.includes('price') || 
        lower.includes('stock') ||
        lower.includes('population') ||
        lower.includes('who is') ||
        lower.includes('when is') ||
        lower.includes('where is')) {
        return true;
    }

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
             model: 'gemini-2.0-flash',
             contents: `You are a search intent classifier. 
             Query: "${query}"
             Output ONLY "true" or "false".`,
             config: { temperature: 0, maxOutputTokens: 5 }
        });
        const text = response.text?.trim().toLowerCase();
        return text === 'true';
    } catch (e) {
        return true;
    }
};

// --- Copilot / Deep Dive Logic ---

export const generateCopilotStep = async (query: string): Promise<CopilotPayload | null> => {
    try {
        const ai = getAiClient();
        let context = "";
        try {
             // We do a very light search just to understand context if needed
             // But to save quota we might skip this or keep it minimal
             const searchRes = await searchFast(query);
             context = searchRes.results.slice(0, 3).map(r => r.snippet).join('\n');
        } catch(e) {}

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `User Query: "${query}"
            Search Context (optional): "${context}"
            
            You are "Impersio Copilot", an advanced search assistant.
            Goal: Determine if you need to ask *one* clarifying question to provide a perfect, deep-dive answer.
            
            Rules:
            1. If the query is broad (e.g., "Plan a trip", "Best laptop", "How to code"), ASK a question to narrow it down.
            2. If the query is specific (e.g., "Population of Tokyo 2023", "Who won the 1994 World Cup"), do NOT ask.
            3. Provide reasonable options if applicable.
            
            Output JSON format:
            {
                "needs_clarification": boolean,
                "question": "The question to ask",
                "type": "selection" | "text",
                "options": ["Option 1", "Option 2"] // Only if type is selection (max 4 options)
            }
            `,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim();
        if (!text) return null;
        
        const data = JSON.parse(text);
        if (data.needs_clarification) {
            return {
                question: data.question,
                type: data.type || 'text',
                options: data.options
            };
        }
        return null;

    } catch (e) {
        // Silently fail copilot step on error to allow main search to proceed
        return null;
    }
};

export const streamResponse = async (
  prompt: string, 
  modelName: string, 
  history: Message[],
  searchResults: SearchResult[],
  attachments: string[],
  isReasoningEnabled: boolean,
  isMobile: boolean,
  onChunk: (content: string) => void,
  onWidget: (widget: WidgetData) => void,
  onRelated: (questions: string[]) => void,
  onComplete?: (fullContent: string, widget: WidgetData | undefined, relatedQuestions: string[]) => void,
  deepFindings?: string,
  onSources?: (sources: SearchResult[]) => void
): Promise<void> => {
  
  const now = new Date();
  const currentDateTime = now.toLocaleString('en-US');
  const useBuiltInSearch = searchResults.length === 0;

  // RAG Context
  let ragContext = "";
  if (searchResults.length > 0) {
      ragContext = "SOURCES:\n" + searchResults.map((r, i) => `[${i+1}] ${r.title}\n${r.snippet}`).join('\n\n');
  } else if (!useBuiltInSearch) {
      ragContext = "No external context.";
  }

  if (deepFindings) ragContext = `FINDINGS FROM COPILOT:\n${deepFindings}\n\n${ragContext}`;

  const fullPrompt = `
  System: You are Impersio, a helpful AI.
  Date: ${currentDateTime}
  
  ${ragContext ? `Context:\n${ragContext}` : ''}

  User: ${prompt}
  
  Instructions:
  1. Answer directly and comprehensively.
  ${useBuiltInSearch ? '2. Use the Google Search tool to find information if needed.' : '2. Use citations [1], [2] inline when referring to sources provided in Context.'}
  3. Format with clean Markdown. Use headings for sections.
  4. At the very end, generate 3 related follow-up questions separated by "|||".
  `;

  // --- Helper to execute Pollinations (Free Fallback) ---
  const runPollinationsFallback = async (contextPrefix = "") => {
      try {
          if (contextPrefix) onChunk(contextPrefix);
          
          let fullText = "";
          await streamPollinations(
            [{ role: 'user', content: fullPrompt }],
            'openai',
            (chunk) => {
                fullText += chunk;
                const split = fullText.split('|||');
                onChunk(split[0]); 
            }
          );
          
          const parts = fullText.split('|||');
          if (parts.length > 1) {
            const related = parts.slice(1).join('').split('\n').map(q => q.trim()).filter(q => q.length > 5);
            onRelated(related);
          }
          if (onComplete) onComplete(parts[0], undefined, []);

      } catch (err) {
          console.error("Universal Fallback Failed:", err);
          onChunk("\n\n*System Error: All AI services are currently unavailable. Please check your connection.*");
      }
  };


  // --- GPT-4 (Pollinations) Path ---
  if (modelName === 'gpt-4') {
      await runPollinationsFallback();
      return;
  }

  // --- Llama 3.3 via Groq ---
  if (modelName === 'llama-3.3-70b-groq') {
       try {
        let fullText = "";
        await streamGroq(
            [{ role: 'user', content: fullPrompt }],
            'llama-3.3-70b-versatile', 
            (chunk) => {
                fullText += chunk;
                const split = fullText.split('|||');
                onChunk(split[0]); 
            }
        );
        const parts = fullText.split('|||');
        if (parts.length > 1) {
            const related = parts.slice(1).join('').split('\n').map(q => q.trim()).filter(q => q.length > 5);
            onRelated(related);
        }
        if (onComplete) onComplete(parts[0], undefined, []);
        return;
      } catch (err: any) {
        console.warn("Groq failed, trying fallback...", err);
        await runPollinationsFallback("\n\n*Groq unavailable, switching to backup model...*\n\n");
        return;
      }
  }

  // --- Llama 3.3 via OpenRouter ---
  if (modelName === 'llama-3.3-70b-openrouter') {
       try {
        let fullText = "";
        await streamOpenRouter(
            [{ role: 'user', content: fullPrompt }],
            'meta-llama/llama-3.3-70b-instruct', 
            (chunk) => {
                fullText += chunk;
                const split = fullText.split('|||');
                onChunk(split[0]); 
            }
        );
        const parts = fullText.split('|||');
        if (parts.length > 1) {
            const related = parts.slice(1).join('').split('\n').map(q => q.trim()).filter(q => q.length > 5);
            onRelated(related);
        }
        if (onComplete) onComplete(parts[0], undefined, []);
        return;
      } catch (err: any) {
        console.warn("OpenRouter failed, trying fallback...", err);
        await runPollinationsFallback("\n\n*OpenRouter unavailable, switching to backup model...*\n\n");
        return;
      }
  }

  // --- Gemini Path (Default) ---
  const ai = getAiClient();
  const tools = useBuiltInSearch ? [{ googleSearch: {} }] : undefined;
  
  try {
    let contentsParts: any[] = [{ text: fullPrompt }];
    
    if (attachments && attachments.length > 0) {
        const imageParts = attachments.map(att => ({
            inlineData: {
                mimeType: att.split(';')[0].split(':')[1],
                data: att.split(',')[1]
            }
        }));
        contentsParts = [...imageParts, { text: fullPrompt }];
    }

    // Use retry wrapper
    const result = await generateWithRetry(ai, {
        model: modelName.includes('gemini') ? modelName : 'gemini-2.0-flash', 
        contents: [{ role: 'user', parts: contentsParts }],
        config: {
            tools: tools,
        }
    });

    let fullText = "";
    
    for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
            fullText += text;
            const split = fullText.split('|||');
            onChunk(split[0]); 
        }

        // Handle Google Search Tool Sources
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        if (useBuiltInSearch && groundingMetadata?.groundingChunks) {
            const sources: SearchResult[] = groundingMetadata.groundingChunks
                .map((c: any) => c.web)
                .filter((w: any) => w)
                .map((w: any) => ({
                    title: w.title || "Source",
                    link: w.uri,
                    displayLink: new URL(w.uri).hostname,
                    snippet: "Retrieved via Google Search" // Tool doesn't always provide snippet chunks easily here
                }));
            
            if (sources.length > 0 && onSources) {
                onSources(sources);
            }
        }
    }

    // Extract related questions
    const parts = fullText.split('|||');
    if (parts.length > 1) {
        const related = parts.slice(1).join('').split('\n').map(q => q.trim()).filter(q => q.length > 5);
        onRelated(related);
    } else {
        onRelated([
            `More details about ${prompt.substring(0, 15)}...`,
            "Explain the implications",
            "Compare with alternatives"
        ]);
    }

    if (onComplete) onComplete(parts[0], undefined, []);

  } catch (err: any) {
      // Catch ALL Gemini errors (Quota, Network, Keys) and use Fallback
      console.error("Gemini Error:", err);
      
      const isQuotaError = err.status === 429 || err.message?.includes('429') || err.message?.includes('quota');
      const msg = isQuotaError ? "*Gemini quota exceeded. Switching to backup model...*\n\n" : "*Gemini unavailable. Switching to backup model...*\n\n";
      
      await runPollinationsFallback(msg);
  }
};
