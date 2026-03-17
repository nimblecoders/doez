/**
 * Server Connection Management API
 * Manage SSH and other server connections for template execution
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ServerConnection from "@/lib/models/server-connection";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/server-connections
 * List all server connections for the user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const tag = searchParams.get("tag");

    await connectDB();

    let query: Record<string, unknown> = { userId: session.userId };

    if (type) {
      query.connectionType = type;
    }

    if (tag) {
      query.tags = tag;
    }

    const connections = await ServerConnection.find(query)
      .select("-auth.password -auth.privateKey -auth.privateKeyPassphrase -auth.token")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: connections,
      count: connections.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("List connections error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list connections", timestamp: Date.now() },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * POST /api/server-connections
 * Create a new server connection
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
    const {
      name,
      description,
      connectionType,
      host,
      port,
      username,
      authMethod,
      auth,
      sshSettings,
      tags,
    } = body;

    // Validation
    if (!name || !host || !port || !username || !authMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, host, port, username, authMethod",
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (!auth || typeof auth !== "object") {
      return NextResponse.json(
        { success: false, error: "auth object is required" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate auth based on method
    if (authMethod === "password" && !auth.password) {
      return NextResponse.json(
        { success: false, error: "password is required for password auth" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (authMethod === "private-key" && !auth.privateKey) {
      return NextResponse.json(
        { success: false, error: "privateKey is required for private-key auth" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (authMethod === "token" && !auth.token) {
      return NextResponse.json(
        { success: false, error: "token is required for token auth" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    await connectDB();

    const connection = new ServerConnection({
      userId: session.userId,
      name,
      description,
      connectionType: connectionType || "ssh",
      host,
      port,
      username,
      authMethod,
      auth,
      sshSettings,
      tags: tags || [],
    });

    await connection.save();

    const safeConnection = connection.toObject();
    delete (safeConnection.auth as any).password;
    delete (safeConnection.auth as any).privateKey;
    delete (safeConnection.auth as any).privateKeyPassphrase;
    delete (safeConnection.auth as any).token;

    return NextResponse.json(
      {
        success: true,
        data: safeConnection,
        message: "Server connection created successfully",
        timestamp: Date.now(),
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    console.error("Create connection error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create connection", timestamp: Date.now() },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
