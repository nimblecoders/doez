"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Clock,
  Users,
  Rocket,
  Server,
  Database,
  Shield,
  Box,
  Activity,
  Layers,
  Zap,
  Globe,
  Blocks,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface TemplateParameter {
  name: string;
  type: "string" | "number" | "boolean" | "select";
  label: string;
  description?: string;
  required: boolean;
  default?: string | number | boolean;
  secret?: boolean;
  options?: string[];
}

interface TemplateStep {
  name: string;
  description?: string;
  command: string;
}

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
  parameters: TemplateParameter[];
  requirements: string[];
  steps: TemplateStep[];
  author: {
    name: string;
  };
  tags: string[];
  createdAt: string;
}

interface Credential {
  _id: string;
  provider: string;
  name: string;
  isDefault: boolean;
}

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

export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState("");
  const [parameterValues, setParameterValues] = useState<Record<string, string | number | boolean>>({});
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [templateRes, credentialsRes] = await Promise.all([
        fetch(`/api/templates/${id}`),
        fetch("/api/credentials"),
      ]);

      const templateData = await templateRes.json();
      const credentialsData = await credentialsRes.json();

      if (templateData.template) {
        setTemplate(templateData.template);
        // Set default parameter values
        const defaults: Record<string, string | number | boolean> = {};
        templateData.template.parameters.forEach((p: TemplateParameter) => {
          if (p.default !== undefined) {
            defaults[p.name] = p.default;
          }
        });
        setParameterValues(defaults);
      }

      if (credentialsData.credentials) {
        const filteredCreds = credentialsData.credentials.filter(
          (c: Credential) =>
            templateData.template?.provider === "any" ||
            c.provider === templateData.template?.provider
        );
        setCredentials(filteredCreds);
        // Auto-select default credential
        const defaultCred = filteredCreds.find((c: Credential) => c.isDefault);
        if (defaultCred) {
          setSelectedCredential(defaultCred._id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeploy = async () => {
    if (!selectedCredential) {
      setError("Please select a credential");
      return;
    }

    // Validate required parameters
    const missingParams = template?.parameters
      .filter((p) => p.required && !parameterValues[p.name])
      .map((p) => p.label);

    if (missingParams && missingParams.length > 0) {
      setError(`Missing required parameters: ${missingParams.join(", ")}`);
      return;
    }

    setIsDeploying(true);
    setError("");

    try {
      const response = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template?._id,
          credentialId: selectedCredential,
          parameters: parameterValues,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to start deployment");
        return;
      }

      router.push(`/dashboard/deployments`);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsDeploying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-foreground)]">Template not found</p>
        <Link
          href="/dashboard/templates"
          className="mt-4 inline-flex items-center gap-2 text-[var(--primary)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Link>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[template.category] || Blocks;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/templates"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Templates
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--secondary)]">
                <CategoryIcon className="h-7 w-7 text-[var(--secondary-foreground)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-[var(--foreground)]">
                    {template.name}
                  </h1>
                  {template.isVerified && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="mt-1 text-[var(--muted-foreground)]">
                  {template.description}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {template.estimatedTime} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {template.usageCount} deployments
                  </span>
                  <span>v{template.version}</span>
                  <span>by {template.author.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {template.requirements.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Requirements
              </h2>
              <ul className="mt-3 space-y-2">
                {template.requirements.map((req, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Steps Preview */}
          {template.steps.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Deployment Steps
              </h2>
              <div className="mt-4 space-y-3">
                {template.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg bg-[var(--secondary)] p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">
                        {step.name}
                      </p>
                      {step.description && (
                        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Deploy Panel */}
        <div className="space-y-6">
          <div className="sticky top-24 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Deploy Template
            </h2>

            {error && (
              <div className="mt-4 rounded-lg bg-[var(--destructive)]/10 p-3 text-sm text-[var(--destructive)]">
                {error}
              </div>
            )}

            <div className="mt-4 space-y-4">
              {/* Credential Selection */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  Cloud Credential
                </label>
                {credentials.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      No credentials found for {template.provider.toUpperCase()}
                    </p>
                    <Link
                      href="/dashboard/credentials"
                      className="mt-2 inline-block text-sm text-[var(--primary)] hover:underline"
                    >
                      Add Credential
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedCredential}
                    onChange={(e) => setSelectedCredential(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  >
                    <option value="">Select credential...</option>
                    {credentials.map((cred) => (
                      <option key={cred._id} value={cred._id}>
                        {cred.name} ({cred.provider.toUpperCase()})
                        {cred.isDefault ? " - Default" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Parameters */}
              {template.parameters.map((param) => (
                <div key={param.name}>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                    {param.label}
                    {param.required && (
                      <span className="text-[var(--destructive)]"> *</span>
                    )}
                  </label>
                  {param.description && (
                    <p className="mb-1.5 text-xs text-[var(--muted-foreground)]">
                      {param.description}
                    </p>
                  )}
                  {param.type === "select" && param.options ? (
                    <select
                      value={String(parameterValues[param.name] || "")}
                      onChange={(e) =>
                        setParameterValues({
                          ...parameterValues,
                          [param.name]: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    >
                      <option value="">Select...</option>
                      {param.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : param.type === "boolean" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(parameterValues[param.name])}
                        onChange={(e) =>
                          setParameterValues({
                            ...parameterValues,
                            [param.name]: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-[var(--border)]"
                      />
                      <span className="text-sm text-[var(--muted-foreground)]">
                        Enable
                      </span>
                    </div>
                  ) : (
                    <input
                      type={param.secret ? "password" : param.type === "number" ? "number" : "text"}
                      value={String(parameterValues[param.name] || "")}
                      onChange={(e) =>
                        setParameterValues({
                          ...parameterValues,
                          [param.name]:
                            param.type === "number"
                              ? Number(e.target.value)
                              : e.target.value,
                        })
                      }
                      placeholder={param.secret ? "********" : `Enter ${param.label.toLowerCase()}`}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    />
                  )}
                </div>
              ))}

              <button
                onClick={handleDeploy}
                disabled={isDeploying || credentials.length === 0}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Deploy Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
