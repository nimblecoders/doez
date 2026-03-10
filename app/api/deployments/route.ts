import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Deployment from "@/lib/models/deployment";
import Template from "@/lib/models/template";
import CloudCredential from "@/lib/models/cloud-credential";
import ActivityLog from "@/lib/models/activity-log";

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    await connectDB();

    const query: Record<string, unknown> = { userId: session.userId };
    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [deployments, total] = await Promise.all([
      Deployment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-logs"),
      Deployment.countDocuments(query),
    ]);

    return NextResponse.json({
      deployments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch deployments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, credentialId, parameters } = body;

    if (!templateId || !credentialId) {
      return NextResponse.json(
        { error: "Template and credential are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify template exists
    const template = await Template.findById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Verify credential exists and belongs to user
    const credential = await CloudCredential.findOne({
      _id: credentialId,
      userId: session.userId,
    });
    if (!credential) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    // Validate required parameters
    const missingParams = template.parameters
      .filter((p: { required: boolean; name: string }) => p.required && !parameters?.[p.name])
      .map((p: { name: string }) => p.name);

    if (missingParams.length > 0) {
      return NextResponse.json(
        { error: `Missing required parameters: ${missingParams.join(", ")}` },
        { status: 400 }
      );
    }

    // Create deployment
    const deployment = new Deployment({
      userId: session.userId,
      templateId: template._id,
      templateName: template.name,
      credentialId: credential._id,
      provider: credential.provider,
      parameters: parameters || {},
      totalSteps: template.steps.length,
      status: "pending",
      logs: [
        {
          timestamp: new Date(),
          level: "info",
          message: "Deployment created and queued",
        },
      ],
    });

    await deployment.save();

    // Increment template usage count
    await Template.updateOne(
      { _id: templateId },
      { $inc: { usageCount: 1 } }
    );

    // Log activity
    await ActivityLog.create({
      userId: session.userId,
      userName: session.name,
      action: "deployment.started",
      description: `Started deployment: ${template.name}`,
      metadata: {
        deploymentId: deployment._id,
        templateId: template._id,
        provider: credential.provider,
      },
    });

    return NextResponse.json({
      message: "Deployment created successfully",
      deployment: {
        _id: deployment._id,
        templateName: deployment.templateName,
        provider: deployment.provider,
        status: deployment.status,
        createdAt: deployment.createdAt,
      },
    });
  } catch (error) {
    console.error("Create deployment error:", error);
    return NextResponse.json(
      { error: "Failed to create deployment" },
      { status: 500 }
    );
  }
}
