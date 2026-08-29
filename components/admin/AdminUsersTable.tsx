"use client";

import { useMemo, useState } from "react";
import AdminUserActions from "@/components/admin/AdminUserActions";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  isPremium: boolean;
  isBanned: boolean;
  premiumUntil: Date | string | null;
  createdAt: Date | string;
};

type Props = {
  users: AdminUser[];
};

export default function AdminUsersTable({ users }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const matchesSearch = user.email
          .toLowerCase()
          .includes(search.toLowerCase());

        const matchesFilter =
          filter === "all" ||
          (filter === "premium" && user.isPremium) ||
          (filter === "banned" && user.isBanned) ||
          (filter === "admin" && user.role === "admin") ||
          (filter === "free" && !user.isPremium);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();

        return sort === "newest"
          ? bDate - aDate
          : aDate - bDate;
      });
  }, [users, search, filter, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user email..."
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/40 md:max-w-sm"
        />

        <div className="flex flex-wrap gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-400/40"
          >
            <option value="all">All users</option>
            <option value="premium">Premium</option>
            <option value="free">Free</option>
            <option value="banned">Banned</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-blue-400/40"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/[0.03]">
            <tr className="text-left text-sm text-white/60">
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Premium</th>
              <th className="px-6 py-4">Banned</th>
              <th className="px-6 py-4">Premium Until</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-white/5 text-sm text-white/80"
              >
                <td className="px-6 py-4">
                  <a
                    href={`/dashboard/admin/users/${user.id}`}
                    className="text-white transition hover:text-blue-400"
                  >
                    {user.email}
                  </a>
                </td>

                <td className="px-6 py-4">{user.role}</td>

                <td className="px-6 py-4">
                  {user.isPremium ? "YES" : "NO"}
                </td>

                <td className="px-6 py-4">
                  {user.isBanned ? "YES" : "NO"}
                </td>

                <td className="px-6 py-4">
                  {user.premiumUntil
                    ? new Date(user.premiumUntil).toLocaleDateString()
                    : "-"}
                </td>

                <td className="px-6 py-4">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>

                <td className="px-6 py-4">
                  <AdminUserActions
                    userId={user.id}
                    isPremium={user.isPremium}
                    isBanned={user.isBanned}
                    role={user.role}
                  />
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-sm text-white/40"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}