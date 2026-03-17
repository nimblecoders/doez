/**
 * Server Connection Validation
 * Test and validate server connections
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ServerConnection from "@/lib/models/server-connection";
import { SSHExecutor } from "@/lib/services/ssh-executor";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

/**
 * POST /api/server-connections/[id]/validate
 * Test connection to server
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

    // Validate based on connection type
    let isValid = false;
    let testResult = "";

    if (connection.connectionType === "ssh") {
      try {
        // Create SSH executor with connection credentials
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

        // Try to connect
        await sshExecutor.connect();

        // Test with simple command
        const output = await sshExecutor.executeCommand("echo 'Connection successful' && pwd");

        // Disconnect
        await sshExecutor.disconnect();

        isValid = true;
        testResult = `✓ Connection successful\n${output}`;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        testResult = `✗ Connection failed: ${errorMessage}`;
        isValid = false;
      }
    } else if (connection.connectionType === "http" || connection.connectionType === "https") {
      try {
        const protocol = connection.connectionType;
        const url = `${protocol}://${connection.host}:${connection.port}/health`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${connection.auth.token}`,
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          isValid = true;
          testResult = `✓ HTTP connection successful (${response.status})`;
        } else {
          testResult = `✗ HTTP connection failed (${response.status})`;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        testResult = `✗ HTTP connection failed: ${errorMessage}`;
      }
    }

    // Update connection validation status
    connection.isValid = isValid;
    connection.lastValidated = new Date();
    if (!isValid) {
      connection.lastError = testResult;
    }

    await connection.save();

    return NextResponse.json({
      success: true,
      data: {
        connectionId: id,
        connectionType: connection.connectionType,
        host: connection.host,
        port: connection.port,
        isValid,
        testResult,
        validatedAt: new Date(),
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Validate connection error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to validate connection",
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
