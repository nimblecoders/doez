import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Deployment from "@/lib/models/deployment";
import { ERROR_MESSAGES, HTTP_STATUS, DEPLOYMENT_STATUS } from "@/lib/constants";

// Get deployment details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { id } = await params;

    await connectDB();

    const deployment = await Deployment.findOne({
      _id: id,
      userId: session.userId,
    });

    if (!deployment) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.DEPLOYMENT_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: deployment._id,
        templateName: deployment.templateName,
        templateId: deployment.templateId,
        provider: deployment.provider,
        status: deployment.status,
        parameters: deployment.parameters,
        currentStep: deployment.currentStep,
        totalSteps: deployment.totalSteps,
        logs: deployment.logs,
        result: deployment.result || null,
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Get deployment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch deployment",
        timestamp: Date.now(),
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Update deployment status/logs (for deployment engine)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { id } = await params;
    const { status, currentStep, log, result } = await request.json();

    await connectDB();

    const deployment = await Deployment.findOne({
      _id: id,
      userId: session.userId,
    });

    if (!deployment) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.DEPLOYMENT_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Validate status if provided
    if (status && !Object.values(DEPLOYMENT_STATUS).includes(status)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_DEPLOYMENT_STATE },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Update fields
    if (status) deployment.status = status;
    if (currentStep !== undefined) deployment.currentStep = currentStep;
    if (result) deployment.result = result;

    // Add log entry if provided
    if (log) {
      deployment.logs.push({
        timestamp: new Date(),
        level: log.level || "info",
        message: log.message,
      });
    }

    await deployment.save();

    return NextResponse.json({
      success: true,
      data: {
        _id: deployment._id,
        status: deployment.status,
        currentStep: deployment.currentStep,
        totalSteps: deployment.totalSteps,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Update deployment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update deployment",
        timestamp: Date.now(),
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Cancel/delete deployment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { id } = await params;

    await connectDB();

    const deployment = await Deployment.findOne({
      _id: id,
      userId: session.userId,
    });

    if (!deployment) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.DEPLOYMENT_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Can only cancel pending or running deployments
    if (
      ![DEPLOYMENT_STATUS.PENDING, DEPLOYMENT_STATUS.IN_PROGRESS].includes(
        deployment.status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Can only cancel pending or running deployments",
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    deployment.status = DEPLOYMENT_STATUS.CANCELLED;
    deployment.logs.push({
      timestamp: new Date(),
      level: "info",
      message: "Deployment cancelled by user",
    });

    await deployment.save();

    return NextResponse.json({
      success: true,
      data: { _id: deployment._id, status: deployment.status },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Cancel deployment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cancel deployment",
        timestamp: Date.now(),
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
