
const OPENROUTER_API_KEY = "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";

export const streamOpenRouter = async (
  messages: any[],
  modelId: string,
  onChunk: (text: string) => void
) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // Dynamic origin to satisfy CORS requirements while working in different environments
        "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "https://impersio.me",
        "X-Title": "Impersio"
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        stream: true
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
            if (content) onChunk(content);
          } catch (e) {
            // Ignore parsing errors for partial chunks
          }
        }
      }
    }
  } catch (error: any) {
    console.error('OpenRouter Streaming Error:', error);
    // Rethrow to allow fallback logic
    throw error;
  }
};
