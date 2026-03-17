/**
 * Get specific template by ID
 * POST endpoint to validate and prepare template for deployment
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getTemplateManager } from "@/lib/services/template-manager";
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
 * GET /api/templates-json/[id]
 * Get specific template details
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

    await ensureTemplatesLoaded();
    const manager = getTemplateManager();

    const template = manager.getTemplate(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Get template error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get template",
        timestamp: Date.now(),
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * POST /api/templates-json/[id]
 * Validate template parameters and prepare for deployment
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
    const { parameters } = await request.json();

    if (!parameters || typeof parameters !== "object") {
      return NextResponse.json(
        { success: false, error: "Parameters object is required" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    await ensureTemplatesLoaded();
    const manager = getTemplateManager();

    const template = manager.getTemplate(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Validate parameters
    const validation = manager.validateParameters(template, parameters);

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

    // Interpolate commands with parameters
    const interpolatedSteps = manager.interpolateCommands(
      template.steps,
      parameters
    );

    const rollbackSteps = template.rollbackSteps
      ? manager.interpolateCommands(template.rollbackSteps, parameters)
      : undefined;

    return NextResponse.json({
      success: true,
      data: {
        templateId: template.id,
        name: template.name,
        description: template.description,
        steps: interpolatedSteps,
        rollbackSteps,
        postDeployment: template.postDeployment,
        documentation: template.documentation,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Validate template error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to validate template",
        timestamp: Date.now(),
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
