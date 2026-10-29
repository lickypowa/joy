export type ToolResult = { ok: true; summary: string; data?: unknown } | { ok: false; error: string };
export type ToolContext = { signal?: AbortSignal };
export interface AssistantTool<I = unknown> {
  id: string;
  description: string;
  confirmation: 'never' | 'always';
  validate(input: unknown): input is I;
  execute(input: I, context: ToolContext): Promise<ToolResult>;
}
