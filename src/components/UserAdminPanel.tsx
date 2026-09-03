"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "MEMBER" | "MANAGER" | "ADMIN";
type UserRow = { id: string; name: string; email: string; department: string | null; role: Role; isActive: boolean };
type ProjectRow = { id: string; name: string };
type AssignmentRow = { id: string; userId: string; userName: string; projectId: string; projectName: string };

const ROLE_LABEL: Record<Role, string> = { MEMBER: "メンバー", MANAGER: "マネージャー", ADMIN: "管理者" };

export default function UserAdminPanel({
  users,
  projects,
  assignments,
}: {
  users: UserRow[];
  projects: ProjectRow[];
  assignments: AssignmentRow[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [assignUserId, setAssignUserId] = useState(users[0]?.id ?? "");
  const [assignProjectId, setAssignProjectId] = useState(projects[0]?.id ?? "");

  async function updateUser(id: string, data: Partial<UserRow>) {
    setPending(true);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setPending(false);
    router.refresh();
  }

  async function addAssignment() {
    if (!assignUserId || !assignProjectId) return;
    setPending(true);
    await fetch("/api/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: assignUserId, projectId: assignProjectId }),
    });
    setPending(false);
    router.refresh();
  }

  async function removeAssignment(id: string) {
    setPending(true);
    await fetch(`/api/admin/assignments/${id}`, { method: "DELETE" });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold">担当者一覧</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">氏名</th>
              <th>メール</th>
              <th>部署</th>
              <th>ロール</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={"border-b " + (!u.isActive ? "opacity-50" : "")}>
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.department || "-"}</td>
                <td>
                  <select
                    value={u.role}
                    disabled={pending}
                    onChange={(e) => updateUser(u.id, { role: e.target.value as Role })}
                    className="rounded border px-2 py-1"
                  >
                    <option value="MEMBER">{ROLE_LABEL.MEMBER}</option>
                    <option value="MANAGER">{ROLE_LABEL.MANAGER}</option>
                    <option value="ADMIN">{ROLE_LABEL.ADMIN}</option>
                  </select>
                </td>
                <td>
                  <button
                    disabled={pending}
                    onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                    className={
                      "rounded px-2 py-1 text-xs " +
                      (u.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-200 text-gray-600 hover:bg-gray-300")
                    }
                  >
                    {u.isActive ? "在籍中" : "退職済み（クリックで復帰）"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold">アサイン管理</h2>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm">
            担当者
            <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className="rounded border px-2 py-1">
              {users.filter((u) => u.isActive).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            案件
            <select value={assignProjectId} onChange={(e) => setAssignProjectId(e.target.value)} className="rounded border px-2 py-1">
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={addAssignment}
            disabled={pending || !assignUserId || !assignProjectId}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            アサイン追加
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">担当者</th>
              <th>案件</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="py-2">{a.userName}</td>
                <td>{a.projectName}</td>
                <td>
                  <button onClick={() => removeAssignment(a.id)} className="text-xs text-red-500 hover:underline">
                    解除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
