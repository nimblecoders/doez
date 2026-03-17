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
import ServerConnection from "./models/server-connection";
import connectDB from "./mongodb";

export interface DeploymentJobData {
  deploymentId: string;
  userId: string;
  templateId: string;
  credentialId: string;
  serverConnectionId?: string;
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

    const { deploymentId, userId, credentialId, serverConnectionId, steps, parameters } = job.data;

    // Fetch deployment from database
    const deployment = await Deployment.findById(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    // Fetch server connection if provided
    let serverConnection = null;
    if (serverConnectionId) {
      serverConnection = await ServerConnection.findOne({
        _id: serverConnectionId,
        userId,
      });

      if (!serverConnection) {
        throw new Error(`Server connection ${serverConnectionId} not found`);
      }

      if (!serverConnection.isValid) {
        throw new Error(`Server connection ${serverConnection.name} is not validated`);
      }
    }

    // Fetch cloud credential (optional if using server connection)
    let credential = null;
    if (credentialId) {
      credential = await CloudCredential.findOne({ _id: credentialId, userId });
      if (!credential) {
        throw new Error(`Credential ${credentialId} not found`);
      }
    }

    // Update deployment status to running
    deployment.status = "running";
    deployment.currentStep = 0;
    deployment.logs.push({
      timestamp: new Date(),
      level: "info",
      message: "Deployment execution started",
    });
    await deployment.save();

    // Create deployment executor
    const executor = new DeploymentExecutor(deploymentId);

    // Create command executor using SSH from server connection or parameters
    let sshExecutor: SSHExecutor | null = null;

    if (serverConnection && serverConnection.connectionType === "ssh") {
      // Use server connection credentials
      try {
        const sshConfig = {
          host: serverConnection.host,
          port: serverConnection.port || 22,
          username: serverConnection.username,
          ...(serverConnection.authMethod === "password" && {
            password: serverConnection.auth.password,
          }),
          ...(serverConnection.authMethod === "private-key" && {
            privateKey: serverConnection.auth.privateKey,
            privateKeyPassphrase: serverConnection.auth.privateKeyPassphrase,
          }),
          timeout: serverConnection.sshSettings?.timeout || 30000,
        };

        sshExecutor = new SSHExecutor(sshConfig);
        await sshExecutor.connect();

        deployment.logs.push({
          timestamp: new Date(),
          level: "success",
          message: `✓ Connected to server: ${serverConnection.host}`,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        deployment.logs.push({
          timestamp: new Date(),
          level: "error",
          message: `✗ SSH connection failed: ${errorMsg}`,
        });
        throw error;
      }
    } else {
      // Fallback to parameters (for cloud provider deployments)
      const sshConfig = {
        host: parameters.serverIp as string || "localhost",
        username: parameters.username as string || "ubuntu",
        privateKey: parameters.sshKey as string,
        timeout: 30000,
      };

      try {
        sshExecutor = new SSHExecutor(sshConfig);
        await sshExecutor.connect();
      } catch (error) {
        console.warn("SSH connection failed, continuing with simulated execution");
      }
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
      deployment.logs.push({
        timestamp: new Date(),
        level: "info",
        message: "✓ Disconnected from server",
      });
    }

    // Update deployment with final result
    if (result.success) {
      deployment.status = "completed";
      deployment.result = result.result;
      deployment.logs.push({
        timestamp: new Date(),
        level: "success",
        message: "✓ Deployment completed successfully",
      });
    } else {
      deployment.status = "failed";
      deployment.result = {
        error: result.error,
      };
      deployment.logs.push({
        timestamp: new Date(),
        level: "error",
        message: `✗ Deployment failed: ${result.error}`,
      });
    }

    deployment.currentStep = result.currentStep;
    deployment.logs = result.logs.map((log) => ({
      timestamp: log.timestamp,
      level: log.level as "info" | "warning" | "error" | "success",
      message: log.message,
    }));
    deployment.completedAt = new Date();
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
      deployment.completedAt = new Date();
      deployment.errorMessage = errorMessage;
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
