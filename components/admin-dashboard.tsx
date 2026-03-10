"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Trash2, Loader2, Shield, User } from "lucide-react";
import { AddTeamMemberModal } from "./add-team-member-modal";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
}

interface AdminDashboardProps {
  user: {
    userId: string;
    name: string;
    email: string;
    role: "admin" | "user";
  };
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (data.users) {
        setTeamMembers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team member?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTeamMembers((prev) => prev.filter((member) => member._id !== id));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMemberAdded = () => {
    fetchTeamMembers();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            Team Management
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Welcome back, {user.name}. Manage your team members below.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
        >
          <UserPlus className="h-4 w-4" />
          Add Team Member
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--secondary)]">
              <Users className="h-6 w-6 text-[var(--secondary-foreground)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Total Members
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {teamMembers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--secondary)]">
              <Shield className="h-6 w-6 text-[var(--secondary-foreground)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Admins</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {teamMembers.filter((m) => m.role === "admin").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--secondary)]">
              <User className="h-6 w-6 text-[var(--secondary-foreground)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Users</p>
              <p className="text-2xl font-bold text-[var(--foreground)]">
                {teamMembers.filter((m) => m.role === "user").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Team Members
          </h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              No team members yet. Add your first team member to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {teamMembers.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--secondary)]">
                    {member.role === "admin" ? (
                      <Shield className="h-5 w-5 text-[var(--secondary-foreground)]" />
                    ) : (
                      <User className="h-5 w-5 text-[var(--secondary-foreground)]" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {member.name}
                      {member._id === user.userId && (
                        <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      member.role === "admin"
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--secondary)] text-[var(--secondary-foreground)]"
                    }`}
                  >
                    {member.role}
                  </span>

                  {member._id !== user.userId && (
                    <button
                      onClick={() => handleDeleteUser(member._id)}
                      disabled={deletingId === member._id}
                      className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)] disabled:cursor-not-allowed disabled:opacity-50"
                      title="Delete member"
                    >
                      {deletingId === member._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleMemberAdded}
      />
    </div>
  );
}
