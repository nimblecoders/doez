import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Template from "@/lib/models/template";
import ActivityLog from "@/lib/models/activity-log";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const template = await Template.findOne({
      _id: id,
      $or: [
        { isPublic: true },
        { "author.userId": session.userId },
      ],
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Fetch template error:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update templates" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();

    const template = await Template.findOne({
      _id: id,
      "author.userId": session.userId,
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found or not authorized" },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedFields = [
      "name",
      "description",
      "category",
      "provider",
      "icon",
      "parameters",
      "requirements",
      "steps",
      "estimatedTime",
      "isPublic",
      "tags",
      "version",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (template as any)[field] = body[field];
      }
    }

    await template.save();

    // Log activity
    await ActivityLog.create({
      userId: session.userId,
      userName: session.name,
      action: "template.updated",
      description: `Updated template: ${template.name}`,
      metadata: { templateId: template._id },
    });

    return NextResponse.json({
      message: "Template updated successfully",
      template,
    });
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete templates" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();

    const template = await Template.findOne({
      _id: id,
      "author.userId": session.userId,
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found or not authorized" },
        { status: 404 }
      );
    }

    await Template.deleteOne({ _id: id });

    // Log activity
    await ActivityLog.create({
      userId: session.userId,
      userName: session.name,
      action: "template.deleted",
      description: `Deleted template: ${template.name}`,
      metadata: { templateName: template.name },
    });

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
