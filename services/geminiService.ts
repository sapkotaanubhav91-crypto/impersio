
import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, WidgetData, Message, ProSearchStep } from "../types";
import { searchFast } from './googleSearchService';
import { streamCerebras, CerebrasMessage } from './cerebrasService';
import { streamOpenRouter } from './openRouterService';
import { streamGroq } from './groqService';

// Safe access to environment variable to prevent "process is not defined" crashes in browser
const getApiKey = () => {
    try {
        if (typeof process !== 'undefined' && process.env) {
            return process.env.API_KEY;
        }
    } catch (e) {
        // Ignore errors if process is not available
    }
    return undefined;
};

// Lazily initialize to avoid top-level failures if API_KEY is missing
const getAiClient = () => new GoogleGenAI({ apiKey: getApiKey() || "dummy_key" });

// --- Search Router ---

export const shouldSearch = async (query: string): Promise<boolean> => {
    // Quick local checks for obvious cases
    const lower = query.toLowerCase().trim();
    if (lower.length < 5) return false;
    if (['hi', 'hello', 'hey', 'help', 'who are you', 'what is this', 'good morning', 'good evening'].includes(lower)) return false;
    
    // LLM Check (Fast Model)
    try {
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
        return result.search ?? true; // Default to true if unsure
    } catch(e) {
        return true; // Default to search on error to be safe
    }
};

const classifyComplexity = async (query: string): Promise<'NORMAL' | 'MEDIUM' | 'HARD' | 'RESEARCH'> => {
  try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `Classify the complexity/type of this user query.
          
          Query: "${query}"
          
          Definitions:
          - NORMAL: Simple greetings, factual questions, simple calculations, quick summaries.
          - MEDIUM: Creative writing, nuanced explanations, code debugging, comparison.
          - HARD: Complex reasoning, math proofs, advanced coding, multi-step analysis.
          - RESEARCH: Deep dive topics, academic questions, history, detailed reports, extensive data lookup.
          
          Return JSON: { "complexity": "NORMAL" | "MEDIUM" | "HARD" | "RESEARCH" }`,
          config: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: { complexity: { type: Type.STRING, enum: ['NORMAL', 'MEDIUM', 'HARD', 'RESEARCH'] } }
              }
          }
      });
      const result = JSON.parse(response.text || "{}");
      return result.complexity || 'NORMAL';
  } catch(e) {
      return 'NORMAL';
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
        console.error("Plan generation failed", e);
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

    // 1. Plan
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
    // Add a final wrapping up step if not present
    if (!plan.some(p => p.toLowerCase().includes('wrap') || p.toLowerCase().includes('summary'))) {
        steps.push({ id: 'step-final', title: 'Wrapping up', status: 'pending', queries: [], sources: [] });
    }
    
    onStepsUpdate([...steps]);

    // 2. Execute Loop
    for (let i = 0; i < steps.length; i++) {
        // Skip final wrapper for actual searching usually, unless plan was short
        if (steps[i].title === 'Wrapping up' && i === steps.length - 1) {
             steps[i].status = 'in-progress';
             onStepsUpdate([...steps]);
             await new Promise(r => setTimeout(r, 600)); // Visual pause
             steps[i].status = 'completed';
             onStepsUpdate([...steps]);
             continue;
        }

        steps[i].status = 'in-progress';
        onStepsUpdate([...steps]);

        // Generate Queries
        const queries = await generateQueriesForStep(steps[i].title, query);
        steps[i].queries = queries;
        onStepsUpdate([...steps]);

        // Execute Search (Parallel)
        // We limit to 2 queries per step to be fast
        const searchPromises = queries.slice(0, 2).map(q => searchFast(q));
        const results = await Promise.all(searchPromises);
        
        const stepSources: SearchResult[] = [];
        results.forEach(r => {
            if (r.results) stepSources.push(...r.results);
        });

        // Deduplicate
        const uniqueSources = stepSources.filter((s, index, self) => 
            index === self.findIndex((t) => (t.link === s.link))
        );

        steps[i].sources = uniqueSources;
        allSources.push(...uniqueSources);
        
        steps[i].status = 'completed';
        onStepsUpdate([...steps]);
    }

    // 3. Final Answer
    // We reuse the streamResponse logic with isReasoningEnabled = true to trigger Deep Research mode
    await streamResponse(
        query,
        modelId,
        history,
        allSources,
        [], // no attachments for now
        true, // Enable Deep Research / Pro Search mode
        false, // isMobile
        (chunk) => onComplete(chunk, allSources), // Using partial updates as "Complete" for streaming effect
        () => {}, // widget
        () => {}, // related
        (full, widget, related) => {
            // Final callback if needed
        }
    );
};

// --- Existing Functions (Preserved & Updated) ---

export const generateManualQueries = (prompt: string): string[] => {
    const base = prompt.trim();
    return [
        base,                                      
        `${base} latest news`,            
        `${base} analysis`,   
        `${base} key details`      
    ];
};

export const rewriteQuery = async (currentQuery: string, history: Message[]): Promise<string> => {
    if (history.length === 0) return currentQuery;
    try {
        const ai = getAiClient();
        const recentHistory = history.slice(-2)
            .filter(m => m && m.role && m.content) // Safety check for invalid history items
            .map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
            
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash', 
            contents: `Rewrite the USER'S LAST QUERY into a standalone Google search query based on history.
HISTORY:
${recentHistory}
USER'S LAST QUERY:
"${currentQuery}"
REWRITTEN QUERY:`,
            config: { maxOutputTokens: 30, temperature: 0 }
        });
        return response.text?.trim() || currentQuery;
    } catch (e) {
        return currentQuery;
    }
};

export const generateSearchQueries = async (prompt: string): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', 
      contents: `Generate 5 high-value Google search queries for: "${prompt}". Return JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [prompt];
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
  try {
    const now = new Date();
    // Use a robust date format with time to prevent hallucinations
    const currentDateTime = now.toLocaleString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short' 
    });
    const hasResults = searchResults.length > 0;

    // RAG: Format context for the model
    const ragContext = hasResults 
        ? searchResults.map((r, i) => `CITATION [${i+1}] ${r.title}\nURL: ${r.link}\nCONTENT: ${r.snippet}`).join('\n\n')
        : "No external context provided. Rely on internal knowledge.";

    // STRUCTURE INSTRUCTIONS - MEDIUM LENGTH (250-500 Words)
    const strictFormatInstructions = `
    FORMATTING RULES (STRICT - MEDIUM LENGTH):
    1. **Length Guidelines**: 
       - **Target Range**: 250-500 words for explanations, guides, and analysis.
       - **Simple Queries**: 200-300 words (Facts + 1 example/context).
       - **Complex Queries**: 350-500 words (Intro, 3-5 key sections, conclusion/tips).
    2. **Structure & Visuals**: 
       - **Opening**: Start directly with a concise answer/summary.
       - **Headers**: Use ### Headers to break down topics clearly.
       - **Lists**: Use bullet points (*) heavily for readability.
       - **Tables**: MUST generate a Markdown table for comparisons, pros/cons, or data specs when relevant.
       - **Sentences**: Keep sentences concise (15-25 words).
    3. **Content**:
       - **Substance**: Explain *why* and *how*, don't just list facts.
       - **Examples**: Include brief examples where helpful.
    4. **Citations (CRITICAL)**:
       - You MUST use the provided [CITATION] index for every fact retrieved.
       - Format: "The sky is blue [1]."
       - Citations go at the end of the sentence or clause.
    5. **Tone**: Objective, journalistic, and informative.
    `;

    const deepResearchInstructions = `
    MODE: DEEP RESEARCH REPORT
    GOAL: Comprehensive analysis with RAG (Retrieval Augmented Generation).
    
    STRUCTURE:
    - Executive Summary
    - Detailed Analysis (### Headers)
    - Key Findings (Bulleted)
    - Conclusion
    
    Use inline citations [1], [2] rigorously.
    `;

    const systemInstruction = `You are Impersio, a minimalist AI search engine.
    Current System Time: ${currentDateTime}.
    
    CRITICAL INSTRUCTION: For any questions about the current time or date, you MUST use the "Current System Time" provided above as your reference anchor. Calculate timezones relative to this time. Do not use your training data cutoff.
    
    ${isReasoningEnabled ? deepResearchInstructions : strictFormatInstructions}

    RAG CONTEXT (Use these sources to answer):
    ${ragContext}

    GUIDELINES:
    - Answer the user's query directly using the RAG CONTEXT.
    - If the user greeting (hi, hello), just respond politely and briefly.
    - **Repetition Ban**: Generate each fact once.
    
    WIDGETS (Only if requested):
    - ///WEATHER: Location///
    - ///STOCK: Symbol///
    - ///SLIDES: JSON///
    
    RELATED QUESTIONS:
    At the end, output: ///RELATED: ["Q1", "Q2", "Q3"]///
    `;

    let fullStreamText = "";
    let widgetParsed = false;
    let relatedParsed = false;
    let capturedWidget: WidgetData | undefined = undefined;
    let capturedRelatedQuestions: string[] = [];

    const processChunk = (text: string) => {
      fullStreamText += text;
      
      // Widget Logic
      if (!widgetParsed && fullStreamText.includes("///") && fullStreamText.indexOf("///", fullStreamText.indexOf("///") + 3) !== -1) {
         const start = fullStreamText.indexOf("///");
         const end = fullStreamText.indexOf("///", start + 3);
         const tag = fullStreamText.substring(start + 3, end);
         if (tag.startsWith("WEATHER:")) {
             capturedWidget = { type: 'weather', data: { location: tag.replace("WEATHER:", "").trim() } };
             onWidget(capturedWidget);
             widgetParsed = true;
         } else if (tag.startsWith("STOCK:")) {
             capturedWidget = { type: 'stock', data: { symbol: tag.replace("STOCK:", "").trim() } };
             onWidget(capturedWidget);
             widgetParsed = true;
         } else if (tag.startsWith("SLIDES:")) {
             try {
                capturedWidget = { type: 'slides', data: JSON.parse(tag.replace("SLIDES:", "").trim()) };
                onWidget(capturedWidget!);
                widgetParsed = true;
             } catch(e) {}
         }
      }

      // Related Questions Logic
      if (!relatedParsed && fullStreamText.includes("///RELATED:")) {
          const start = fullStreamText.indexOf("///RELATED:");
          const end = fullStreamText.indexOf("///", start + 11);
          if (end !== -1) {
              try {
                  const json = fullStreamText.substring(start + 11, end);
                  const questions = JSON.parse(json);
                  capturedRelatedQuestions = questions;
                  onRelated(questions);
                  relatedParsed = true;
              } catch(e) {}
          }
      }

      // Clean Output
      let cleanText = fullStreamText;
      if (widgetParsed) cleanText = cleanText.replace(/\/\/\/.*?\/\/\//s, "").trimStart();
      if (relatedParsed) cleanText = cleanText.substring(0, cleanText.indexOf("///RELATED:")).trimEnd();
      else if (cleanText.includes("///RELATED:")) cleanText = cleanText.substring(0, cleanText.indexOf("///RELATED:")).trimEnd();

      onChunk(cleanText);
    };

    const finishStream = () => {
        let final = fullStreamText;
        if (widgetParsed) final = final.replace(/\/\/\/.*?\/\/\//s, "").trimStart();
        if (final.includes("///RELATED:")) final = final.substring(0, final.indexOf("///RELATED:")).trimEnd();
        if (onComplete) onComplete(final, capturedWidget, capturedRelatedQuestions);
    };

    const cleanHistory = history.filter(m => m.content && m.content.trim().length > 0);

    // AUTO MODE ROUTING
    let activeModelName = modelName;
    if (activeModelName === 'auto') {
        // No status message sent to onChunk, keeping UI clean (showing logo/loader)
        const complexity = await classifyComplexity(prompt);
        
        let primaryModel = '';
        let fallbackModel = '';

        if (complexity === 'HARD' || complexity === 'RESEARCH') {
            // Hard/Research: Use GLM 4.7 (Cerebras) or Gemini 3
            primaryModel = 'zai-glm-4.7';
            fallbackModel = 'gemini-3-flash-preview'; 
        } else if (complexity === 'MEDIUM') {
            // Medium: Use Moonshot Kimi (Groq) or Llama 4
            primaryModel = 'moonshot-v1';
            fallbackModel = 'llama-4-scout';
        } else {
            // Normal: Use Llama 4 (Groq) or Gemini Flash
            primaryModel = 'llama-4-scout';
            fallbackModel = 'gemini-2.0-flash';
        }

        // Try Primary
        try {
            await invokeModelStream(primaryModel, prompt, cleanHistory, systemInstruction, processChunk);
            finishStream();
            return;
        } catch (e) {
            console.warn(`Primary model ${primaryModel} failed, falling back to ${fallbackModel}`, e);
            // No error message sent to UI, just silently switch to fallback
            activeModelName = fallbackModel; 
        }
    }

    // Direct Execution (or Fallback execution)
    try {
        await invokeModelStream(activeModelName, prompt, cleanHistory, systemInstruction, processChunk);
        finishStream();
    } catch (e: any) {
        console.error("Model execution failed", e);
        onChunk(`\n\nError: ${e.message || "Failed to generate response."}`);
    }

  } catch (error: any) {
    onChunk("Error: " + error.message);
  }
};

// Helper function to invoke specific model logic
const invokeModelStream = async (
    modelId: string, 
    prompt: string, 
    history: Message[], 
    systemInstruction: string, 
    onChunk: (text: string) => void
) => {

    // GLM 4.7 (Cerebras)
    if (modelId === 'zai-glm-4.7') {
      const messages: CerebrasMessage[] = [
        { role: 'system', content: systemInstruction },
        ...history.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        } as CerebrasMessage)),
        { role: 'user', content: prompt }
      ];
      await streamCerebras(messages, 'zai-glm-4.7', onChunk);
      return;
    }

    // DeepSeek R1 (OpenRouter)
    if (modelId === 'deepseek-r1') {
      const messages = [
        { role: 'system', content: systemInstruction },
        ...history.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        { role: 'user', content: prompt }
      ];
      await streamOpenRouter(messages, 'deepseek/deepseek-r1:free', onChunk);
      return;
    }

    // Moonshot Kimi (Groq)
    if (modelId === 'moonshot-v1') {
      const messages = [
        { role: 'system', content: systemInstruction },
        ...history.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        { role: 'user', content: prompt }
      ];
      await streamGroq(messages, 'moonshotai/kimi-k2-instruct-0905', onChunk);
      return;
    }

    // Llama 4 Scout (Groq)
    if (modelId === 'llama-4-scout') {
      const messages = [
        { role: 'system', content: systemInstruction },
        ...history.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        { role: 'user', content: prompt }
      ];
      await streamGroq(messages, 'meta-llama/llama-4-scout-17b-16e-instruct', onChunk);
      return;
    }

    // Default: Gemini
    const ai = getAiClient();
    const messagesPayload = [
        ...history.map(m => ({ 
            role: m.role === 'assistant' ? 'model' : 'user', 
            parts: [{ text: m.content }] 
        })),
        { role: 'user', parts: [{ text: prompt }] }
    ];
    
    // Fallback to Flash if preview not available or error occurs
    const targetModel = modelId.includes('gemini') ? modelId : 'gemini-2.0-flash';
    
    const result = await ai.models.generateContentStream({
        model: targetModel,
        contents: messagesPayload,
        config: { 
          systemInstruction, 
          maxOutputTokens: 1000 
        }
    });
    for await (const chunk of result) {
        onChunk(chunk.text || "");
    }
};
