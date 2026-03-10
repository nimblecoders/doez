import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Template from "@/lib/models/template";
import ActivityLog from "@/lib/models/activity-log";

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const provider = searchParams.get("provider");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {
      $or: [
        { isPublic: true },
        { "author.userId": session.userId },
      ],
    };

    if (category && category !== "all") {
      query.category = category;
    }

    if (provider && provider !== "all") {
      query.provider = provider;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      Template.find(query)
        .sort({ usageCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-steps"),
      Template.countDocuments(query),
    ]);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch templates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
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

    // Only admins can create templates
    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      provider,
      icon,
      parameters,
      requirements,
      steps,
      estimatedTime,
      isPublic,
      tags,
    } = body;

    if (!name || !description || !category || !provider) {
      return NextResponse.json(
        { error: "Name, description, category, and provider are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const template = new Template({
      name,
      description,
      category,
      provider,
      icon,
      parameters: parameters || [],
      requirements: requirements || [],
      steps: steps || [],
      estimatedTime: estimatedTime || 5,
      author: {
        userId: session.userId,
        name: session.name,
      },
      isPublic: isPublic !== false,
      tags: tags || [],
    });

    await template.save();

    // Log activity
    await ActivityLog.create({
      userId: session.userId,
      userName: session.name,
      action: "template.created",
      description: `Created template: ${name}`,
      metadata: { templateId: template._id, category, provider },
    });

    return NextResponse.json({
      message: "Template created successfully",
      template,
    });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
