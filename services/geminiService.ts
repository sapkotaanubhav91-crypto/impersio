
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, WidgetData, Message, ProSearchStep } from "../types";
import { searchFast } from './googleSearchService';
import { streamGroq } from './groqService';
import { streamOpenRouter } from './openRouterService';
import { streamCerebras } from './cerebrasService';

// Safe access to environment variable following guidelines
const getApiKey = () => {
    const viteKey = process.env.GOOGLE_API_KEY;
    if (viteKey && viteKey.length > 0) {
        return viteKey;
    }
    return undefined;
};

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
        
        let text = response.text || "{}";
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(text);
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
            Break down the User Query into 4 to 6 distinct, sequential, and comprehensive research steps.
            
            CRITICAL RULES:
            1. Every step MUST explicitly mention the specific topic: "${query}".
            2. Do NOT use generic phrases like "Research the topic" or "Find background".
            3. Instead use: "Investigate the financial history of ${query}", "Analyze competitor performance against ${query}".
            
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
        let text = response.text;
        if (!text) throw new Error("No text returned");
        
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (e) {
        console.error("Plan generation failed, using fallback strategy");
        // Fallback: Generate steps that strictly include the query to prevent generic searching
        return [
            `Comprehensive overview and background of "${query}"`,
            `Key factors and recent developments regarding "${query}"`,
            `Detailed analysis and expert perspectives on "${query}"`,
            `Future outlook and conclusion for "${query}"`
        ];
    }
};

const generateQueriesForStep = async (stepTitle: string, originalQuery: string): Promise<string[]> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Generate 3 highly specific Google Search queries to gather information for this research step: "${stepTitle}".
            
            Context (The User's Main Question): "${originalQuery}".
            
            IMPORTANT: The queries must be targeted at finding facts about "${originalQuery}".
            Do not generate generic queries like "how to research".
            
            Return strictly a JSON array of strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        let text = response.text;
        if (!text) return [`${stepTitle} ${originalQuery}`];
        
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (e) {
        return [`${stepTitle} ${originalQuery}`, `${originalQuery} details`, `${originalQuery} analysis`];
    }
};

const analyzeSearchResults = async (stepTitle: string, results: SearchResult[]): Promise<string> => {
    if (!results || results.length === 0) return "No relevant information found.";
    
    try {
        const ai = getAiClient();
        const context = results.slice(0, 5).map(r => `Source: ${r.title}\nSnippet: ${r.snippet}`).join('\n\n');
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Analyze these search results specifically for the step: "${stepTitle}".
            Extract key facts, figures, and insights.
            Be concise but dense. One short paragraph.
            
            Context:
            ${context}`,
        });
        return response.text || "Analyzed search results.";
    } catch (e) {
        return "Processed search results.";
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
    const stepFindings: string[] = [];

    const plan = await generatePlan(query);
    
    // Convert plan strings to Step objects
    plan.forEach((title, idx) => {
        steps.push({
            id: `step-${idx}`,
            title,
            status: 'pending',
            queries: [],
            sources: []
        });
    });
    
    // Ensure we have a final synthesis step if not present
    if (!plan.some(p => p.toLowerCase().includes('synthesis') || p.toLowerCase().includes('report'))) {
        steps.push({ id: 'step-final', title: 'Synthesizing Deep Research Report', status: 'pending', queries: [], sources: [] });
    }
    
    onStepsUpdate([...steps]);

    for (let i = 0; i < steps.length; i++) {
        // Special case for the final synthesis step - just a visual delay
        if (i === steps.length - 1 && steps[i].title.includes('Synthesizing')) {
             steps[i].status = 'in-progress';
             onStepsUpdate([...steps]);
             await new Promise(r => setTimeout(r, 1500)); // Visual "Thinking" pause
             steps[i].status = 'completed';
             onStepsUpdate([...steps]);
             continue;
        }

        steps[i].status = 'in-progress';
        onStepsUpdate([...steps]);

        // 1. Generate Queries
        const queries = await generateQueriesForStep(steps[i].title, query);
        steps[i].queries = queries;
        onStepsUpdate([...steps]);

        // 2. Execute Searches (Exa Fast)
        // We use the first query primarily, but maybe parallelize if needed. 
        // For speed, we just take the top 2 queries max.
        const activeQueries = queries.slice(0, 2);
        const searchPromises = activeQueries.map(q => searchFast(q));
        const results = await Promise.all(searchPromises);
        
        const stepSources: SearchResult[] = [];
        results.forEach(r => {
            if (r.results) stepSources.push(...r.results);
        });

        // Unique filter
        const uniqueSources = stepSources.filter((s, index, self) => 
            index === self.findIndex((t) => (t.link === s.link))
        );

        steps[i].sources = uniqueSources;
        allSources.push(...uniqueSources);
        onStepsUpdate([...steps]);

        // 3. Deep Analysis (Thinking Phase)
        if (uniqueSources.length > 0) {
            const finding = await analyzeSearchResults(steps[i].title, uniqueSources);
            steps[i].finding = finding;
            stepFindings.push(`Step: ${steps[i].title}\nFindings: ${finding}`);
        } else {
            steps[i].finding = "No sufficient data found, proceeding to next step.";
        }
        
        steps[i].status = 'completed';
        onStepsUpdate([...steps]);
    }

    // Final Deduplication
    const finalUniqueSources = allSources.filter((s, index, self) => 
        index === self.findIndex((t) => (t.link === s.link))
    );

    // Pass the accumulated findings to the final generator for a "Deep Think" answer
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
        (full, widget, related) => {},
        stepFindings.join('\n\n') // Pass findings as extra context
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
  onComplete?: (fullContent: string, widget: WidgetData | undefined, relatedQuestions: string[]) => void,
  deepFindings?: string // Optional extra context from Pro Search
): Promise<void> => {
  
  // RAG Context Construction
  const now = new Date();
  const currentDateTime = now.toLocaleString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
  });
  const hasResults = searchResults.length > 0;

  let ragContext = hasResults 
      ? searchResults.map((r, i) => `CITATION [${i+1}] ${r.title}\nURL: ${r.link}\nCONTENT: ${r.snippet}`).join('\n\n')
      : "No external context provided. Rely on internal knowledge.";

  // Inject Deep Research Findings if available
  if (deepFindings) {
      ragContext = `DEEP RESEARCH FINDINGS (Prioritize these insights):\n${deepFindings}\n\nRAW SOURCES:\n${ragContext}`;
  }

  const strictFormatInstructions = `
  FORMATTING RULES (STRICT):
  1. **Structure**: Start directly with the answer. Use ### Headers for sections.
  2. **Citations**: You MUST use inline citations like [1], [2]. **IMPORTANT**: Place citations at the END of sentences or paragraphs.
  3. **Tone**: Objective, professional, yet conversational.
  4. **Date**: Today is ${currentDateTime}.
  5. **Formatting**: Use strict bullet points for lists. Ensure H3 headers are used for sub-sections.
  6. **Length**: Provide a comprehensive, detailed report. Deeply explain the concepts, but stay focused. (Long but not too long).
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
