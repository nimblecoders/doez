/**
 * Deployment Executor Service
 * Handles the execution of deployment steps across cloud providers
 */

export interface DeploymentStep {
  name: string;
  command: string;
  description?: string;
  continueOnError?: boolean;
}

export interface ExecutionLog {
  timestamp: Date;
  level: "info" | "warning" | "error" | "success";
  message: string;
}

export interface ExecutionResult {
  success: boolean;
  currentStep: number;
  totalSteps: number;
  logs: ExecutionLog[];
  result?: {
    serverId?: string;
    serverIp?: string;
    serverUrl?: string;
    additionalInfo?: Record<string, unknown>;
  };
  error?: string;
}

export class DeploymentExecutor {
  private deploymentId: string;
  private logs: ExecutionLog[] = [];
  private currentStep = 0;

  constructor(deploymentId: string) {
    this.deploymentId = deploymentId;
  }

  /**
   * Add a log entry
   */
  private addLog(
    message: string,
    level: "info" | "warning" | "error" | "success" = "info"
  ): void {
    this.logs.push({
      timestamp: new Date(),
      level,
      message,
    });
  }

  /**
   * Execute a single deployment step
   */
  async executeStep(
    step: DeploymentStep,
    executor: (command: string) => Promise<string>
  ): Promise<boolean> {
    try {
      this.addLog(`Starting step: ${step.name}`, "info");

      const output = await executor(step.command);

      this.addLog(`Step completed: ${step.name}\nOutput: ${output}`, "success");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addLog(
        `Step failed: ${step.name}\nError: ${errorMessage}`,
        "error"
      );

      if (!step.continueOnError) {
        return false;
      }

      this.addLog(
        `Continuing despite failure (continueOnError=true)`,
        "warning"
      );
      return true;
    }
  }

  /**
   * Execute all deployment steps
   */
  async executeDeployment(
    steps: DeploymentStep[],
    executor: (command: string) => Promise<string>,
    onStepComplete?: (current: number, total: number) => Promise<void>
  ): Promise<ExecutionResult> {
    try {
      this.addLog(
        `Starting deployment with ${steps.length} steps`,
        "info"
      );

      for (let i = 0; i < steps.length; i++) {
        this.currentStep = i + 1;

        const step = steps[i];
        const success = await this.executeStep(step, executor);

        if (onStepComplete) {
          await onStepComplete(this.currentStep, steps.length);
        }

        if (!success && !step.continueOnError) {
          return {
            success: false,
            currentStep: this.currentStep,
            totalSteps: steps.length,
            logs: this.logs,
            error: `Deployment failed at step ${this.currentStep}: ${step.name}`,
          };
        }
      }

      this.addLog("Deployment completed successfully", "success");

      return {
        success: true,
        currentStep: this.currentStep,
        totalSteps: steps.length,
        logs: this.logs,
        result: {
          serverId: `server-${this.deploymentId}`,
          serverIp: "0.0.0.0", // Will be populated by actual executor
          serverUrl: "https://example.com", // Will be populated by actual executor
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.addLog(`Deployment error: ${errorMessage}`, "error");

      return {
        success: false,
        currentStep: this.currentStep,
        totalSteps: steps.length,
        logs: this.logs,
        error: errorMessage,
      };
    }
  }

  /**
   * Get current logs
   */
  getLogs(): ExecutionLog[] {
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

export default DeploymentExecutor;
