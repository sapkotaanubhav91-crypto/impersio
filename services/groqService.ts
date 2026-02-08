
// Use environment variable for key, do not hardcode.
const getGroqApiKey = () => {
    // Vite 'define' replaces this with the string value.
    const key = process.env.GROQ_API_KEY;
    if (key && key.length > 0) return key;
    return undefined;
};

export const streamGroq = async (
  messages: any[],
  modelId: string,
  onChunk: (text: string) => void
) => {
  const apiKey = getGroqApiKey();
  
  if (!apiKey) {
    throw new Error("Groq API Key not configured. Please add GROQ_API_KEY to your env.");
  }

  // Configuration for specific models
  let temperature = 0.6;
  let max_tokens = 4096;
  let reasoning_effort: string | undefined = undefined;

  if (modelId === 'openai/gpt-oss-120b') {
      temperature = 1;
      max_tokens = 8192;
      reasoning_effort = "medium"; // Enable reasoning for GPT OSS
  } else if (modelId === 'moonshotai/kimi-k2-instruct-0905') {
      temperature = 0.6;
      max_tokens = 4096;
  } else if (modelId === 'meta-llama/llama-4-scout-17b-16e-instruct') {
      temperature = 1;
      max_tokens = 1024;
  } else if (modelId === 'qwen/qwen3-32b') {
      temperature = 0.7;
      max_tokens = 4096;
  }

  const body: any = {
    model: modelId,
    messages: messages,
    stream: true,
    temperature: temperature,
    max_completion_tokens: max_tokens,
    top_p: 1
  };

  // Only add reasoning_effort if the model supports it (like GPT OSS)
  if (reasoning_effort) {
      body.reasoning_effort = reasoning_effort;
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
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
    console.warn('Groq Streaming Error:', error.message);
    throw error;
  }
};
