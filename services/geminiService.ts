
import { GoogleGenAI } from "@google/genai";
import { SearchResult, WidgetData, Message, CopilotPayload } from "../types";
import { searchFast } from './googleSearchService';
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
  
  // --- DIRECT CONTEXT (No RAG Latency) ---
  const contextResults = searchResults;

  // Build Context Block
  let ragContext = "";
  if (contextResults.length > 0) {
      ragContext = "VERIFIED SOURCES:\n" + 
        contextResults.map((r, i) => `[${i+1}] Title: ${r.title}\nContent: ${r.snippet}\nSource: ${r.displayLink}`).join('\n\n');
  } else {
      ragContext = "No external context available. Answer from internal knowledge.";
  }

  if (deepFindings) ragContext = `DEEP DIVE FINDINGS:\n${deepFindings}\n\n${ragContext}`;

  const fullPrompt = `
  System: You are Impersio, a high-intelligence search engine.
  Current Date: ${now.toLocaleString()}
  
  Task: Answer the user's query based STRICTLY on the provided sources.
  
  ${ragContext}

  User Query: ${prompt}
  
  Guidelines:
  1. **Citation:** You MUST cite your sources using [1], [2] notation immediately after the claim.
  2. **Structure:** Use clean Markdown. Start with a direct answer. Use bolding for key concepts.
  3. **Tone:** Professional, concise, objective, and "human" (avoid robotic transitions like "Here is the answer").
  4. **Unknowns:** If the sources do not contain the answer, explicitly state that the information is not in the retrieved context.
  
  Final Output:
  Generate 3 follow-up questions at the very bottom separated by "|||".
  `;

  // --- External Provider Routing ---

  // Helper to handle standard stream response and split reasoning if present (e.g. <think> tags)
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

  if (groqModels.includes(modelName)) {
      try {
          let fullText = "";
          let fullReasoning = "";

          await streamGroq([{ role: 'user', content: fullPrompt }], modelName, (c) => {
              // Check if Groq sends reasoning in a specific way or if we need to parse <think>
              // For now, assuming standard text stream, we check for <think> tags which some models use.
              fullText += c;
              
              // Simple regex parser for <think> tags
              const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/);
              if (thinkMatch) {
                  fullReasoning = thinkMatch[1];
                  // Remove the think block from displayed content
                  const cleanContent = fullText.replace(/<think>[\s\S]*?<\/think>/, '').trimStart();
                  onChunk(cleanContent.split('|||')[0], fullReasoning);
              } else if (fullText.includes('<think>')) {
                  // Currently thinking, partial match
                  const parts = fullText.split('<think>');
                  if (parts[1]) {
                      onChunk("", parts[1]); // Send strictly reasoning
                  }
              } else {
                  onChunk(fullText.split('|||')[0], undefined);
              }
          });

          // Final cleanup
          const thinkMatch = fullText.match(/<think>([\s\S]*?)<\/think>/);
          let finalContent = fullText;
          if (thinkMatch) {
              finalContent = fullText.replace(/<think>[\s\S]*?<\/think>/, '').trimStart();
          }

          const parts = finalContent.split('|||');
          if (parts[1]) onRelated(parts[1].split('\n').filter(q => q.length > 5));
          if (onComplete) onComplete(parts[0], undefined, []);
      } catch (e) {
          onChunk("Error connecting to Groq model. Falling back...", undefined);
          console.error(e);
      }
      return;
  }

  // OPENROUTER MODELS (DeepSeek R1t2)
  if (modelName === 'tngtech/deepseek-r1t2-chimera:free') {
      try {
          let fullRaw = "";
          await streamOpenRouter([{ role: 'user', content: fullPrompt }], modelName, (c) => {
              fullRaw += c;
              
              // DeepSeek R1 typically outputs <think> content </think> answer
              const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/;
              const match = fullRaw.match(thinkRegex);
              
              let reasoning = "";
              let content = fullRaw;

              if (match) {
                  reasoning = match[1];
                  // If we have a closing tag, content is everything after
                  if (match[0].endsWith('</think>')) {
                      content = fullRaw.replace(match[0], '').trimStart();
                  } else {
                      // We are still inside the think tag, so content is empty
                      content = "";
                  }
              }
              
              onChunk(content.split('|||')[0], reasoning);
          });
          
          // Post-processing
          const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/;
          const match = fullRaw.match(thinkRegex);
          let finalContent = fullRaw;
          if (match && match[0].endsWith('</think>')) {
             finalContent = fullRaw.replace(match[0], '').trimStart();
          }

          const parts = finalContent.split('|||');
          if (parts[1]) onRelated(parts[1].split('\n').filter(q => q.length > 5));
          if (onComplete) onComplete(parts[0], undefined, []);
      } catch (e) {
          onChunk("Error connecting to OpenRouter model.", undefined);
          console.error(e);
      }
      return;
  }

  // FALLBACK (Pollinations)
  if (modelName !== 'gemini-3-flash-preview' && !modelName.includes('gemini')) {
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
      // Fallback logic could go here if Gemini fails
  }
};
