/**
 * Antigravity Agent Integration Adapter
 * Encapsulates the agent orchestration lifecycle (agent leasing, thought streaming,
 * step execution, and diagnostics) conforming to the Google Antigravity Agent protocol.
 * Serverless-compatible, zero external paid dependencies, vendor decoupled.
 */

export interface AgentThought {
  timestamp: number;
  step: string;
  thought: string;
  status: "thinking" | "executing" | "completed" | "warning";
}

export interface AgentExecutionReport {
  executionId: string;
  durationMs: number;
  thoughts: AgentThought[];
  stepsCompleted: string[];
  success: boolean;
  error?: string;
}

export class AntigravityAdapter {
  private thoughts: AgentThought[] = [];
  private stepsCompleted: string[] = [];
  private startTime: number = Date.now();
  private onThoughtCallback?: (thought: AgentThought) => void;

  constructor(onThought?: (thought: AgentThought) => void) {
    this.onThoughtCallback = onThought;
  }

  public recordThought(step: string, thought: string, status: AgentThought["status"] = "thinking") {
    const entry: AgentThought = {
      timestamp: Date.now(),
      step,
      thought,
      status,
    };
    this.thoughts.push(entry);
    if (this.onThoughtCallback) {
      this.onThoughtCallback(entry);
    }
  }

  public async executeStep<T>(
    stepName: string,
    action: () => Promise<T> | T
  ): Promise<T> {
    this.recordThought(stepName, `Memulai eksekusi langkah: ${stepName}...`, "thinking");
    try {
      const result = await action();
      this.stepsCompleted.push(stepName);
      this.recordThought(stepName, `Selesai: ${stepName} berhasil dijalankan.`, "completed");
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.recordThought(stepName, `Gagal pada ${stepName}: ${msg}`, "warning");
      throw err;
    }
  }

  public getReport(success: boolean, error?: string): AgentExecutionReport {
    return {
      executionId: "ag-" + Date.now().toString(36),
      durationMs: Date.now() - this.startTime,
      thoughts: [...this.thoughts],
      stepsCompleted: [...this.stepsCompleted],
      success,
      error,
    };
  }
}
