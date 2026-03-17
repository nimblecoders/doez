import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? undefined : "dev-secret-key-for-local-development-only");

if (!secretKey && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is required in production");
}

const key = new TextEncoder().encode(secretKey || "");

// Simple in-memory rate limiter (note: doesn't persist across server restarts)
// For production, use Redis or similar
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 5; // Max login attempts

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = rateLimitMap.get(ip) || [];

  // Remove old attempts outside the window
  const recentAttempts = attempts.filter((time) => now - time < RATE_LIMIT_WINDOW);

  if (recentAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false; // Rate limit exceeded
  }

  // Record this attempt
  recentAttempts.push(now);
  rateLimitMap.set(ip, recentAttempts);

  return true; // Rate limit OK
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard"];

  // Rate limit auth endpoints
  const rateLimitedRoutes = ["/api/auth/login", "/api/auth/signup"];

  // Check rate limiting for auth endpoints
  if (rateLimitedRoutes.some((route) => pathname.startsWith(route))) {
    const ip = getClientIp(request);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many login attempts. Please try again in 15 minutes.",
        },
        { status: 429 }
      );
    }
  }

  // Check if current path is protected
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    const token = request.cookies.get("session")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {
      await jwtVerify(token, key, { algorithms: ["HS256"] });
    } catch {
      // Invalid or expired token
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("session");
      return response;
    }
  }

  // Add security headers
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
