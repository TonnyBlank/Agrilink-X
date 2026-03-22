import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { AdminUser, AppRole, ROLE_OPTIONS, formatDateTime } from "./shared";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<AdminUser[]>("/admin/users")
      .then(setUsers)
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "Failed to load users."));
  }, []);

  const updateUserRole = async (userId: string, role: AppRole) => {
    setSavingKey(`user-${userId}`);
    try {
      await apiFetch(`/admin/users/${userId}/role`, { method: "PATCH", body: { role } });
      setUsers((current) => current.map((user) => (user.user_id === userId ? { ...user, role } : user)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not update role.");
    } finally {
      setSavingKey(null);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!normalizedSearch) return true;
    const haystack = [
      user.full_name,
      user.email,
      user.phone,
      user.county,
      user.role,
      user.user_id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  return (
    <DashboardShell title="User Roles">
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-foreground">User management</h2>
          <p className="mt-1 text-sm text-muted-foreground">Keep admin access separate and assign the correct dashboard to each user.</p>
          {errorMessage ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{errorMessage}</div> : null}
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search user roles" className="mt-4 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
          <p className="mt-3 text-xs text-muted-foreground">{filteredUsers.length} users found</p>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Location</th>
                  <th className="px-3 py-3">Joined</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="border-b border-border/70 align-top text-sm last:border-b-0">
                    <td className="px-3 py-3.5">
                      <p className="font-semibold text-foreground">{user.full_name || "Unnamed user"}</p>
                      <p className="text-xs text-muted-foreground">{user.email || "No email found"}</p>
                    </td>
                    <td className="px-3 py-3.5 text-muted-foreground">{user.phone || "No phone"}</td>
                    <td className="px-3 py-3.5 text-muted-foreground">{user.county || "Not set"}</td>
                    <td className="px-3 py-3.5 text-muted-foreground">{formatDateTime(user.created_at)}</td>
                    <td className="px-3 py-3.5">
                      <select value={user.role} onChange={(event) => setUsers((current) => current.map((item) => (item.user_id === user.user_id ? { ...item, role: event.target.value as AppRole } : item)))} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground">
                        {ROLE_OPTIONS.map((roleOption) => (
                          <option key={roleOption} value={roleOption}>
                            {roleOption}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <Button type="button" className="rounded-xl" disabled={savingKey === `user-${user.user_id}`} onClick={() => void updateUserRole(user.user_id, user.role)}>
                        Save Role
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                      No users match that search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
