import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error("JWT_SECRET environment variable is required");
}
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "user";
  expiresAt: Date;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(user: {
  _id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session: SessionPayload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt,
  };

  const token = await encrypt(session);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  return session;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  return await decrypt(token);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
export async function verifySession(): Promise<string | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Check if session expired
  if (new Date(session.expiresAt) < new Date()) {
    await deleteSession();
    return null;
  }

  return session; // return rid
}