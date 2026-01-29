
const GROQ_API_KEY = "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";

export const streamGroq = async (
  messages: any[],
  modelId: string,
  onChunk: (text: string) => void
) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        stream: true,
        temperature: 0.6,
        max_tokens: 4096,
        top_p: 1
      })
    });

    if (!response.ok) {
        let errorText = "";
        try {
            errorText = await response.text();
        } catch (e) {
            errorText = response.statusText;
        }
        throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
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
    console.error('Groq Streaming Error:', error);
    // Rethrow to allow fallback logic in orchestrator
    throw error;
  }
};
