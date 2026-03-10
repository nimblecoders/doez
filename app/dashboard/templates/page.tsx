"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Blocks,
  Search,
  Filter,
  Loader2,
  Clock,
  Users,
  Plus,
  Server,
  Database,
  Shield,
  Box,
  Activity,
  Layers,
  Zap,
  Globe,
} from "lucide-react";
import Link from "next/link";

interface Template {
  _id: string;
  name: string;
  slug: string;
  version: string;
  description: string;
  category: string;
  provider: string;
  estimatedTime: number;
  usageCount: number;
  isVerified: boolean;
  author: {
    name: string;
  };
  tags: string[];
  createdAt: string;
}

const categories = [
  { value: "all", label: "All Categories", icon: Blocks },
  { value: "server", label: "Server", icon: Server },
  { value: "database", label: "Database", icon: Database },
  { value: "cache", label: "Cache", icon: Zap },
  { value: "queue", label: "Queue", icon: Layers },
  { value: "monitoring", label: "Monitoring", icon: Activity },
  { value: "application", label: "Application", icon: Globe },
  { value: "container", label: "Container", icon: Box },
  { value: "security", label: "Security", icon: Shield },
];

const providers = [
  { value: "all", label: "All Providers" },
  { value: "aws", label: "AWS" },
  { value: "gcp", label: "Google Cloud" },
  { value: "azure", label: "Azure" },
  { value: "digitalocean", label: "DigitalOcean" },
  { value: "any", label: "Any Provider" },
];

const categoryIcons: Record<string, React.ElementType> = {
  server: Server,
  database: Database,
  cache: Zap,
  queue: Layers,
  monitoring: Activity,
  application: Globe,
  container: Box,
  security: Shield,
};

const providerColors: Record<string, string> = {
  aws: "bg-orange-100 text-orange-700",
  gcp: "bg-blue-100 text-blue-700",
  azure: "bg-sky-100 text-sky-700",
  digitalocean: "bg-blue-100 text-blue-700",
  any: "bg-gray-100 text-gray-700",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [provider, setProvider] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });
      if (category !== "all") params.append("category", category);
      if (provider !== "all") params.append("provider", provider);
      if (search) params.append("search", search);

      const response = await fetch(`/api/templates?${params}`);
      const data = await response.json();

      if (data.templates) {
        setTemplates(data.templates);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, category, provider, search]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTemplates();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Template Marketplace
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Browse and deploy pre-configured templates for your infrastructure.
          </p>
        </div>
        <Link
          href="/dashboard/templates/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--muted-foreground)]" />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            {providers.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] py-12 text-center">
          <Blocks className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <p className="mt-4 text-lg font-medium text-[var(--foreground)]">
            No templates found
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {search || category !== "all" || provider !== "all"
              ? "Try adjusting your filters"
              : "Create your first template to get started"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const CategoryIcon = categoryIcons[template.category] || Blocks;
              return (
                <Link
                  key={template._id}
                  href={`/dashboard/templates/${template._id}`}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all hover:border-[var(--primary)] hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--secondary)]">
                      <CategoryIcon className="h-5 w-5 text-[var(--secondary-foreground)]" />
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        providerColors[template.provider] || providerColors.any
                      }`}
                    >
                      {template.provider.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="mt-4 font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">
                    {template.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                    {template.description}
                  </p>

                  <div className="mt-4 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {template.estimatedTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {template.usageCount} uses
                    </span>
                  </div>

                  {template.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--secondary-foreground)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
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
