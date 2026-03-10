"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Rocket,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Filter,
} from "lucide-react";

interface Deployment {
  _id: string;
  templateName: string;
  provider: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  currentStep: number;
  totalSteps: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  result?: {
    serverIp?: string;
    serverUrl?: string;
  };
}

const statusConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  pending: { icon: Clock, color: "text-yellow-500", label: "Pending" },
  running: { icon: PlayCircle, color: "text-blue-500", label: "Running" },
  completed: { icon: CheckCircle, color: "text-green-500", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-500", label: "Failed" },
  cancelled: { icon: AlertCircle, color: "text-gray-500", label: "Cancelled" },
};

const providerColors: Record<string, string> = {
  aws: "bg-orange-100 text-orange-700",
  gcp: "bg-blue-100 text-blue-700",
  azure: "bg-sky-100 text-sky-700",
  digitalocean: "bg-blue-100 text-blue-700",
};

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchDeployments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/deployments?${params}`);
      const data = await response.json();

      if (data.deployments) {
        setDeployments(data.deployments);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch deployments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getProgressPercentage = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Deployments
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Track and manage your infrastructure deployments.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-[var(--muted-foreground)]" />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Deployments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : deployments.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] py-12 text-center">
          <Rocket className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <p className="mt-4 text-lg font-medium text-[var(--foreground)]">
            No deployments yet
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Deploy a template to see your deployments here.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <div className="divide-y divide-[var(--border)]">
              {deployments.map((deployment) => {
                const StatusIcon = statusConfig[deployment.status].icon;
                const progress = getProgressPercentage(
                  deployment.currentStep,
                  deployment.totalSteps
                );

                return (
                  <div key={deployment._id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-[var(--foreground)]">
                            {deployment.templateName}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              providerColors[deployment.provider] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {deployment.provider.toUpperCase()}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(deployment.createdAt)}
                          </span>
                          {deployment.status === "running" && (
                            <span>
                              Step {deployment.currentStep} of{" "}
                              {deployment.totalSteps}
                            </span>
                          )}
                        </div>

                        {/* Progress bar for running deployments */}
                        {deployment.status === "running" && (
                          <div className="mt-3">
                            <div className="h-2 w-full rounded-full bg-[var(--secondary)]">
                              <div
                                className="h-2 rounded-full bg-blue-500 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                              {progress}% complete
                            </p>
                          </div>
                        )}

                        {/* Result info for completed deployments */}
                        {deployment.status === "completed" &&
                          deployment.result?.serverIp && (
                            <div className="mt-3 rounded-lg bg-green-50 p-3">
                              <p className="text-sm text-green-700">
                                Server IP:{" "}
                                <code className="rounded bg-green-100 px-1.5 py-0.5">
                                  {deployment.result.serverIp}
                                </code>
                              </p>
                              {deployment.result.serverUrl && (
                                <p className="mt-1 text-sm text-green-700">
                                  URL:{" "}
                                  <a
                                    href={deployment.result.serverUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                  >
                                    {deployment.result.serverUrl}
                                  </a>
                                </p>
                              )}
                            </div>
                          )}
                      </div>

                      <div
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                          deployment.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : deployment.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : deployment.status === "running"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-[var(--secondary)] text-[var(--secondary-foreground)]"
                        }`}
                      >
                        <StatusIcon
                          className={`h-3.5 w-3.5 ${statusConfig[deployment.status].color}`}
                        />
                        {statusConfig[deployment.status].label}
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
