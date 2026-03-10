"use client";

import { User } from "lucide-react";

interface UserDashboardProps {
  user: {
    name: string;
    email: string;
    role: "admin" | "user";
  };
}

export function UserDashboard({ user }: UserDashboardProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">
          Dashboard
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Welcome back, {user.name}!
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--secondary)]">
            <User className="h-10 w-10 text-[var(--secondary-foreground)]" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
            {user.name}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
          <span className="mt-2 rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-medium text-[var(--secondary-foreground)]">
            {user.role}
          </span>
        </div>

        <div className="mt-8 rounded-lg bg-[var(--secondary)] p-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Your dashboard is ready. Additional features will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
}
