export type PermissionMode = 'ask' | 'auto'
export type ApprovalDecision = 'once' | 'always' | 'deny'

interface PendingApproval {
  resolve: (decision: ApprovalDecision) => void
  reject: (error: Error) => void
}

/**
 * Holds the tool calls that wait for a user decision in `ask` mode.
 *
 * The AI SDK approval flow restarts a request after the client answers, which does not fit an
 * agent that runs in the same process as its UI: here the tool simply awaits the decision.
 */
export class ApprovalGate {
  private pending = new Map<string, PendingApproval>()

  /** Resolves when the user decides; rejects if the gate is denied */
  public request(toolCallId: string): Promise<ApprovalDecision> {
    return new Promise((resolve, reject) => {
      this.pending.set(toolCallId, { resolve, reject })
    })
  }

  public decide(toolCallId: string, decision: ApprovalDecision): void {
    const pending = this.pending.get(toolCallId)
    if (!pending) return
    this.pending.delete(toolCallId)
    pending.resolve(decision)
  }

  /** Rejects every waiting request, used when the reply is aborted or a new conversation starts */
  public denyAll(): void {
    for (const pending of this.pending.values()) {
      pending.reject(new Error('The approval request was cancelled'))
    }
    this.pending.clear()
  }
}

export interface ApprovalContext {
  gate: ApprovalGate
  getMode: () => PermissionMode
  allowedTools: Set<string>
  /** Marks the tool part as waiting for the user */
  onAwaiting: (toolCallId: string) => void
  /** Marks the tool part as running once the user allowed it */
  onApproved?: (toolCallId: string) => void
}

/**
 * Wraps a tool so it waits for approval in `ask` mode.
 *
 * A denied tool resolves with `{ denied: true }` instead of throwing, so the model sees the
 * refusal and can adapt. `alwaysAsk` makes the tool wait even in `auto` mode and ignores
 * "always allow", for tools that must never run unattended.
 */
export const withApproval = (name: string, toolDef: any, ctx: ApprovalContext, alwaysAsk = false): any => {
  const execute = toolDef.execute
  if (!execute) return toolDef

  return {
    ...toolDef,
    execute: async (input: any, options: any) => {
      if (alwaysAsk || (ctx.getMode() !== 'auto' && !ctx.allowedTools.has(name))) {
        ctx.onAwaiting(options.toolCallId)
        const decision = await ctx.gate.request(options.toolCallId)
        if (decision === 'deny') {
          return { denied: true, message: 'The user denied this action.' }
        }
        if (decision === 'always' && !alwaysAsk) {
          ctx.allowedTools.add(name)
        }
        ctx.onApproved?.(options.toolCallId)
      }
      return execute(input, options)
    },
  }
}
