import { getSession } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin-dashboard";
import { UserDashboard } from "@/components/user-dashboard";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return session.role === "admin" ? (
    <AdminDashboard user={session} />
  ) : (
    <UserDashboard user={session} />
  );
}
