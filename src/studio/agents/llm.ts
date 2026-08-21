import OpenAI from "openai";
import { llm } from "../config";
import { notifyAdmins } from "../telegram";

async function logAgentError(agent: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[zenvyro:${agent}]`, error);
  try {
    await notifyAdmins(`Агент ${agent} упал: ${message}`);
  } catch (notifyError) {
    console.error("[zenvyro:notify]", notifyError);
  }
}

export async function runJsonAgent<T>(params: {
  name: string;
  system: string;
  user: string;
  fallback: T;
}): Promise<T> {
  if (!llm.apiKey) return params.fallback;

  try {
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
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return params.fallback;
    return parsed as T;
  } catch (error) {
    await logAgentError(params.name, error);
    return params.fallback;
  }
}
