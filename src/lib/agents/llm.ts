import OpenAI from "openai";
import { llm } from "../config";

export async function runJsonAgent<T>(params: {
  name: string;
  system: string;
  user: string;
  fallback: T;
}): Promise<T> {
  if (!llm.apiKey) return params.fallback;

  const client = new OpenAI({
    apiKey: llm.apiKey,
    baseURL: llm.baseURL,
  });

  const completion = await client.chat.completions.create({
    model: llm.model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${params.system}\n\nВсегда отвечай только валидным JSON. Агент: ${params.name}.`,
      },
      { role: "user", content: params.user },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) return params.fallback;
  return JSON.parse(text) as T;
}
