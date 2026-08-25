import OpenAI from "openai";
import { llm } from "../config";
import { notifyAdmins } from "../telegram";
import { recordUsage } from "../usage";

async function logAgentError(agent: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[zenvyro:${agent}]`, error);
  try {
    await notifyAdmins(`Агент ${agent} упал: ${message}`);
  } catch (notifyError) {
    console.error("[zenvyro:notify]", notifyError);
  }
}

async function note(agent: string, mode: "llm" | "fallback", usage?: {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}) {
  const promptTokens = usage?.promptTokens ?? 0;
  const completionTokens = usage?.completionTokens ?? 0;
  await recordUsage({
    agent,
    model: llm.model,
    promptTokens,
    completionTokens,
    totalTokens: usage?.totalTokens ?? promptTokens + completionTokens,
    mode,
  });
}

export async function runJsonAgent<T>(params: {
  name: string;
  system: string;
  user: string;
  fallback: T;
}): Promise<T> {
  if (!llm.apiKey) {
    await note(params.name, "fallback");
    return params.fallback;
  }

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
    const usage = completion.usage;
    const counted = {
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
    };
    if (!text) {
      await note(params.name, "fallback", counted);
      return params.fallback;
    }
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") {
      await note(params.name, "fallback", counted);
      return params.fallback;
    }
    await note(params.name, "llm", counted);
    return parsed as T;
  } catch (error) {
    await logAgentError(params.name, error);
    await note(params.name, "fallback");
    return params.fallback;
  }
}
