/**
 * Individual Server Connection Management
 * GET, UPDATE, DELETE, and VALIDATE server connections
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ServerConnection from "@/lib/models/server-connection";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/server-connections/[id]
 * Get server connection details
 */
export async function GET(
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

    const connection = await ServerConnection.findOne({
      _id: id,
      userId: session.userId,
    }).select("-auth.password -auth.privateKey -auth.privateKeyPassphrase -auth.token");

    if (!connection) {
      return NextResponse.json(
        { success: false, error: "Server connection not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    return NextResponse.json({
      success: true,
      data: connection,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Get connection error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get connection", timestamp: Date.now() },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * PUT /api/server-connections/[id]
 * Update server connection
 */
export async function PUT(
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
    const body = await request.json();

    await connectDB();

    const connection = await ServerConnection.findOne({
      _id: id,
      userId: session.userId,
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, error: "Server connection not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Update allowed fields
    if (body.name) connection.name = body.name;
    if (body.description !== undefined) connection.description = body.description;
    if (body.host) connection.host = body.host;
    if (body.port) connection.port = body.port;
    if (body.username) connection.username = body.username;
    if (body.tags) connection.tags = body.tags;
    if (body.isDefault !== undefined) connection.isDefault = body.isDefault;

    // Update auth if provided
    if (body.auth && typeof body.auth === "object") {
      if (body.authMethod) connection.authMethod = body.authMethod;

      if (body.authMethod === "password" && body.auth.password) {
        connection.auth.password = body.auth.password;
      }
      if (body.authMethod === "private-key" && body.auth.privateKey) {
        connection.auth.privateKey = body.auth.privateKey;
        if (body.auth.privateKeyPassphrase) {
          connection.auth.privateKeyPassphrase = body.auth.privateKeyPassphrase;
        }
      }
      if (body.authMethod === "token" && body.auth.token) {
        connection.auth.token = body.auth.token;
      }
    }

    // Reset validation on update
    connection.isValid = false;
    connection.lastValidated = null;

    await connection.save();

    const safeConnection = connection.toObject();
    delete (safeConnection.auth as any).password;
    delete (safeConnection.auth as any).privateKey;
    delete (safeConnection.auth as any).privateKeyPassphrase;
    delete (safeConnection.auth as any).token;

    return NextResponse.json({
      success: true,
      data: safeConnection,
      message: "Server connection updated successfully",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Update connection error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update connection", timestamp: Date.now() },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * DELETE /api/server-connections/[id]
 * Delete server connection
 */
export async function DELETE(
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

    const connection = await ServerConnection.findOneAndDelete({
      _id: id,
      userId: session.userId,
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, error: "Server connection not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deletedId: id },
      message: "Server connection deleted successfully",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Delete connection error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete connection", timestamp: Date.now() },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
