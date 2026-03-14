
import Groq from "groq-sdk";

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

  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

  // Configuration for specific models
  // Fast response settings: Slightly higher temp for fluidity, ample tokens to prevent cut-off but not excessive.
  let temperature = 0.6;
  let max_tokens = 4096;
  let reasoning_effort: "low" | "medium" | "high" | undefined = undefined;

  if (modelId === 'openai/gpt-oss-120b') {
      temperature = 0.8;
      max_tokens = 4096;
      reasoning_effort = "medium"; // Enable reasoning for GPT OSS
  } else if (modelId === 'moonshotai/kimi-k2-instruct-0905') {
      temperature = 0.6; // Balanced for structured, cited answers
      max_tokens = 4096;
  } else if (modelId === 'meta-llama/llama-4-scout-17b-16e-instruct') {
      temperature = 0.7; 
      max_tokens = 4096; 
  } else if (modelId === 'qwen/qwen3-32b') {
      temperature = 0.7;
      max_tokens = 4096;
  }

  const params: any = {
    model: modelId,
    messages: messages,
    stream: true,
    temperature: temperature,
    max_completion_tokens: max_tokens,
    top_p: 1,
    stop: null
  };

  // Only add reasoning_effort if the model supports it (like GPT OSS)
  if (reasoning_effort) {
      params.reasoning_effort = reasoning_effort;
  }

  try {
    const completion = await groq.chat.completions.create(params);

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        onChunk(content);
      }
    }
  } catch (error: any) {
    console.warn('Groq Streaming Error:', error.message);
    throw error;
  }
};