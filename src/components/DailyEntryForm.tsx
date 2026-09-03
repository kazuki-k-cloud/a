"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { nowTimeStringJST, toTimeStringJST } from "@/lib/date";

type Project = { id: string; name: string; clientName: string | null };
type EntryState = { projectId: string; projectName: string; hours: number };

export default function DailyEntryForm({
  date,
  assignedProjects,
  attendance,
  entries,
}: {
  date: string;
  assignedProjects: Project[];
  attendance: { clockIn: string | null; clockOut: string | null; breakMinutes: number } | null;
  entries: EntryState[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [clockIn, setClockIn] = useState(toTimeStringJST(attendance?.clockIn ? new Date(attendance.clockIn) : null));
  const [clockOut, setClockOut] = useState(toTimeStringJST(attendance?.clockOut ? new Date(attendance.clockOut) : null));
  const [breakMinutes, setBreakMinutes] = useState(attendance?.breakMinutes ?? 0);
  const [selected, setSelected] = useState<EntryState[]>(entries);

  const workHours = useMemo(() => {
    if (!clockIn || !clockOut) return null;
    const [ih, im] = clockIn.split(":").map(Number);
    const [oh, om] = clockOut.split(":").map(Number);
    const diffMin = oh * 60 + om - (ih * 60 + im) - breakMinutes;
    return Math.round((diffMin / 60) * 100) / 100;
  }, [clockIn, clockOut, breakMinutes]);

  const totalEntryHours = useMemo(
    () => Math.round(selected.reduce((sum, e) => sum + e.hours, 0) * 100) / 100,
    [selected]
  );

  const diverges = workHours !== null && Math.abs(workHours - totalEntryHours) > 0.01;

  function save(next: { clockIn: string | null; clockOut: string | null; breakMinutes: number; entries: EntryState[] }) {
    startTransition(async () => {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          clockIn: next.clockIn || null,
          clockOut: next.clockOut || null,
          breakMinutes: next.breakMinutes,
          entries: next.entries.map((e) => ({ projectId: e.projectId, hours: e.hours })),
        }),
      });
      if (res.ok) {
        setMessage("保存しました");
        router.refresh();
      } else {
        setMessage("保存に失敗しました");
      }
      setTimeout(() => setMessage(null), 2000);
    });
  }

  function handleClockIn() {
    const t = nowTimeStringJST();
    setClockIn(t);
    save({ clockIn: t, clockOut, breakMinutes, entries: selected });
  }

  function handleClockOut() {
    const t = nowTimeStringJST();
    setClockOut(t);
    save({ clockIn, clockOut: t, breakMinutes, entries: selected });
  }

  function handleSaveAll() {
    save({ clockIn, clockOut, breakMinutes, entries: selected });
  }

  function addProject(p: Project) {
    setSelected((prev) => {
      const idx = prev.findIndex((e) => e.projectId === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], hours: Math.round((next[idx].hours + 0.5) * 10) / 10 };
        return next;
      }
      return [...prev, { projectId: p.id, projectName: p.name, hours: 0.5 }];
    });
  }

  function adjustHours(projectId: string, delta: number) {
    setSelected((prev) =>
      prev
        .map((e) =>
          e.projectId === projectId
            ? { ...e, hours: Math.max(0, Math.round((e.hours + delta) * 10) / 10) }
            : e
        )
        .filter((e) => e.hours > 0)
    );
  }

  function removeProject(projectId: string) {
    setSelected((prev) => prev.filter((e) => e.projectId !== projectId));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 出退勤 */}
      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold">出退勤</h2>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleClockIn}
            disabled={isPending}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            出勤
          </button>
          <button
            onClick={handleClockOut}
            disabled={isPending}
            className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            退勤
          </button>
          <label className="flex items-center gap-1 text-sm">
            出勤時刻
            <input
              type="time"
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
              className="rounded border px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-1 text-sm">
            退勤時刻
            <input
              type="time"
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
              className="rounded border px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-1 text-sm">
            休憩(分)
            <input
              type="number"
              min={0}
              step={5}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="w-20 rounded border px-2 py-1"
            />
          </label>
        </div>
      </section>

      {/* 工数入力 */}
      <section className="rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold">工数入力</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {assignedProjects.length === 0 && (
            <p className="text-sm text-gray-500">アサインされている進行中の案件がありません。管理者にお問い合わせください。</p>
          )}
          {assignedProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => addProject(p)}
              className="rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {selected.length === 0 && <p className="text-sm text-gray-400">案件ボタンを押して工数を追加してください。</p>}
          {selected.map((e) => (
            <div key={e.projectId} className="flex items-center justify-between rounded border px-3 py-2">
              <span className="text-sm">{e.projectName}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustHours(e.projectId, -0.5)}
                  className="h-7 w-7 rounded border text-sm hover:bg-gray-100"
                >
                  -0.5h
                </button>
                <span className="w-14 text-center font-mono">{e.hours.toFixed(1)}h</span>
                <button
                  onClick={() => adjustHours(e.projectId, 0.5)}
                  className="h-7 w-7 rounded border text-sm hover:bg-gray-100"
                >
                  +0.5h
                </button>
                <button
                  onClick={() => removeProject(e.projectId)}
                  className="ml-2 text-xs text-red-500 hover:underline"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 集計・警告 */}
      <section className="rounded border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            合計工数: <span className="font-mono font-semibold">{totalEntryHours.toFixed(1)}h</span>
          </div>
          <div>
            勤務時間: <span className="font-mono font-semibold">{workHours !== null ? `${workHours.toFixed(1)}h` : "-"}</span>
          </div>
        </div>
        {diverges && (
          <p className="mt-2 rounded bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
            ⚠ 勤務時間と合計工数が一致していません。入力内容をご確認ください（入力のブロックはされません）。
          </p>
        )}
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveAll}
          disabled={isPending}
          className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          保存
        </button>
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    </div>
  );
}
