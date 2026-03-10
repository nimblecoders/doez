import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import { AuthForm } from "@/components/auth-form";
import { Shield, Users } from "lucide-react";

export default async function HomePage() {
  // Check if user is already logged in
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  // Check if there are any users in the database
  await connectDB();
  const userCount = await User.countDocuments();
  const isFirstUser = userCount === 0;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]">
              {isFirstUser ? (
                <Shield className="h-7 w-7 text-[var(--primary-foreground)]" />
              ) : (
                <Users className="h-7 w-7 text-[var(--primary-foreground)]" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {isFirstUser ? "Create Admin Account" : "Welcome Back"}
            </h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {isFirstUser
                ? "Set up your admin account to get started with Doez"
                : "Sign in to access your dashboard"}
            </p>
          </div>

          <AuthForm mode={isFirstUser ? "signup" : "login"} />

          {isFirstUser && (
            <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
              As the first user, you will be the administrator and can add team
              members after signing in.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
