"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Cloud,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Star,
} from "lucide-react";
import { AddCredentialModal } from "@/components/add-credential-modal";

interface Credential {
  _id: string;
  provider: "aws" | "gcp" | "azure" | "digitalocean";
  name: string;
  isDefault: boolean;
  isValid: boolean;
  lastValidated: string | null;
  createdAt: string;
}

const providerLabels: Record<string, string> = {
  aws: "Amazon Web Services",
  gcp: "Google Cloud Platform",
  azure: "Microsoft Azure",
  digitalocean: "DigitalOcean",
};

const providerColors: Record<string, string> = {
  aws: "bg-orange-500",
  gcp: "bg-blue-500",
  azure: "bg-sky-500",
  digitalocean: "bg-blue-600",
};

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    try {
      const response = await fetch("/api/credentials");
      const data = await response.json();
      if (data.credentials) {
        setCredentials(data.credentials);
      }
    } catch (error) {
      console.error("Failed to fetch credentials:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/credentials/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCredentials((prev) => prev.filter((c) => c._id !== id));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete credential");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete credential");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCredentialAdded = () => {
    fetchCredentials();
    setIsModalOpen(false);
  };

  const groupedCredentials = credentials.reduce(
    (acc, cred) => {
      if (!acc[cred.provider]) {
        acc[cred.provider] = [];
      }
      acc[cred.provider].push(cred);
      return acc;
    },
    {} as Record<string, Credential[]>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Cloud Credentials
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Manage your cloud provider credentials for deployments.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
        >
          <Plus className="h-4 w-4" />
          Add Credential
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : credentials.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] py-12 text-center">
          <Cloud className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
          <p className="mt-4 text-lg font-medium text-[var(--foreground)]">
            No credentials yet
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Add your first cloud credential to start deploying.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
          >
            <Plus className="h-4 w-4" />
            Add Your First Credential
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCredentials).map(([provider, creds]) => (
            <div
              key={provider}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)]"
            >
              <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${providerColors[provider]} text-white`}
                >
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {providerLabels[provider]}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {creds.length} credential{creds.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {creds.map((cred) => (
                  <div
                    key={cred._id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[var(--foreground)]">
                            {cred.name}
                          </p>
                          {cred.isDefault && (
                            <span className="flex items-center gap-1 rounded-full bg-[var(--secondary)] px-2 py-0.5 text-xs text-[var(--secondary-foreground)]">
                              <Star className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Added {new Date(cred.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          cred.isValid
                            ? "bg-green-100 text-green-700"
                            : "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                        }`}
                      >
                        {cred.isValid ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {cred.isValid ? "Valid" : "Not Validated"}
                      </span>

                      <button
                        onClick={() => handleDelete(cred._id)}
                        disabled={deletingId === cred._id}
                        className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)] disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete credential"
                      >
                        {deletingId === cred._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddCredentialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCredentialAdded}
      />
    </div>
  );
}
