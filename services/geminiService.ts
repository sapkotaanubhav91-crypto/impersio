
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, WidgetData, Message, ProSearchStep } from "../types";
import { searchFast } from './googleSearchService';

// Robust API Key Retrieval
const getApiKey = () => {
    // 1. Check process.env (injected by Vite define)
    if (typeof process !== 'undefined' && process.env) {
        if (process.env.API_KEY) return process.env.API_KEY;
        if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
    }
    // 2. Fallback to import.meta.env (standard Vite)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        if ((import.meta as any).env.VITE_API_KEY) return (import.meta as any).env.VITE_API_KEY;
        if ((import.meta as any).env.VITE_GOOGLE_API_KEY) return (import.meta as any).env.VITE_GOOGLE_API_KEY;
        if ((import.meta as any).env.GOOGLE_API_KEY) return (import.meta as any).env.GOOGLE_API_KEY;
    }
    return undefined;
};

// Initialize with a safe fallback to prevent crash on load, but requests will fail if key is invalid
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
        if (!key) return true; 
        
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
            contents: `You are a search planning agent.
            Break down the user's query into 2 to 4 distinct, sequential research steps to answer it comprehensively.
            Steps should be actionable (e.g., "Identify...", "Find...", "Compare...", "Analyze...").
            
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
        if (!text) return ["Analyze the query"];
        return JSON.parse(text);
    } catch (e) {
        return ["Research the topic"];
    }
};

const generateQueriesForStep = async (stepTitle: string, originalQuery: string): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Generate 2-3 specific Google search queries to complete this research step: "${stepTitle}".
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
        steps.push({ id: 'step-final', title: 'Wrapping up', status: 'pending', queries: [], sources: [] });
    }
    
    onStepsUpdate([...steps]);

    for (let i = 0; i < steps.length; i++) {
        if (steps[i].title === 'Wrapping up' && i === steps.length - 1) {
             steps[i].status = 'in-progress';
             onStepsUpdate([...steps]);
             await new Promise(r => setTimeout(r, 600)); 
             steps[i].status = 'completed';
             onStepsUpdate([...steps]);
             continue;
        }

        steps[i].status = 'in-progress';
        onStepsUpdate([...steps]);

        const queries = await generateQueriesForStep(steps[i].title, query);
        steps[i].queries = queries;
        onStepsUpdate([...steps]);

        const searchPromises = queries.slice(0, 2).map(q => searchFast(q));
        const results = await Promise.all(searchPromises);
        
        const stepSources: SearchResult[] = [];
        results.forEach(r => {
            if (r.results) stepSources.push(...r.results);
        });

        const uniqueSources = stepSources.filter((s, index, self) => 
            index === self.findIndex((t) => (t.link === s.link))
        );

        steps[i].sources = uniqueSources;
        allSources.push(...uniqueSources);
        
        steps[i].status = 'completed';
        onStepsUpdate([...steps]);
    }

    await streamResponse(
        query,
        modelId,
        history,
        allSources,
        [], 
        true, 
        false, 
        (chunk) => onComplete(chunk, allSources),
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
  const apiKey = getApiKey();
  
  if (!apiKey) {
      onChunk("⚠️ **Configuration Error**: API Key is missing.\n\nPlease add `GOOGLE_API_KEY` to your environment variables.");
      return;
  }

  const ai = getAiClient();
  
  try {
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
    2. **Citations**: You MUST use inline citations like [1], [2] when referencing the provided context.
    3. **Tone**: Objective, professional, yet conversational.
    4. **Date**: Today is ${currentDateTime}.
    `;

    const fullPrompt = `
    System Prompt:
    You are Scira, a minimalist AI search engine designed for clarity and truth.
    ${strictFormatInstructions}
    
    Context from Search:
    ${ragContext}

    User Query: ${prompt}
    
    Answer:
    `;

    let contentsParts: any[] = [{ text: fullPrompt }];
    
    if (attachments && attachments.length > 0) {
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
            maxOutputTokens: 4000,
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

    // Attempt to generate a widget if relevant
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
                `Latest news`,
                `Deep dive analysis`
            ]);
       }
       
       if (onComplete) onComplete(fullText, widget, []);

    } catch (err) {
        console.error("Widget generation error", err);
    }

  } catch (e: any) {
    console.error("Gemini API Error:", e);
    
    let userMessage = `I encountered an error: ${e.message || "Unknown error"}`;
    
    if (e.message?.includes("API_KEY_INVALID") || e.message?.includes("API key not valid")) {
        userMessage = "⚠️ **Access Denied**: The API Key provided is invalid.\n\nPlease check your Environment Variables and ensure `GOOGLE_API_KEY` is set correctly.";
    } else if (e.message?.includes("429")) {
        userMessage = "⚠️ **Rate Limit Exceeded**: We're receiving too many requests. Please try again in a moment.";
    }

    onChunk(userMessage);
  }
};
