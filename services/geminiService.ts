
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, WidgetData, Message, ProSearchStep } from "../types";
import { searchFast } from './googleSearchService';
import { streamGroq } from './groqService';
import { streamOpenRouter } from './openRouterService';
import { streamCerebras } from './cerebrasService';

// Safe access to environment variable following guidelines
const getApiKey = () => {
    // 1. Vite 'define' replaces process.env.GOOGLE_API_KEY with the actual string value during build.
    // We must access it directly without checking 'typeof process' because 'process' does not exist in the browser.
    const viteKey = process.env.GOOGLE_API_KEY;
    if (viteKey && viteKey.length > 0) {
        return viteKey;
    }
    return undefined;
};

// Initialize with a dummy key if missing to prevent immediate crash.
const getAiClient = () => {
    const key = getApiKey();
    return new GoogleGenAI({ apiKey: key || "dummy_key_for_init" });
};

// --- Search Router ---

export const shouldSearch = async (query: string): Promise<boolean> => {
    const lower = query.toLowerCase().trim();
    if (lower.length < 5) return false;
    if (['hi', 'hello', 'hey', 'help', 'who are you', 'what is this', 'good morning', 'good evening'].includes(lower)) return false;
    
    try {
        const key = getApiKey();
        if (!key) return true; // Default to search if no AI key
        
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Classify if this query needs external info (Google Search).
            
            Query: "${query}"
            
            Rules:
            - "Weather", "Stock", "News", "Who is", "Events", "Facts" -> TRUE
            - "Hi", "Write poem", "Debug this code", "Explain concept" -> FALSE
            
            Return JSON: { "search": boolean }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { search: { type: Type.BOOLEAN } }
                }
            }
        });
        const result = JSON.parse(response.text || "{}");
        return result.search ?? true;
    } catch(e) {
        return true;
    }
};

// --- Pro Search Helpers ---

const generatePlan = async (query: string): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `You are a Deep Research Planning Agent.
            Break down the user's query into 3 to 5 distinct, sequential, and comprehensive research steps.
            The goal is to provide a "Deep Think" answer.
            
            Steps should be actionable (e.g., "Analyze the history of...", "Compare technical specifications of...", "Investigate recent developments in...").
            
            User Query: "${query}"
            
            Return strictly a JSON array of strings (the step titles).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const text = response.text;
        if (!text) return ["Analyze the query", "Search for key information", "Synthesize findings"];
        return JSON.parse(text);
    } catch (e) {
        return ["Research the topic", "Find latest details", "Summarize answer"];
    }
};

const generateQueriesForStep = async (stepTitle: string, originalQuery: string): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Generate 2 specific and effective search queries to complete this research step: "${stepTitle}".
            Context (Original Query): "${originalQuery}".
            
            Return strictly a JSON array of strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const text = response.text;
        if (!text) return [stepTitle];
        return JSON.parse(text);
    } catch (e) {
        return [stepTitle];
    }
};

// --- Main Orchestrator ---

export const orchestrateProSearch = async (
    query: string,
    modelId: string,
    history: Message[],
    onStepsUpdate: (steps: ProSearchStep[]) => void,
    onComplete: (fullContent: string, sources: SearchResult[]) => void
) => {
    const steps: ProSearchStep[] = [];
    const allSources: SearchResult[] = [];

    const plan = await generatePlan(query);
    plan.forEach((title, idx) => {
        steps.push({
            id: `step-${idx}`,
            title,
            status: 'pending',
            queries: [],
            sources: []
        });
    });
    if (!plan.some(p => p.toLowerCase().includes('wrap') || p.toLowerCase().includes('summary'))) {
        steps.push({ id: 'step-final', title: 'Synthesizing Deep Research Report', status: 'pending', queries: [], sources: [] });
    }
    
    onStepsUpdate([...steps]);

    for (let i = 0; i < steps.length; i++) {
        if (steps[i].title.includes('Synthesizing') && i === steps.length - 1) {
             steps[i].status = 'in-progress';
             onStepsUpdate([...steps]);
             await new Promise(r => setTimeout(r, 800)); // Visual pause for "thinking"
             steps[i].status = 'completed';
             onStepsUpdate([...steps]);
             continue;
        }

        steps[i].status = 'in-progress';
        onStepsUpdate([...steps]);

        const queries = await generateQueriesForStep(steps[i].title, query);
        steps[i].queries = queries;
        onStepsUpdate([...steps]);

        // Execute searches (using fast Exa search)
        const searchPromises = queries.map(q => searchFast(q));
        const results = await Promise.all(searchPromises);
        
        const stepSources: SearchResult[] = [];
        results.forEach(r => {
            if (r.results) stepSources.push(...r.results);
        });

        // Unique filter based on URL
        const uniqueSources = stepSources.filter((s, index, self) => 
            index === self.findIndex((t) => (t.link === s.link))
        );

        steps[i].sources = uniqueSources;
        allSources.push(...uniqueSources);
        
        steps[i].status = 'completed';
        onStepsUpdate([...steps]);
    }

    // Final Deduplication of all sources
    const finalUniqueSources = allSources.filter((s, index, self) => 
        index === self.findIndex((t) => (t.link === s.link))
    );

    await streamResponse(
        query,
        modelId,
        history,
        finalUniqueSources,
        [], 
        true, 
        false, 
        (chunk) => onComplete(chunk, finalUniqueSources),
        () => {}, 
        () => {}, 
        (full, widget, related) => {}
    );
};

// --- Existing Functions ---

export const generateManualQueries = (prompt: string): string[] => {
    const base = prompt.trim();
    return [base, `${base} latest news`, `${base} analysis`, `${base} key details`];
};

export const getSuggestions = async (query: string): Promise<string[]> => {
  if (!query || query.trim().length < 2) return [];
  try {
    const response = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&origin=*&format=json`);
    const data = await response.json();
    return data[1] || [];
  } catch (error) {
    return [];
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
  onComplete?: (fullContent: string, widget: WidgetData | undefined, relatedQuestions: string[]) => void
): Promise<void> => {
  
  // RAG Context Construction
  const now = new Date();
  const currentDateTime = now.toLocaleString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
  });
  const hasResults = searchResults.length > 0;

  const ragContext = hasResults 
      ? searchResults.map((r, i) => `CITATION [${i+1}] ${r.title}\nURL: ${r.link}\nCONTENT: ${r.snippet}`).join('\n\n')
      : "No external context provided. Rely on internal knowledge.";

  const strictFormatInstructions = `
  FORMATTING RULES (STRICT):
  1. **Structure**: Start directly with the answer. Use ### Headers for sections.
  2. **Citations**: You MUST use inline citations like [1], [2]. **IMPORTANT**: Place citations at the END of sentences or paragraphs. DO NOT place them in the middle of sentences or text flows.
  3. **Tone**: Objective, professional, yet conversational.
  4. **Date**: Today is ${currentDateTime}.
  5. **Formatting**: Use strict bullet points for lists. Ensure H3 headers are used for sub-sections.
  `;

  const fullPrompt = `
  System Prompt:
  You are Impersio, a high-intelligence search assistant.
  ${strictFormatInstructions}
  
  Context from Search:
  ${ragContext}

  User Query: ${prompt}
  
  Answer:
  `;

  // --- ROUTING LOGIC ---

  // 1. Cerebras Routing (GLM 4.7)
  if (modelName === 'zai-glm-4.7') {
      try {
          // Cerebras expects {role, content} format
          const messages = [{ role: 'user', content: fullPrompt }];
          let fullText = "";
          await streamCerebras(messages as any, modelName, (chunk) => {
              fullText += chunk;
              onChunk(fullText);
          });
          if (onComplete) onComplete(fullText, undefined, []);
          return;
      } catch (err: any) {
           console.error("Cerebras Error:", err);
           onChunk(`⚠️ Error with Cerebras: ${err.message}`);
           return;
      }
  }

  // 2. GROQ Routing (Llama, Mixtral, Kimi K2)
  if (modelName.includes('llama') || modelName.includes('mixtral') || modelName.includes('kimi-k2')) {
      try {
          // Construct Groq messages
          const messages = [{ role: 'user', content: fullPrompt }];
          let fullText = "";
          await streamGroq(messages, modelName, (chunk) => {
              fullText += chunk;
              onChunk(fullText);
          });
          
          if (onComplete) onComplete(fullText, undefined, []);
          return;
      } catch (err: any) {
          console.warn("Groq API failed:", err.message);
          
          // Fallback to OpenRouter ONLY for Llama 3.3 as requested
          if (modelName.includes('llama')) {
              try {
                 onChunk("\n\n*Switching to backup provider...*\n\n");
                 const messages = [{ role: 'user', content: fullPrompt }];
                 let fullText = "";
                 const fallbackModel = "meta-llama/llama-3.3-70b-instruct:free";
                 
                 await streamOpenRouter(messages, fallbackModel, (chunk) => {
                    fullText += chunk;
                    onChunk(fullText);
                 });
                 
                 if (onComplete) onComplete(fullText, undefined, []);
                 return;
    
              } catch (fallbackErr: any) {
                 console.error("OpenRouter Fallback failed:", fallbackErr);
                 onChunk(`⚠️ All providers failed. Groq: ${err.message}. OpenRouter: ${fallbackErr.message}`);
                 return;
              }
          }
          
          onChunk(`⚠️ Groq Error: ${err.message}`);
          return;
      }
  }

  // 3. OpenRouter Direct Routing (Legacy or other models)
  if (modelName.includes('zhipu') || modelName.includes('moonshot') || modelName.includes('glm')) {
      // Note: Kimi K2 and GLM 4.7 are handled above. This catches older/other IDs if any.
      try {
          const messages = [{ role: 'user', content: fullPrompt }];
          let fullText = "";
          await streamOpenRouter(messages, modelName, (chunk) => {
              fullText += chunk;
              onChunk(fullText);
          });
          if (onComplete) onComplete(fullText, undefined, []);
          return;
      } catch (err: any) {
          console.error("OpenRouter Error:", err);
          onChunk(`⚠️ Error with ${modelName}: ${err.message}`);
          return;
      }
  }

  // 4. GEMINI Routing (Default)
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "dummy_key_for_init") {
      onChunk("⚠️ **Configuration Error**: Google API Key is missing.\n\nPlease add `GOOGLE_API_KEY` to your environment variables.");
      return;
  }

  const ai = getAiClient();
  
  try {
    // Construct request contents
    let contentsParts: any[] = [{ text: fullPrompt }];
    
    // Handle attachments (images)
    if (attachments && attachments.length > 0) {
        // Assuming attachments are base64 data URLs
        const imageParts = attachments.map(att => {
            const base64Data = att.split(',')[1];
            const mimeType = att.substring(att.indexOf(':') + 1, att.indexOf(';'));
            return {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            };
        });
        contentsParts = [...imageParts, { text: fullPrompt }];
    }

    const result = await ai.models.generateContentStream({
        model: modelName.includes('gemini') ? modelName : 'gemini-2.0-flash', 
        contents: [
            { role: 'user', parts: contentsParts }
        ],
        config: {
            temperature: 0.7,
            maxOutputTokens: 2000,
        }
    });

    let fullText = "";
    
    for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
            fullText += text;
            onChunk(fullText);
        }
    }

    // Widget & Related Questions Logic (Client-side heuristics for now)
    try {
       const lowerPrompt = prompt.toLowerCase();
       let widget: WidgetData | undefined = undefined;

       if (lowerPrompt.includes('weather') && !lowerPrompt.includes('explain')) {
           widget = { type: 'weather', data: { location: prompt.replace('weather', '').trim() || 'New York' } };
       } else if (lowerPrompt.includes('stock') || lowerPrompt.includes('price of')) {
           const symbol = prompt.split(' ').pop()?.toUpperCase() || 'AAPL';
           widget = { type: 'stock', data: { symbol } };
       } else if (lowerPrompt.includes('time in')) {
           widget = { type: 'time', data: { 
               time: new Date().toLocaleTimeString(), 
               date: new Date().toLocaleDateString(),
               location: prompt.replace('time in', '').trim(),
               timezone: 'Local'
           }};
       }

       if (widget) {
           onWidget(widget);
       }

       if (fullText.length > 100) {
            onRelated([
                `More about ${prompt}`,
                `Latest news on this`,
                `Explain the details`
            ]);
       }
       
       if (onComplete) onComplete(fullText, widget, []);

    } catch (err) {
        console.error("Widget generation error", err);
    }

  } catch (e: any) {
    console.error("Gemini API Error:", e);
    
    let errorMsg = e.message || "";
    if (errorMsg.includes('{')) {
        try {
            const match = errorMsg.match(/\{.*\}/s);
            if (match) {
                const json = JSON.parse(match[0]);
                if (json.error?.message) errorMsg = json.error.message;
            }
        } catch {}
    }

    let userMessage = `I encountered an error: ${errorMsg}`;
    
    if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("API key not valid")) {
        userMessage = "⚠️ **Access Denied**: The API Key provided is invalid or missing.";
    } else if (errorMsg.includes("429")) {
        userMessage = "⚠️ **Rate Limit Exceeded**: We're receiving too many requests. Please try again in a moment.";
    }

    onChunk(userMessage);
  }
};
