import type { AssistantTool, ToolContext } from '../tools/contracts';
export class ToolRegistry {
  private readonly tools = new Map<string, AssistantTool<any>>();
  register(tool: AssistantTool<any>): void {
    if (this.tools.has(tool.id)) throw new Error(`Duplicate tool: ${tool.id}`);
    this.tools.set(tool.id, tool);
  }
  list(): Pick<AssistantTool, 'id' | 'description' | 'confirmation'>[] { return [...this.tools.values()].map(({ id, description, confirmation }) => ({ id, description, confirmation })); }
  async execute(id: string, input: unknown, context: ToolContext = {}, confirm?: (tool: AssistantTool) => Promise<boolean>) {
    const tool = this.tools.get(id);
    if (!tool) return { ok: false as const, error: 'Azione non disponibile.' };
    if (!tool.validate(input)) return { ok: false as const, error: 'Richiesta non valida.' };
    if (tool.confirmation === 'always' && !(await confirm?.(tool))) return { ok: false as const, error: 'Azione non confermata.' };
    try { return await tool.execute(input, context); } catch { return { ok: false as const, error: 'Non sono riuscita a completare l’azione.' }; }
  }
}
