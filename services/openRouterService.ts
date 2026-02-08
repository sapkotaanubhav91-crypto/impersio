
// Use environment variable for key, do not hardcode.
const getOpenRouterKey = () => {
    // Vite 'define' replaces process.env.OPENROUTER_API_KEY with the actual string value during build.
    // We must access it directly without checking 'typeof process'.
    const key = process.env.OPENROUTER_API_KEY;
    if (key && key.length > 0) return key;
    return undefined;
};

export const streamOpenRouter = async (
  messages: any[],
  modelId: string,
  onChunk: (text: string) => void
) => {
  const apiKey = getOpenRouterKey();

  if (!apiKey) {
      console.warn("OpenRouter API Key missing");
      throw new Error("OpenRouter API Key is not configured.");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Dynamic origin to satisfy CORS requirements while working in different environments
        "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "https://impersio.me",
        "X-Title": "Impersio"
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        stream: true,
        include_reasoning: true // Ensure DeepSeek models return reasoning
      })
    });

    if (!response.ok) {
        let errorText = "";
        try {
            errorText = await response.text();
        } catch (e) {
            errorText = response.statusText;
        }
        throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Process all complete lines
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const json = JSON.parse(data);
            const content = json.choices[0]?.delta?.content || '';
            // Some models return reasoning in a separate field (DeepSeek R1 beta)
            // But we primarily rely on content stream containing <think> tags for standard R1.
            // If there's explicit reasoning field, we append it with tags to normalize.
            if (json.choices[0]?.delta?.reasoning) {
               onChunk(`<think>${json.choices[0].delta.reasoning}</think>`);
            } else if (content) {
               onChunk(content);
            }
          } catch (e) {
            // Ignore parsing errors for partial chunks
          }
        }
      }
    }
  } catch (error: any) {
    console.error('OpenRouter Streaming Error:', error);
    throw error;
  }
};
