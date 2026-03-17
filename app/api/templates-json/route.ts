/**
 * Templates API endpoints
 * Manages loading and listing templates from JSON files
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getTemplateManager } from "@/lib/services/template-manager";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

// Initialize template manager on first load
let templateManagerInitialized = false;

async function ensureTemplatesLoaded() {
  if (!templateManagerInitialized) {
    const manager = getTemplateManager();
    await manager.loadAllTemplates();
    templateManagerInitialized = true;
  }
}

/**
 * GET /api/templates/categories
 * List all template categories
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

    await ensureTemplatesLoaded();
    const manager = getTemplateManager();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const provider = searchParams.get("provider");
    const tag = searchParams.get("tag");
    const action = searchParams.get("action");

    // List categories
    if (action === "categories") {
      return NextResponse.json({
        success: true,
        data: manager.getCategories(),
        timestamp: Date.now(),
      });
    }

    // List providers
    if (action === "providers") {
      return NextResponse.json({
        success: true,
        data: manager.getProviders(),
        timestamp: Date.now(),
      });
    }

    // Get stats
    if (action === "stats") {
      return NextResponse.json({
        success: true,
        data: manager.getStats(),
        timestamp: Date.now(),
      });
    }

    // Filter by category
    if (category) {
      const templates = manager.getByCategory(category);
      return NextResponse.json({
        success: true,
        data: templates,
        count: templates.length,
        timestamp: Date.now(),
      });
    }

    // Filter by provider
    if (provider) {
      const templates = manager.getByProvider(provider);
      return NextResponse.json({
        success: true,
        data: templates,
        count: templates.length,
        timestamp: Date.now(),
      });
    }

    // Search by tag
    if (tag) {
      const templates = manager.searchByTags([tag]);
      return NextResponse.json({
        success: true,
        data: templates,
        count: templates.length,
        timestamp: Date.now(),
      });
    }

    // List all templates
    const templates = manager.listTemplates();
    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("List templates error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list templates",
        timestamp: Date.now(),
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
