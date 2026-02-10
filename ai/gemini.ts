import { GoogleGenAI } from "@google/genai";
import { SearchResult, WidgetData, Message, CopilotPayload } from "../types";
import { searchFast } from '../lib/search';
import { streamPollinations } from '../services/pollinationsService';
import { streamGroq } from '../services/groqService';
import { streamOpenRouter } from '../services/openRouterService';

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

// --- SMART QUERY GENERATOR (The "Thinking" Step) ---
export const generateSearchQueries = async (query: string): Promise<{ queries: string[], plan: string }> => {
    try {
        // This prompt forces the "Official -> News -> Reviews" strategy
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are an expert search strategist.
            User Query: "${query}"
            
            Task: Break this down into 3 distinct Google search queries to get the absolute truth.
            
            Strategy:
            1. **Query 1 (Official/Facts):** Find the official website, documentation, or primary source. Use terms like "official site", "specs", "whitepaper".
            2. **Query 2 (Consensus/Reviews):** Find what real people say. Use terms like "reddit", "reviews", "problems", "vs".
            3. **Query 3 (News/Updates):** Check for very recent changes or news in 2024/2025.
            
            Create a short "Research Plan" (max 6 words).
            
            Return strictly JSON:
            {
              "plan": "string",
              "queries": ["query1", "query2", "query3"]
            }`,
            config: { responseMimeType: "application/json", temperature: 0.3 }
        });
        
        const text = response.text;
        if (!text) throw new Error("No response from query generator");
        
        const data = JSON.parse(text);
        return {
            queries: data.queries.slice(0, 3),
            plan: data.plan || "Deep Research Strategy"
        };
    } catch (e) {
        console.error("Query generation failed", e);
        // Fallback strategy if LLM fails
        return { 
            queries: [
                `${query} official specs`, 
                `${query} reddit reviews problems`, 
                `${query} latest news 2025`
            ], 
            plan: "Triangulating official data and reviews..." 
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

  // Build Context Block with Source Prioritization hints
  let ragContext = "";
  if (contextResults.length > 0) {
      ragContext = "VERIFIED SOURCES:\n" + 
        contextResults.map((r, i) => `[${i+1}] Title: ${r.title}\nContent: ${r.snippet}\nSource: ${r.displayLink}`).join('\n\n');
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
      System: You are Impersio Sports, an expert sports analyst AI powered by Exa and Kimi K2.
      Current Date: ${now.toLocaleString()}
      
      MISSION: Provide the latest sports scores, detailed game analysis, player statistics, and injury updates based on the provided search results.
      
      TONE: Energetic, data-driven, precise, and authoritative.
      
      FORMAT:
      - **Live/Recent Scores**: Always put the score line first in bold if applicable (e.g., **Lakers 112 - Warriors 104**).
      - **Key Stats**: Use bullet points for key player stats.
      - **Analysis**: Provide a brief tactical analysis or context.
      - **Citations**: Strictly cite sources as [1], [2].
      `;
  } else {
      // Default System Prompt
      systemInstruction = `
      System: You are Impersio, a high-intelligence AI search engine.
      Current Date: ${now.toLocaleString()}
      
      ${isResearch ? `
      TASK: Answer the user's question comprehensively (approx 350-400 words).
      
      CONTEXT:
      ${ragContext}
      
      STRICT RESPONSE RULES:
      1. **Trust Hierarchy**: 
         - First, state the *Official* facts/specs from primary sources.
         - Second, contrast this with *User Reviews/Consensus* (Reddit, Forums).
         - Third, mention any recent *News/Updates*.
      
      2. **Format & Length**:
         - **Executive Summary**: 3-4 sentences answering the core question directly.
         - **Detailed Sections**: Use Markdown headers (###) to organize the deep dive.
         - **Length**: The body must be detailed. Do not be brief. Explain the "Why" and "How".
      
      3. **Citations**: 
         - Every single claim must be cited inline using [1], [2].
         - Example: "The device features a 50MP sensor [1], though users report low-light issues [3]."
      
      4. **Tone**: Objective, journalistic, and dense with information.
      ` : `
      TASK: Answer the user's conversational query politely.
      - Keep it under 3 sentences unless asked for more.
      `}
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
  
  // GROQ MODELS (Includes Kimi K2 and Impersio Sports)
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
      } catch (e) {
          onChunk("Error connecting to Groq model. Falling back...", undefined);
      }
      return;
  }

  // OPENROUTER MODELS
  if (effectiveModelId === 'tngtech/deepseek-r1t2-chimera:free') {
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
          // Finalization logic...
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