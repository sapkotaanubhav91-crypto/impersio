
const CEREBRAS_API_KEY = 'csk-hp83nkhheddc2k3e39w483cjmtn6wkn5ye23rm2ft4kdwetk';

export interface CerebrasMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const streamCerebras = async (
  messages: CerebrasMessage[],
  modelId: string,
  onChunk: (text: string) => void
) => {
  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: modelId,
        stream: true,
        messages: messages,
        max_completion_tokens: 65000,
        temperature: 1,
        top_p: 0.95
      })
    });

    if (!response.ok) {
      throw new Error(`Cerebras API Error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
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
  } catch (error) {
    console.error('Cerebras Streaming Error:', error);
    // Rethrow to allow fallback logic
    throw error;
  }
};
