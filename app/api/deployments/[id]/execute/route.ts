/**
 * Deployment Execution Endpoint
 * Triggers actual deployment execution and returns job status
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Deployment from "@/lib/models/deployment";
import Template from "@/lib/models/template";
import CloudCredential from "@/lib/models/cloud-credential";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";
import { createDeploymentJob } from "@/lib/deployment-processor";
import { getGlobalJobQueue } from "@/lib/job-queue";

/**
 * POST /api/deployments/[id]/execute
 * Trigger deployment execution
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { id } = await params;

    await connectDB();

    // Get deployment
    const deployment = await Deployment.findOne({
      _id: id,
      userId: session.userId,
    });

    if (!deployment) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.DEPLOYMENT_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Check if already executing
    if (deployment.status === "in_progress") {
      return NextResponse.json(
        {
          success: false,
          error: "Deployment is already in progress",
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Get template to fetch steps
    const template = await Template.findById(deployment.templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Create and queue deployment job
    const jobQueue = getGlobalJobQueue();
    const jobId = await createDeploymentJob(jobQueue, {
      deploymentId: deployment._id.toString(),
      userId: session.userId,
      templateId: template._id.toString(),
      credentialId: deployment.credentialId.toString(),
      steps: template.steps,
      parameters: deployment.parameters as Record<string, unknown>,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          deploymentId: deployment._id,
          jobId,
          status: "queued",
          message: "Deployment queued for execution",
        },
        timestamp: Date.now(),
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error("Execute deployment error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute deployment",
        timestamp: Date.now(),
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
