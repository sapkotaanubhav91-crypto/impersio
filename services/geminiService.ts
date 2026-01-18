import { GoogleGenAI } from "@google/genai";
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
      1. **Search Modes**: You can search the Web, X (Twitter), Reddit, Videos, and perform "Deep Research" or "Fact Checks".
      2. **Widgets**: You can render interactive cards.
         - Weather: For forecasts (Trigger: ///WEATHER: Location///).
         - Stocks: For market data (Trigger: ///STOCK: Symbol///).
         - Time: For world clocks (Trigger: ///TIME: ...///).
      3. **Multi-Model**: You are powered by a swarm of models (Gemini, Llama, Qwen, etc.).
      4. **Multimodal**: You can see and analyze user-uploaded images.
      5. **Privacy-Focused**: You provide direct answers without tracking.
      6. **Device Awareness**: You are currently running on a ${isMobile ? 'Mobile Device' : 'Desktop Computer'}. Adjust your response format for optimal reading on this screen size.
    `;
    
    // Formatting instructions mimicking Perplexity style
    const formattingRules = `
    FORMATTING RULES (CRITICAL):
    Perplexity AI uses a structured Markdown-based formatting system designed for clarity, scannability, and source transparency.

    Core Structure:
    - Responses start with 1-2 concise plain-text sentences.
    - Followed by Markdown headers (## for main sections, ### for subsections).
    - Each section contains 2-3 well-cited sentences with smooth transitions.

    Key Formatting Rules:
    - Lists: Bullets (-) for features/steps; no nesting; one item per line with sentence case and periods when complete.
    - Tables: Markdown tables for comparisons; citations go inline in cells.
    - Citations: format immediately after sentences [1]; max 3 per sentence, no space before bracket.
    - Spacing: Double newlines between paragraphs/sections; single newlines for list items; generous whitespace emphasis.

    Content Guidelines:
    - No opening markdown, summaries, or conclusions.
    - Active voice, plain language, no personal pronouns.
    - Math uses LaTeX.
    - Avoid walls of text—prioritize white space over density.
    `;

    // Optimization: Shorter system prompt for lower latency
    if (searchResults.length > 0) {
      // RAG MODE
      const contextString = searchResults.map((result, index) => 
        `[${index + 1}] ${result.title} (${result.link}): ${result.snippet}`
      ).join("\n\n");

      systemInstruction = `You are Impersio, a minimalist AI search engine. Current Time: ${currentDate}
      ${capabilitiesText}
      
      OBJECTIVE: Provide a well-structured and accurate answer based on the context, optimized for readability.
      
      ${formattingRules}

      RULES:
      1. Cite sources inline like [1].
      2. WIDGETS: DO NOT generate a widget unless explicitly asked. Use these formats at the START of your response ONLY if the user explicitly asks for time, weather, or stock prices:
         - Time: ///TIME: HH:MM AM/PM | Weekday, Month DD, YYYY | Location | (Offset)///
         - Weather: ///WEATHER: Location/// (e.g., ///WEATHER: Paris, France///)
         - Stock/Crypto Price/Chart: ///STOCK: Symbol/// (e.g., ///STOCK: AAPL/// or ///STOCK: BTC-USD///). Use standard tickers.
      3. RELATED QUESTIONS: At the very end of your response, strictly generate 3 related follow-up questions in this format: ///RELATED: ["Question 1", "Question 2", "Question 3"]///
      ${isReasoningEnabled ? '4. REASONING: The user has requested "Deep Reasoning". Think step-by-step, analyze conflicts in data, and provide a comprehensive, logic-driven answer.' : ''}
      
      CONTEXT:
      ${contextString}`;
    } else {
      // CONVERSATIONAL MODE
      systemInstruction = `You are Impersio, a minimalist AI search engine. Current Time: ${currentDate}
      ${capabilitiesText}
      
      OBJECTIVE: Provide a helpful answer optimized for readability.
      
      ${formattingRules}
      
      RULES:
      1. WIDGETS: DO NOT generate a widget unless explicitly asked. Use these formats at the START of your response ONLY if the user explicitly asks for time, weather, or stock prices:
         - Time: ///TIME: HH:MM AM/PM | Weekday, Month DD, YYYY | Location | (Offset)///
         - Weather: ///WEATHER: Location///
         - Stock/Crypto Price/Chart: ///STOCK: Symbol///
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
              }
              widgetParsed = true;
          }
        }
      }

      // 2. Handle Related Questions (End of stream)
      // Check if related tag exists in the buffer
      const relatedStartIndex = fullStreamText.indexOf("///RELATED:");
      if (!relatedParsed && relatedStartIndex !== -1) {
          const relatedEndIndex = fullStreamText.indexOf("///", relatedStartIndex + 11); // 11 is length of "///RELATED:"
          
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
            // Clean up the full text for storage similar to how we display it
            let finalText = fullStreamText;
            
            // Remove widget tag
            if (finalText.startsWith("///")) {
                const endTagIndex = finalText.indexOf("///", 3);
                if (endTagIndex !== -1) {
                    finalText = finalText.substring(endTagIndex + 3).trimStart();
                }
            }
            
            // Remove related tag
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