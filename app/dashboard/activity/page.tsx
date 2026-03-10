"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Loader2,
  User,
  Cloud,
  Blocks,
  Rocket,
  LogIn,
  LogOut,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  CheckCircle,
} from "lucide-react";

interface ActivityLog {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const actionIcons: Record<string, React.ElementType> = {
  "user.login": LogIn,
  "user.logout": LogOut,
  "user.created": UserPlus,
  "user.updated": Edit,
  "user.deleted": UserMinus,
  "credential.created": Cloud,
  "credential.updated": Edit,
  "credential.deleted": Trash2,
  "credential.validated": CheckCircle,
  "template.created": Blocks,
  "template.updated": Edit,
  "template.deleted": Trash2,
  "deployment.started": Rocket,
  "deployment.completed": CheckCircle,
  "deployment.failed": Activity,
  "deployment.cancelled": Activity,
};

const actionColors: Record<string, string> = {
  "user.login": "bg-green-100 text-green-600",
  "user.logout": "bg-gray-100 text-gray-600",
  "user.created": "bg-blue-100 text-blue-600",
  "user.updated": "bg-yellow-100 text-yellow-600",
  "user.deleted": "bg-red-100 text-red-600",
  "credential.created": "bg-blue-100 text-blue-600",
  "credential.updated": "bg-yellow-100 text-yellow-600",
  "credential.deleted": "bg-red-100 text-red-600",
  "credential.validated": "bg-green-100 text-green-600",
  "template.created": "bg-blue-100 text-blue-600",
  "template.updated": "bg-yellow-100 text-yellow-600",
  "template.deleted": "bg-red-100 text-red-600",
  "deployment.started": "bg-blue-100 text-blue-600",
  "deployment.completed": "bg-green-100 text-green-600",
  "deployment.failed": "bg-red-100 text-red-600",
  "deployment.cancelled": "bg-gray-100 text-gray-600",
};

const actionFilters = [
  { value: "all", label: "All Activities" },
  { value: "user", label: "User" },
  { value: "credential", label: "Credentials" },
  { value: "template", label: "Templates" },
  { value: "deployment", label: "Deployments" },
];

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (actionFilter !== "all") params.append("action", actionFilter);

      const response = await fetch(`/api/activity?${params}`);
      const data = await response.json();

      if (data.logs) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">
          Activity Log
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Track all actions and events in your organization.
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {actionFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              setActionFilter(filter.value);
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              actionFilter === filter.value
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] py-12 text-center">
          <Activity className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <p className="mt-4 text-lg font-medium text-[var(--foreground)]">
            No activity yet
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Actions will appear here as you use the platform.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <div className="divide-y divide-[var(--border)]">
              {logs.map((log) => {
                const ActionIcon = actionIcons[log.action] || Activity;
                const colorClass =
                  actionColors[log.action] || "bg-gray-100 text-gray-600";

                return (
                  <div
                    key={log._id}
                    className="flex items-start gap-4 px-5 py-4"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                    >
                      <ActionIcon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--foreground)]">
                        <span className="font-medium">{log.userName}</span>{" "}
                        {log.description}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                        <span>{formatDate(log.createdAt)}</span>
                        <span className="rounded bg-[var(--secondary)] px-1.5 py-0.5">
                          {log.action.replace(".", " / ")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-[var(--muted-foreground)]">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
