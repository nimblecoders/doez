"use client";

import { useState } from "react";
import { X, Loader2, Cloud } from "lucide-react";

interface AddCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Provider = "aws" | "gcp" | "azure" | "digitalocean";

const providers: { value: Provider; label: string; color: string }[] = [
  { value: "aws", label: "Amazon Web Services", color: "bg-orange-500" },
  { value: "gcp", label: "Google Cloud Platform", color: "bg-blue-500" },
  { value: "azure", label: "Microsoft Azure", color: "bg-sky-500" },
  { value: "digitalocean", label: "DigitalOcean", color: "bg-blue-600" },
];

const awsRegions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
];

export function AddCredentialModal({
  isOpen,
  onClose,
  onSuccess,
}: AddCredentialModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // AWS fields
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [region, setRegion] = useState("us-east-1");

  // GCP fields
  const [projectId, setProjectId] = useState("");
  const [serviceAccountKey, setServiceAccountKey] = useState("");

  // Azure fields
  const [subscriptionId, setSubscriptionId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  // DigitalOcean fields
  const [apiToken, setApiToken] = useState("");

  const resetForm = () => {
    setSelectedProvider(null);
    setName("");
    setIsDefault(false);
    setAccessKeyId("");
    setSecretAccessKey("");
    setRegion("us-east-1");
    setProjectId("");
    setServiceAccountKey("");
    setSubscriptionId("");
    setTenantId("");
    setClientId("");
    setClientSecret("");
    setApiToken("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedProvider || !name) {
      setError("Please select a provider and enter a name");
      return;
    }

    let credentials: Record<string, string> = {};

    switch (selectedProvider) {
      case "aws":
        if (!accessKeyId || !secretAccessKey) {
          setError("Access Key ID and Secret Access Key are required");
          return;
        }
        credentials = { accessKeyId, secretAccessKey, region };
        break;
      case "gcp":
        if (!projectId || !serviceAccountKey) {
          setError("Project ID and Service Account Key are required");
          return;
        }
        credentials = { projectId, serviceAccountKey };
        break;
      case "azure":
        if (!subscriptionId || !tenantId || !clientId || !clientSecret) {
          setError("All Azure credentials are required");
          return;
        }
        credentials = { subscriptionId, tenantId, clientId, clientSecret };
        break;
      case "digitalocean":
        if (!apiToken) {
          setError("API Token is required");
          return;
        }
        credentials = { apiToken };
        break;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          name,
          credentials,
          isDefault,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to add credential");
        return;
      }

      resetForm();
      onSuccess();
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-[var(--card)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Add Cloud Credential
          </h3>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-[var(--destructive)]/10 p-3 text-sm text-[var(--destructive)]">
              {error}
            </div>
          )}

          {!selectedProvider ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Select a cloud provider to add credentials:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {providers.map((provider) => (
                  <button
                    key={provider.value}
                    type="button"
                    onClick={() => setSelectedProvider(provider.value)}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-4 text-left transition-colors hover:bg-[var(--secondary)]"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${provider.color} text-white`}
                    >
                      <Cloud className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {provider.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Change provider
              </button>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  Credential Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Production AWS"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                  required
                />
              </div>

              {selectedProvider === "aws" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      Access Key ID
                    </label>
                    <input
                      type="text"
                      value={accessKeyId}
                      onChange={(e) => setAccessKeyId(e.target.value)}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      Secret Access Key
                    </label>
                    <input
                      type="password"
                      value={secretAccessKey}
                      onChange={(e) => setSecretAccessKey(e.target.value)}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      Default Region
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    >
                      {awsRegions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {selectedProvider === "gcp" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      Project ID
                    </label>
                    <input
                      type="text"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="my-project-123456"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      Service Account Key (JSON)
                    </label>
                    <textarea
                      value={serviceAccountKey}
                      onChange={(e) => setServiceAccountKey(e.target.value)}
                      placeholder="Paste your service account JSON key here..."
                      rows={4}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      required
                    />
                  </div>
                </>
              )}

              {selectedProvider === "azure" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      Subscription ID
                    </label>
                    <input
                      type="text"
                      value={subscriptionId}
                      onChange={(e) => setSubscriptionId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      Tenant ID
                    </label>
                    <input
                      type="text"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                      Client Secret
                    </label>
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Enter client secret"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                      required
                    />
                  </div>
                </>
              )}

              {selectedProvider === "digitalocean" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                    API Token
                  </label>
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="dop_v1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    required
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border)]"
                />
                <label
                  htmlFor="isDefault"
                  className="text-sm text-[var(--foreground)]"
                >
                  Set as default for {selectedProvider.toUpperCase()}
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Credential"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
