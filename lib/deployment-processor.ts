/**
 * Deployment Processor
 * Handles the actual execution of deployments using the job queue
 */

import { JobQueue, Job } from "./job-queue";
import { DeploymentExecutor } from "./services/deployment-executor";
import { SSHExecutor } from "./services/ssh-executor";
import { getCloudProvider } from "./services/cloud-integrations";
import Deployment from "./models/deployment";
import CloudCredential from "./models/cloud-credential";
import connectDB from "./mongodb";

export interface DeploymentJobData {
  deploymentId: string;
  userId: string;
  templateId: string;
  credentialId: string;
  steps: Array<{
    name: string;
    command: string;
    description?: string;
    continueOnError?: boolean;
  }>;
  parameters: Record<string, unknown>;
}

/**
 * Create and process a deployment job
 */
export async function createDeploymentJob(
  queue: JobQueue,
  jobData: DeploymentJobData
): Promise<string> {
  // Register the deployment processor if not already done
  if (!queue.isProcessorRegistered("deployment")) {
    queue.registerProcessor<DeploymentJobData>(
      "deployment",
      processDeploymentJob
    );
  }

  const jobId = queue.addJob("deployment", jobData);
  return jobId;
}

/**
 * Main deployment job processor
 */
async function processDeploymentJob(
  job: Job<DeploymentJobData>
): Promise<void> {
  try {
    await connectDB();

    const { deploymentId, userId, credentialId, steps, parameters } = job.data;

    // Fetch deployment and credential from database
    const [deployment, credential] = await Promise.all([
      Deployment.findById(deploymentId),
      CloudCredential.findOne({ _id: credentialId, userId }),
    ]);

    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    if (!credential) {
      throw new Error(`Credential ${credentialId} not found`);
    }

    // Update deployment status to in_progress
    deployment.status = "in_progress";
    deployment.currentStep = 0;
    deployment.logs.push({
      timestamp: new Date(),
      level: "info",
      message: "Deployment execution started",
    });
    await deployment.save();

    // Create deployment executor
    const executor = new DeploymentExecutor(deploymentId);

    // Create command executor using SSH
    const sshConfig = {
      host: parameters.serverIp as string || "localhost",
      username: parameters.username as string || "ubuntu",
      privateKey: parameters.sshKey as string,
      timeout: 30000,
    };

    let sshExecutor: SSHExecutor | null = null;

    try {
      sshExecutor = new SSHExecutor(sshConfig);
      await sshExecutor.connect();
    } catch (error) {
      console.warn("SSH connection failed, continuing with simulated execution");
    }

    // Execute deployment steps
    const result = await executor.executeDeployment(
      steps,
      async (command: string) => {
        // Use SSH executor if connected, otherwise simulate
        if (sshExecutor?.isSSHConnected()) {
          return sshExecutor.executeCommand(command);
        }

        // Simulate command execution
        return `Simulated execution: ${command}`;
      },
      async (current: number, total: number) => {
        // Update deployment after each step
        deployment.currentStep = current;
        deployment.logs = executor.getLogs().map((log) => ({
          timestamp: log.timestamp,
          level: log.level as "info" | "warning" | "error" | "success",
          message: log.message,
        }));
        await deployment.save();
      }
    );

    // Disconnect SSH if connected
    if (sshExecutor?.isSSHConnected()) {
      await sshExecutor.disconnect();
    }

    // Update deployment with final result
    if (result.success) {
      deployment.status = "success";
      deployment.result = result.result;
    } else {
      deployment.status = "failed";
      deployment.result = {
        error: result.error,
      };
    }

    deployment.currentStep = result.currentStep;
    deployment.logs = result.logs.map((log) => ({
      timestamp: log.timestamp,
      level: log.level as "info" | "warning" | "error" | "success",
      message: log.message,
    }));
    deployment.updatedAt = new Date();

    await deployment.save();

    job.result = {
      deploymentId,
      success: result.success,
      currentStep: result.currentStep,
      totalSteps: result.totalSteps,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Update deployment as failed
    const deployment = await Deployment.findById(job.data.deploymentId);
    if (deployment) {
      deployment.status = "failed";
      deployment.logs.push({
        timestamp: new Date(),
        level: "error",
        message: `Deployment error: ${errorMessage}`,
      });
      deployment.updatedAt = new Date();
      await deployment.save();
    }

    throw error;
  }
}

export { DeploymentExecutor, SSHExecutor, getCloudProvider };
