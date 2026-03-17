/**
 * Test Command Execution on Server Connection
 * Execute arbitrary commands on connected servers
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ServerConnection from "@/lib/models/server-connection";
import { SSHExecutor } from "@/lib/services/ssh-executor";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

/**
 * POST /api/server-connections/[id]/test-command
 * Execute a test command on the server
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
    const body = await request.json();
    const { command } = body;

    if (!command) {
      return NextResponse.json(
        { success: false, error: "command is required" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

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

    if (!connection.isValid) {
      return NextResponse.json(
        { success: false, error: "Connection not validated. Please validate first." },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Execute command based on connection type
    let output = "";

    if (connection.connectionType === "ssh") {
      try {
        const sshConfig = {
          host: connection.host,
          port: connection.port || 22,
          username: connection.username,
          ...(connection.authMethod === "password" && {
            password: connection.auth.password,
          }),
          ...(connection.authMethod === "private-key" && {
            privateKey: connection.auth.privateKey,
            privateKeyPassphrase: connection.auth.privateKeyPassphrase,
          }),
          timeout: connection.sshSettings?.timeout || 30000,
        };

        const sshExecutor = new SSHExecutor(sshConfig);
        await sshExecutor.connect();

        output = await sshExecutor.executeCommand(command);

        await sshExecutor.disconnect();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
          { success: false, error: `Command execution failed: ${errorMessage}` },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    } else if (connection.connectionType === "http" || connection.connectionType === "https") {
      return NextResponse.json(
        { success: false, error: "Command execution is only supported for SSH connections" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        connectionId: id,
        command,
        output,
        executedAt: new Date(),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Test command error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute command",
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
