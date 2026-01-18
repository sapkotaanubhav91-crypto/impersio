import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult, WidgetData } from "../types";

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

const OPENROUTER_API_KEY = "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";
const GROQ_API_KEY = "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";

// Fast heuristic generation to meet 0.10s requirement
export const generateManualQueries = (prompt: string): string[] => {
    const base = prompt.trim();
    return [
        base,                                      // Original intent
        `${base} latest news updates`,            // Recency
        `${base} detailed analysis statistics`,   // Data for slides
        `${base} key features and benefits`,      // Structure
        `${base} future roadmap`                  // Forward looking
    ];
};

export const generateSearchQueries = async (prompt: string): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Use fast model for orchestration
      contents: `You are an expert search query optimizer.
      Generate 5 distinct, high-value Google search queries based on the user's prompt to gather comprehensive information.
      
      Strategy:
      1. Main intent query.
      2. Practical details (costs, logistics, how-to).
      3. Comparisons or "best of" lists.
      4. Recent news or updates related to the topic.
      5. Cultural or contextual aspects (if applicable) or Reddit/Forum discussions.

      User Prompt: "${prompt}"
      
      Return strictly a JSON array of 5 strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [prompt];
    return JSON.parse(text);
  } catch (e) {
    console.error("Query generation failed", e);
    return [prompt];
  }
};

export const streamResponse = async (
  prompt: string, 
  modelName: string, 
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
    const currentDate = now.toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });

    let systemInstruction = "";

    const capabilitiesText = `
    CAPABILITIES & FEATURES:
      1. **Universal Search**: You are an all-in-one AI. You can browse the web, analyze images, summarize YouTube videos (using search results), and generate content.
      2. **Widgets**: You can render interactive cards.
         - Weather: For forecasts (Trigger: ///WEATHER: Location///).
         - Stocks: For market data (Trigger: ///STOCK: Symbol///).
         - Time: For world clocks (Trigger: ///TIME: ...///).
         - Slides: For presentations (Trigger: ///SLIDES: {json}///).
      3. **Presentation Generator**: If the user asks for a presentation, deck, or slides (e.g. "Create a PPT about X"), you MUST generate a ///SLIDES/// widget.
      4. **YouTube Summarizer**: If the user provides a YouTube URL or asks for a video summary, use the provided search context to summarize the video content.
    `;
    
    const formattingRules = `
    FORMATTING RULES (CRITICAL):
    You are Impersio, a minimalist AI search engine.

    OUTPUT STRUCTURE:
    - **Length**: Target 15-25 lines of concise, scannable text (300-500 words).
    - **Tables**: USE MARKDOWN TABLES for comparisons, itineraries, lists of options, or pros/cons.
    - **Tone**: Objective, professional, and dense. Avoid conversational filler.
    - **Citations**: Use inline [1] citations.
    
    LAYOUT:
    1. Direct Answer (2-3 lines).
    2. Data Table (MANDATORY if applicable).
    3. Key Details / Nuances (Bulleted list).
    `;

    // System prompt construction
    if (searchResults.length > 0) {
      // RAG MODE
      const contextString = searchResults.map((result, index) => 
        `[${index + 1}] ${result.title} (${result.link}): ${result.snippet} [Image: ${result.image || 'None'}]`
      ).join("\n\n");

      systemInstruction = `You are Impersio, a minimalist AI search engine. Current Time: ${currentDate}
      ${capabilitiesText}
      
      OBJECTIVE: Provide a well-structured and accurate answer based on the context, optimized for readability.
      
      ${formattingRules}

      RULES:
      1. Cite sources inline like [1].
      2. WIDGETS: Detect intent automatically. Use these formats at the START of your response:
         - Time: ///TIME: HH:MM AM/PM | Weekday, Month DD, YYYY | Location | (Offset)///
         - Weather: ///WEATHER: Location///
         - Stock: ///STOCK: Symbol///
         
         - **SLIDES (IMPORTANT)**: If the user asks for a presentation/slides:
           a) Generate a valid JSON object for ///SLIDES///.
           b) **CONTENT QUALITY**: The content MUST NOT look like generic AI output. Use professional business language, specific data points, dates, and names from the context.
           c) **DETAIL**: Each slide must have 4-6 detailed bullet points.
           d) **IMAGES**: Use the image URLs provided in the context if relevant.
           e) **TEXT RESPONSE**: If you generate slides, keep your normal text response VERY BRIEF (2 sentences max) just to introduce the slides. Do NOT repeat the content.
           
           Format: ///SLIDES: {"title": "Professional Title", "slides": [{"title": "Specific Slide Title", "content": ["Detailed point 1 with data", "Detailed point 2"], "image": "URL_FROM_CONTEXT_OR_NONE"}, {"title": "Data Slide", "content": ["Analysis point"], "chart": {"type": "bar", "title": "Chart Title", "data": [{"label": "A", "value": 10}, {"label": "B", "value": 20}]}}]}///

      3. RELATED QUESTIONS: At the very end of your response, strictly generate 3 related follow-up questions in this format: ///RELATED: ["Question 1", "Question 2", "Question 3"]///
      ${isReasoningEnabled ? '4. REASONING: The user has requested "Deep Reasoning". Think step-by-step, analyze conflicts in data, and provide a comprehensive, logic-driven answer.' : ''}
      
      CONTEXT (25+ sources provided):
      ${contextString}`;
    } else {
      // CONVERSATIONAL MODE
      systemInstruction = `You are Impersio, a minimalist AI search engine. Current Time: ${currentDate}
      ${capabilitiesText}
      
      OBJECTIVE: Provide a helpful answer optimized for readability.
      
      ${formattingRules}
      
      RULES:
      1. WIDGETS: Detect intent automatically. Use these formats at the START of your response if needed:
         - Time, Weather, Stock as defined above.
         - Slides: ///SLIDES: {"title": "Title", "slides": [{"title": "Slide 1", "content": ["Point 1", "Point 2"], "image": "Optional URL"}]}///
      2. RELATED QUESTIONS: At the very end of your response, strictly generate 3 related follow-up questions in this format: ///RELATED: ["Question 1", "Question 2", "Question 3"]///
      ${isReasoningEnabled ? '3. REASONING: The user has requested "Deep Reasoning". Think step-by-step and provide a comprehensive, logic-driven answer.' : ''}`;
    }

    let fullStreamText = "";
    let widgetParsed = false;
    let relatedParsed = false;
    
    // Captured data for completion callback
    let capturedWidget: WidgetData | undefined = undefined;
    let capturedRelatedQuestions: string[] = [];

    const processChunk = (text: string) => {
      fullStreamText += text;
      
      // 1. Handle Widgets (Start of stream)
      if (!widgetParsed && fullStreamText.startsWith("///")) {
        const endTagIndex = fullStreamText.indexOf("///", 3);
        
        if (endTagIndex !== -1) {
          const rawTag = fullStreamText.substring(3, endTagIndex);
          const colonIndex = rawTag.indexOf(":");
          
          if (colonIndex !== -1) {
              const type = rawTag.substring(0, colonIndex).toUpperCase();
              const content = rawTag.substring(colonIndex + 1).trim();

              if (type === 'TIME') {
                  const parts = content.split("|").map(s => s.trim());
                  if (parts.length >= 3) {
                     const wData: WidgetData = {
                       type: 'time',
                       data: {
                         time: parts[0],
                         date: parts[1],
                         location: parts[2],
                         timezone: parts[3] || ''
                       }
                     };
                     capturedWidget = wData;
                     onWidget(wData);
                  }
              } else if (type === 'WEATHER') {
                  const wData: WidgetData = {
                      type: 'weather',
                      data: { location: content }
                  };
                  capturedWidget = wData;
                  onWidget(wData);
              } else if (type === 'STOCK') {
                  const wData: WidgetData = {
                      type: 'stock',
                      data: { symbol: content }
                  };
                  capturedWidget = wData;
                  onWidget(wData);
              } else if (type === 'SLIDES') {
                  try {
                      const slidesData = JSON.parse(content);
                      const wData: WidgetData = {
                          type: 'slides',
                          data: slidesData
                      };
                      capturedWidget = wData;
                      onWidget(wData);
                  } catch (e) {
                      console.error("Failed to parse slides JSON", e);
                  }
              }
              widgetParsed = true;
          }
        }
      }

      // 2. Handle Related Questions (End of stream)
      const relatedStartIndex = fullStreamText.indexOf("///RELATED:");
      if (!relatedParsed && relatedStartIndex !== -1) {
          const relatedEndIndex = fullStreamText.indexOf("///", relatedStartIndex + 11);
          
          if (relatedEndIndex !== -1) {
              const jsonStr = fullStreamText.substring(relatedStartIndex + 11, relatedEndIndex).trim();
              try {
                  const questions = JSON.parse(jsonStr);
                  if (Array.isArray(questions)) {
                      capturedRelatedQuestions = questions;
                      onRelated(questions);
                      relatedParsed = true;
                  }
              } catch (e) {
                  console.error("Failed to parse related questions", e);
              }
          }
      }

      // 3. Determine what to send to onChunk
      let contentToProcess = fullStreamText;
      
      // Strip widget tag if parsed
      if (widgetParsed) {
        const endTagIndex = fullStreamText.indexOf("///", 3);
        if (endTagIndex !== -1) {
            contentToProcess = fullStreamText.substring(endTagIndex + 3).trimStart();
        }
      } else if (fullStreamText.startsWith("///")) {
         // Still buffering widget
         if (fullStreamText.length < 200) return;
      }

      // Strip related tag if present (parsed or not, we don't want to show it)
      const currentRelatedIndex = contentToProcess.indexOf("///RELATED:");
      if (currentRelatedIndex !== -1) {
          contentToProcess = contentToProcess.substring(0, currentRelatedIndex).trimEnd();
      }

      onChunk(contentToProcess);
    };
    
    // Function to handle stream completion
    const finishStream = () => {
        if (onComplete) {
            let finalText = fullStreamText;
            
            if (finalText.startsWith("///")) {
                const endTagIndex = finalText.indexOf("///", 3);
                if (endTagIndex !== -1) {
                    finalText = finalText.substring(endTagIndex + 3).trimStart();
                }
            }
            
            const relIndex = finalText.indexOf("///RELATED:");
            if (relIndex !== -1) {
                finalText = finalText.substring(0, relIndex).trimEnd();
            }
            
            onComplete(finalText, capturedWidget, capturedRelatedQuestions);
        }
    };

    const isGroqModel = [
        'openai/gpt-oss-120b', 
        'moonshotai/kimi-k2-instruct-0905', 
        'meta-llama/llama-4-maverick-17b-128e-instruct', 
        'qwen/qwen3-32b'
    ].includes(modelName);

    // Prepare content object for OpenAI-compatible APIs (Groq/OpenRouter)
    let messagesPayload: any[] = [
        { role: "system", content: systemInstruction }
    ];

    if (attachments.length > 0) {
        const userContent: any[] = [{ type: "text", text: prompt }];
        attachments.forEach(img => {
            userContent.push({
                type: "image_url",
                image_url: { url: img }
            });
        });
        messagesPayload.push({ role: "user", content: userContent });
    } else {
        messagesPayload.push({ role: "user", content: prompt });
    }

    if (isGroqModel) {
        // Groq API Logic
        let maxTokens = 4096;
        let temperature = 0.6;
        let reasoningEffort = undefined;
        let topP = 0.95;

        if (modelName === 'openai/gpt-oss-120b') {
            maxTokens = 8192;
            temperature = 1;
            topP = 1;
            reasoningEffort = isReasoningEnabled ? "high" : "medium"; // Use deep reasoning toggle
        } else if (modelName === 'meta-llama/llama-4-maverick-17b-128e-instruct') {
            maxTokens = 1024;
            temperature = 1;
            topP = 1;
        } else if (modelName === 'moonshotai/kimi-k2-instruct-0905') {
            maxTokens = 4096;
            temperature = 0.6;
            topP = 1;
        } else if (modelName === 'qwen/qwen3-32b') {
            maxTokens = 4096;
            temperature = 0.6;
            topP = 0.95;
            reasoningEffort = "default";
        }

        try {
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
             method: "POST",
             headers: {
               "Authorization": `Bearer ${GROQ_API_KEY}`,
               "Content-Type": "application/json",
             },
             body: JSON.stringify({
               model: modelName,
               messages: messagesPayload,
               stream: true,
               temperature,
               max_completion_tokens: maxTokens,
               top_p: topP,
               reasoning_effort: reasoningEffort 
             })
          });

          if (!response.ok) {
             const errText = await response.text().catch(() => "Unknown error");
             throw new Error(`Groq API Error: ${response.status} - ${errText}`);
          }

          if (!response.body) throw new Error("No response body from Groq");
      
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;
              if (trimmedLine.startsWith('data: ')) {
                const dataStr = trimmedLine.slice(6);
                if (dataStr === '[DONE]') continue;
                try {
                  const data = JSON.parse(dataStr);
                  const content = data.choices[0]?.delta?.content || "";
                  if (content) processChunk(content);
                } catch (e) {}
              }
            }
          }
          finishStream();
        } catch (fetchError: any) {
           throw new Error(`Groq Connection Failed: ${fetchError.message}`);
        }

    } else if (modelName === 'xiaomi/mimo-v2-flash:free') {
      // OpenRouter Logic for Mimo
      let response;
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://impersio.ai", 
            "X-Title": "Impersio" 
          },
          body: JSON.stringify({
            model: modelName,
            messages: messagesPayload,
            stream: true,
            streamOptions: {
              includeUsage: true
            }
          })
        });
      } catch (e: any) {
        throw new Error(`OpenRouter Connection Failed: ${e.message}`);
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`OpenRouter Error ${response.status}: ${errText}`);
      }

      if (!response.body) throw new Error("No response body from OpenRouter");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices[0]?.delta?.content || "";
              if (content) processChunk(content);
            } catch (e) {}
          }
        }
      }
      finishStream();

    } else {
      // Gemini Logic
      try {
        const ai = getAiClient();
        
        let contentsPayload: any = prompt;
        
        if (attachments.length > 0) {
            const parts: any[] = [{ text: prompt }];
            attachments.forEach(img => {
                const matches = img.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    parts.push({ 
                        inlineData: { 
                            mimeType: matches[1], 
                            data: matches[2] 
                        } 
                    });
                }
            });
            contentsPayload = [{ role: 'user', parts }];
        }

        const result = await ai.models.generateContentStream({
            model: modelName,
            contents: contentsPayload,
            config: {
              systemInstruction: systemInstruction,
              thinkingConfig: isReasoningEnabled ? { thinkingBudget: 1024 } : { thinkingBudget: 0 } 
            }
        });

        for await (const chunk of result) {
            const text = chunk.text || "";
            processChunk(text);
        }
        finishStream();
      } catch (error: any) {
          if (error.status === 429 || error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED")) {
              onChunk("⚠️ **Usage Limit Exceeded**\n\nThe AI model is currently unavailable due to high traffic (Quota Exceeded). Please try again in a minute or switch to a different model.");
              return;
          }
          if (error.message?.includes("API key")) {
              onChunk("⚠️ **API Key Error**\n\nThe Google Gemini API key is missing or invalid. Please check your configuration.");
              return;
          }
          throw error;
      }
    }

  } catch (error: any) {
    console.error("AI Error:", error);
    onChunk(`**Connection Error**: ${error.message || "Failed to fetch response"}. \n\nPlease check your internet connection or try a different model.`);
  }
};