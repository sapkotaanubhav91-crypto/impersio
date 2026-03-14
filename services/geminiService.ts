import { GoogleGenAI } from "@google/genai";
import { SearchResult, WidgetData, Message, CopilotPayload } from "../types";
import { performMultiSearch } from '../lib/search';
import { streamPollinations } from './pollinationsService';
import { streamGroq } from './groqService';
import { streamOpenRouter } from './openRouterService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateWithRetry = async (params: any, retries = 3, delay = 2000): Promise<any> => {
    try {
        return await ai.models.generateContentStream(params);
    } catch (e: any) {
        if (retries > 0 && (e.status === 429 || e.status === 'RESOURCE_EXHAUSTED' || e.message?.includes('429'))) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(params, retries - 1, delay * 2);
        }
        throw e;
    }
};

// --- SMART QUERY GENERATOR (Scira Strategy) ---
export const generateSearchQueries = async (query: string): Promise<{ queries: string[], plan: string }> => {
    try {
        // Scira-style multi-query generation: 3-4 parallel vectors
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are an expert search strategist.
            User Query: "${query}"
            
            Task: Generate 5 distinct, high-quality search queries to cover this topic comprehensively in parallel.
            
            Vectors:
            1. **Broad/Core**: The main entity or concept (e.g. "Nvidia stock analysis 2025").
            2. **Specific/Data**: Look for numbers, specs, or reports (e.g. "Nvidia Q3 2025 revenue breakdown").
            3. **Recent/News**: Look for the absolute latest updates (e.g. "Nvidia latest news last 7 days").
            4. **Perspective/Analysis**: Look for expert take or market consensus (e.g. "Nvidia stock buy or sell analyst ratings").
            5. **Counter-point/Risk**: Look for potential downsides or alternative views.
            
            Output JSON:
            {
              "plan": "Short strategic summary (max 6 words)",
              "queries": ["q1", "q2", "q3", "q4", "q5"]
            }`,
            config: { responseMimeType: "application/json", temperature: 0.3 }
        });
        
        const text = response.text;
        if (!text) throw new Error("No response from query generator");
        
        const data = JSON.parse(text);
        // Ensure we have at least 3 queries, max 4
        const queries = Array.isArray(data.queries) ? data.queries.slice(0, 4) : [query];
        
        return {
            queries: queries,
            plan: data.plan || "Parallel Search Strategy"
        };
    } catch (e) {
        console.error("Query generation failed", e);
        // Fallback strategy
        return { 
            queries: [
                `${query} overview`, 
                `${query} latest news`, 
                `${query} analysis`,
                `${query} facts`,
                `${query} counter-arguments`
            ], 
            plan: "Multi-vector Search..." 
        };
    }
};

export const generateCopilotStep = async (query: string): Promise<CopilotPayload | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `User Query: "${query}"
            Goal: ask one clarifying question to narrow down the intent.
            Return JSON: { "needs_clarification": boolean, "question": string, "type": "selection" | "text", "options": string[] }`,
            config: { responseMimeType: "application/json", temperature: 0.3 }
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
        return null;
    }
};

export const generatePrediction = async (symbol: string, name: string, history: any[], news: SearchResult[]): Promise<string> => {
    try {
        const historyStr = history.length > 0 
            ? `Recent Price History (last 20 data points):\n${history.slice(-20).map(h => `${h.displayTime}: ${h.value}`).join('\n')}`
            : "No specific price history available (General Trend Analysis).";

        const newsStr = news.map(n => `- ${n.title}: ${n.snippet}`).join('\n');
        
        const prompt = `
        You are an expert AI analyst specializing in market trends, product launches, and global developments.
        Analyze the short-term trend and future outlook for: "${name}" (Context/Symbol: ${symbol}).
        
        ${historyStr}
        
        Recent Intelligence (simulating analysis of 500 sources based on 20 distinct search queries):
        ${newsStr}
        
        Provide a comprehensive trend analysis and prediction.
        Format your response in Markdown. Include sections for:
        - **Executive Summary**: The bottom line.
        - **Trend Analysis**: What is happening right now?
        - **Sentiment Overview**: What are people/experts saying?
        - **Upcoming Developments**: What to expect next (products, events, shifts).
        - **Prediction/Outlook**: Where is this heading in the short-to-medium term?
        
        Keep it professional, analytical, and forward-looking.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
        });
        
        return response.text || "Unable to generate prediction.";
    } catch (e) {
        console.error("Prediction error:", e);
        return "An error occurred while generating the prediction.";
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
  onChunk: (content: string, reasoning?: string) => void,
  onWidget: (widget: WidgetData) => void,
  onRelated: (questions: string[]) => void,
  onComplete?: (fullContent: string, widget: WidgetData | undefined, relatedQuestions: string[]) => void,
  deepFindings?: string,
  onSources?: (sources: SearchResult[]) => void
): Promise<void> => {
  
  const now = new Date();
  const contextResults = searchResults;

  // Build Context Block with Explicit Source Names for Citations
  let ragContext = "";
  if (contextResults.length > 0) {
      ragContext = "VERIFIED SOURCES:\n" + 
        contextResults.map((r, i) => `[${i+1}] Source Name: "${r.displayLink}"\nTitle: ${r.title}\nContent: ${r.snippet}`).join('\n\n');
  }

  if (deepFindings) ragContext = `DEEP DIVE FINDINGS:\n${deepFindings}\n\n${ragContext}`;

  const isResearch = contextResults.length > 0;

  // --- Model Specific Routing ---
  let effectiveModelId = modelName;
  let systemInstruction = "";

  // Impersio Sports: Routes to Kimi K2 with specialized prompts
  if (modelName === 'impersio-sports') {
      effectiveModelId = 'moonshotai/kimi-k2-instruct-0905';
      
      systemInstruction = `
      System: You are Impersio Sports, an expert sports analyst.
      Current Date: ${now.toLocaleString()}
      
      CRITICAL: Give the direct score/answer FIRST. No preamble.
      
      CONTEXT:
      ${ragContext}
      
      FORMAT:
      1. **Direct Answer**: Score or key fact immediately.
      2. **Details**: Bullet points for stats/context.
      3. **Citations**: Use format "Source Name [1]" (e.g. "ESPN [1]").
      `;
  } else if (modelName === 'impersio-travel') {
      effectiveModelId = 'moonshotai/kimi-k2-instruct-0905';
      
      systemInstruction = `
      System: You are Impersio Travel, a world-class travel planner and guide.
      Current Date: ${now.toLocaleString()}
      
      MANDATE:
      1. **Plan First**: If asked for an itinerary, provide a day-by-day breakdown immediately.
      2. **Vibe**: Be inspiring, practical, and knowledgeable. Use emojis for locations (e.g. 🗼 Tokyo).
      3. **Citations**: Use format "Source Name [1]" (e.g. "TripAdvisor [1]").
      
      CONTEXT:
      ${ragContext}
      
      STRUCTURE:
      - **Summary**: 2 sentences on why this destination is great.
      - **Itinerary/Details**: Structured list with times and tips.
      - **Budget**: Estimated costs if available.
      `;
  } else if (modelName === 'moonshotai/kimi-k2-instruct-0905') {
      // Specialized Kimi K2 instruction for general queries
      systemInstruction = `
      System: You are Impersio (powered by Kimi K2), a comprehensive AI assistant.
      Current Date: ${now.toLocaleString()}
      
      GOAL: Provide a medium-length answer (approx 200 words) that is dense with information and highly readable.

      STRUCTURE:
      - **Direct Answer**: Start with a single clear paragraph answering the question.
      - **Key Details**: Use Markdown headers (###) or bullet points for the main evidence.
      - **Context**: Briefly explain the "why" or "how".
      
      CITATION RULES:
      - STRICTLY cite sources using the format: "Source Name [Index]". 
      - Example: "According to Wikipedia [1], the result was..." or "Prices rose by 5% (Bloomberg [2])."
      - Do NOT use standalone numbers like "[1]". Always attach the source name.
      
      CONTEXT:
      ${ragContext}
      `;
  } else {
      // Default System Prompt - PERPLEXITY STYLE
      systemInstruction = `
      System: You are Impersio, an expert AI search engine.
      Current Date: ${now.toLocaleString()}
      
      GOAL: Provide a medium-length, high-quality answer (approx 200-250 words).

      RULES:
      1. **Structure**: 
         - **Executive Summary**: Direct answer in the first paragraph.
         - **Deep Dive**: Use Markdown headers (###) to separate key aspects.
         - **Key Points**: Use bullet points for lists.
      2. **Citations**: 
         - STRICTLY cite sources using the format: "Source Name [Index]".
         - Example: "Reuters [1] reports that..." or "...as seen in the data (CNBC [2])."
         - NEVER use just "[1]".
      3. **Tone**: Objective, professional, and explanatory.
      4. **No Hallucinations**: Only use the provided verified sources.
      
      CONTEXT:
      ${ragContext}
      `;
  }

  const fullPrompt = `
  ${systemInstruction}

  User Query: ${prompt}
  
  Final Output:
  Generate 3 follow-up questions at the very bottom separated by "|||".
  `;

  // --- External Provider Routing ---

  const handleStream = async (streamFn: () => Promise<void>) => {
      let fullRaw = "";
      let hasFinishedThinking = false;
      await streamFn();
  };
  
  // GROQ MODELS
  const groqModels = [
      'openai/gpt-oss-120b',
      'moonshotai/kimi-k2-instruct-0905',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'qwen/qwen3-32b'
  ];

  if (groqModels.includes(effectiveModelId)) {
      try {
          let fullText = "";
          await streamGroq([{ role: 'user', content: fullPrompt }], effectiveModelId, (c) => {
              fullText += c;
              const cleanContent = fullText.replace(/<think>[\s\S]*?<\/think>/, '').trimStart();
              // Parse reasoning if needed
              onChunk(cleanContent.split('|||')[0], undefined);
          });
          const parts = fullText.replace(/<think>[\s\S]*?<\/think>/, '').split('|||');
          if (parts[1]) onRelated(parts[1].split('\n').filter(q => q.length > 5));
          if (onComplete) onComplete(parts[0], undefined, []);
      } catch (e: any) {
          console.error("Groq Error:", e);
          onChunk(`Error connecting to Groq model: ${e.message || "Unknown error"}`, undefined);
      }
      return;
  }

  // OPENROUTER MODELS
  const openRouterModels = [
      'tngtech/deepseek-r1t2-chimera:free'
  ];

  if (openRouterModels.includes(effectiveModelId)) {
      try {
          let fullRaw = "";
          await streamOpenRouter([{ role: 'user', content: fullPrompt }], effectiveModelId, (c) => {
              fullRaw += c;
              // Simple extraction of content after </think> if present, or just content
              const parts = fullRaw.split('</think>');
              const content = parts.length > 1 ? parts[1] : parts[0]; 
              // If starts with <think>, wait.
              if (!fullRaw.startsWith('<think>') || fullRaw.includes('</think>')) {
                  onChunk(content.split('|||')[0], parts.length > 1 ? parts[0].replace('<think>', '') : undefined);
              }
          });
          
          const parts = fullRaw.replace(/<think>[\s\S]*?<\/think>/, '').split('|||');
          if (parts[1]) onRelated(parts[1].split('\n').filter(q => q.length > 5));
          if (onComplete) onComplete(parts[0], undefined, []);
      } catch (e) {
          onChunk("Error connecting to OpenRouter.", undefined);
      }
      return;
  }

  // FALLBACK (Pollinations)
  if (effectiveModelId !== 'gemini-3-flash-preview' && !effectiveModelId.includes('gemini')) {
      try {
          let txt = "";
          await streamPollinations([{ role: 'user', content: fullPrompt }], 'openai', (c) => {
             txt += c;
             onChunk(c.split('|||')[0], undefined);
          });
          const parts = txt.split('|||');
          if (parts[1]) onRelated(parts[1].split('\n').filter(q => q.length > 5));
          if (onComplete) onComplete(parts[0], undefined, []);
      } catch (e) { onChunk("System overloaded. Please try again.", undefined); }
      return;
  }

  // --- Gemini Generation ---
  try {
    let contentsParts: any[] = [{ text: fullPrompt }];
    
    if (attachments && attachments.length > 0) {
        const imageParts = attachments.map(att => ({
            inlineData: { mimeType: att.split(';')[0].split(':')[1], data: att.split(',')[1] }
        }));
        contentsParts = [...imageParts, { text: fullPrompt }];
    }

    const result = await generateWithRetry({
        model: 'gemini-3-flash-preview', 
        contents: [{ role: 'user', parts: contentsParts }]
    });

    let fullText = "";
    for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
            fullText += text;
            const split = fullText.split('|||');
            onChunk(split[0], undefined); 
        }
    }

    const parts = fullText.split('|||');
    if (parts.length > 1) {
        onRelated(parts.slice(1).join('').split('\n').map(q => q.trim()).filter(q => q.length > 5));
    } else {
        onRelated(["Explore deeper", "Related topics", "Why this matters"]);
    }
    if (onComplete) onComplete(parts[0], undefined, []);

  } catch (err: any) {
      console.error("Gemini Error:", err);
  }
};
