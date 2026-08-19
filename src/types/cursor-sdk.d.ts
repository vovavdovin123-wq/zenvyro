declare module "@cursor/sdk" {
  export const Agent: {
    prompt: (
      prompt: string,
      options: Record<string, unknown>,
    ) => Promise<{ id?: string; result?: unknown; prUrl?: string }>;
  };
}
