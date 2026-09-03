"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProjectStatus = "ACTIVE" | "COMPLETED" | "ON_HOLD";
type Project = {
  id: string;
  name: string;
  clientName: string | null;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  ACTIVE: "進行中",
  COMPLETED: "完了",
  ON_HOLD: "保留",
};

export default function ProjectAdminTable({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [newProject, setNewProject] = useState({ name: "", clientName: "", startDate: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createProject() {
    if (!newProject.name.trim()) return;
    setPending(true);
    await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProject),
    });
    setNewProject({ name: "", clientName: "", startDate: "" });
    setPending(false);
    router.refresh();
  }

  async function updateProject(id: string, data: Partial<Project>) {
    setPending(true);
    await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setPending(false);
    setEditingId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold">新規案件登録</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm">
            案件名
            <input
              value={newProject.name}
              onChange={(e) => setNewProject((s) => ({ ...s, name: e.target.value }))}
              className="rounded border px-2 py-1"
              placeholder="案件名"
            />
          </label>
          <label className="flex flex-col text-sm">
            クライアント名
            <input
              value={newProject.clientName}
              onChange={(e) => setNewProject((s) => ({ ...s, clientName: e.target.value }))}
              className="rounded border px-2 py-1"
              placeholder="任意"
            />
          </label>
          <label className="flex flex-col text-sm">
            開始日
            <input
              type="date"
              value={newProject.startDate}
              onChange={(e) => setNewProject((s) => ({ ...s, startDate: e.target.value }))}
              className="rounded border px-2 py-1"
            />
          </label>
          <button
            onClick={createProject}
            disabled={pending || !newProject.name.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            登録
          </button>
        </div>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold">案件一覧</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">案件名</th>
              <th>クライアント</th>
              <th>ステータス</th>
              <th>期間</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) =>
              editingId === p.id ? (
                <EditRow key={p.id} project={p} onCancel={() => setEditingId(null)} onSave={(data) => updateProject(p.id, data)} />
              ) : (
                <tr key={p.id} className="border-b">
                  <td className="py-2">{p.name}</td>
                  <td>{p.clientName || "-"}</td>
                  <td>
                    <span
                      className={
                        "rounded px-2 py-0.5 text-xs " +
                        (p.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : p.status === "ON_HOLD"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600")
                      }
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td>
                    {p.startDate || "-"} 〜 {p.endDate || "-"}
                  </td>
                  <td>
                    <button onClick={() => setEditingId(p.id)} className="text-xs text-blue-600 hover:underline">
                      編集
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function EditRow({
  project,
  onSave,
  onCancel,
}: {
  project: Project;
  onSave: (data: Partial<Project>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(project);
  return (
    <tr className="border-b bg-blue-50">
      <td className="py-2">
        <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} className="w-full rounded border px-2 py-1" />
      </td>
      <td>
        <input
          value={form.clientName ?? ""}
          onChange={(e) => setForm((s) => ({ ...s, clientName: e.target.value }))}
          className="w-full rounded border px-2 py-1"
        />
      </td>
      <td>
        <select
          value={form.status}
          onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as ProjectStatus }))}
          className="rounded border px-2 py-1"
        >
          <option value="ACTIVE">進行中</option>
          <option value="ON_HOLD">保留</option>
          <option value="COMPLETED">完了</option>
        </select>
      </td>
      <td>
        <div className="flex gap-1">
          <input type="date" value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} className="rounded border px-1 py-1 text-xs" />
          <input type="date" value={form.endDate} onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))} className="rounded border px-1 py-1 text-xs" />
        </div>
      </td>
      <td>
        <div className="flex gap-2">
          <button onClick={() => onSave(form)} className="text-xs text-blue-600 hover:underline">
            保存
          </button>
          <button onClick={onCancel} className="text-xs text-gray-500 hover:underline">
            取消
          </button>
        </div>
      </td>
    </tr>
  );
}
