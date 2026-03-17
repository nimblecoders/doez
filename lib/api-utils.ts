import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export function successResponse<T>(data: T, statusCode = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: Date.now(),
    } as ApiResponse<T>,
    { status: statusCode }
  );
}

export function errorResponse(
  message: string,
  statusCode = 500,
  error?: unknown
) {
  if (process.env.NODE_ENV === "development" && error) {
    console.error("API Error:", error);
  }

  return NextResponse.json(
    {
      success: false,
      error: message,
      timestamp: Date.now(),
    } as ApiResponse,
    { status: statusCode }
  );
}

export function validateRequest(
  body: unknown,
  requiredFields: string[]
): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: "Request body is required" };
  }

  const bodyObj = body as Record<string, unknown>;

  for (const field of requiredFields) {
    if (!bodyObj[field]) {
      return { valid: false, error: `${field} is required` };
    }
  }

  return { valid: true };
}
