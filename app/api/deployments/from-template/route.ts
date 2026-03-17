/**
 * Template-Driven Deployment Integration
 * Shows how to integrate JSON templates with Phase 7 deployment engine
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getTemplateManager } from "@/lib/services/template-manager";
import { createDeploymentJob } from "@/lib/deployment-processor";
import { getGlobalJobQueue } from "@/lib/job-queue";
import connectDB from "@/lib/mongodb";
import Deployment from "@/lib/models/deployment";
import CloudCredential from "@/lib/models/cloud-credential";
import ServerConnection from "@/lib/models/server-connection";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

let templateManagerInitialized = false;

async function ensureTemplatesLoaded() {
  if (!templateManagerInitialized) {
    const manager = getTemplateManager();
    await manager.loadAllTemplates();
    templateManagerInitialized = true;
  }
}

/**
 * POST /api/deployments/from-template
 * Deploy using a template with parameters
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const body = await request.json();
    const { templateId, templateParams, credentialId, serverConnectionId } = body;

    if (!templateId || !templateParams) {
      return NextResponse.json(
        {
          success: false,
          error: "templateId and templateParams are required",
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    await ensureTemplatesLoaded();
    const templateManager = getTemplateManager();

    // Get template
    const template = templateManager.getTemplate(templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Validate parameters
    const validation = templateManager.validateParameters(
      template,
      templateParams
    );
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter validation failed",
          errors: validation.errors,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    await connectDB();

    // Validate server connection if provided
    let serverConnection = null;
    if (serverConnectionId) {
      serverConnection = await ServerConnection.findOne({
        _id: serverConnectionId,
        userId: session.userId,
      });

      if (!serverConnection) {
        return NextResponse.json(
          { success: false, error: "Server connection not found" },
          { status: HTTP_STATUS.NOT_FOUND }
        );
      }

      if (!serverConnection.isValid) {
        return NextResponse.json(
          {
            success: false,
            error: "Server connection is not validated. Please validate before deploying.",
          },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    // Create deployment record
    const deployment = new Deployment({
      userId: session.userId,
      templateId: templateId,
      templateName: template.name,
      credentialId: credentialId || null,
      serverConnectionId: serverConnectionId || null,
      provider: template.provider,
      parameters: templateParams,
      totalSteps: template.steps.length,
      status: "pending",
      logs: [
        {
          timestamp: new Date(),
          level: "info",
          message: `Deployment created from template: ${template.name}${
            serverConnection ? ` on server ${serverConnection.name}` : ""
          }`,
        },
      ],
    });

    await deployment.save();

    // Interpolate steps with parameters
    const steps = templateManager.interpolateCommands(
      template.steps,
      templateParams
    );

    // Create deployment job
    const jobQueue = getGlobalJobQueue();
    const jobId = await createDeploymentJob(jobQueue, {
      deploymentId: deployment._id.toString(),
      userId: session.userId,
      templateId: templateId,
      credentialId: credentialId || "",
      serverConnectionId: serverConnectionId || "",
      steps: steps as any,
      parameters: templateParams,
    });

    return NextResponse.json({
      success: true,
      data: {
        deploymentId: deployment._id.toString(),
        jobId,
        templateId,
        templateName: template.name,
        status: "queued",
        estimatedTime: template.estimatedTime,
        message: `Deployment queued using template: ${template.name}`,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Deploy from template error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create deployment from template",
        timestamp: Date.now(),
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * Example Usage:
 *
 * POST /api/deployments/from-template
 *
 * {
 *   "templateId": "nextjs-docker-github",
 *   "templateParams": {
 *     "APP_NAME": "my-app",
 *     "GITHUB_REGISTRY": "ghcr.io",
 *     "GITHUB_OWNER": "mycompany",
 *     "NODE_ENV": "production",
 *     "MONGODB_URI": "mongodb+srv://...",
 *     "JWT_SECRET": "secret123456789",
 *     "PORT": 3000,
 *     "SERVER_IP": "192.168.1.100"
 *   },
 *   "credentialId": "cloud-credential-id-here",
 *   "serverConnectionId": "server-connection-id-here"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "deploymentId": "deployment-id",
 *     "jobId": "job-id",
 *     "templateId": "nextjs-docker-github",
 *     "templateName": "Next.js Docker with GitHub Container Registry",
 *     "status": "queued",
 *     "estimatedTime": "30 minutes",
 *     "message": "Deployment queued using template: Next.js Docker with GitHub Container Registry"
 *   }
 * }
 */
