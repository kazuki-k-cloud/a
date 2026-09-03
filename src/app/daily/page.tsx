import Link from "next/link";
import { requireUser } from "@/lib/authGuard";
import { getAssignedActiveProjects, getDailyData } from "@/lib/dailyEntry";
import { addDays, formatDateJP, todayJST } from "@/lib/date";
import DailyEntryForm from "@/components/DailyEntryForm";

export default async function DailyPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const user = await requireUser();
  const date = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
    ? searchParams.date
    : todayJST();

  const [assignedProjects, { attendance, entries }] = await Promise.all([
    getAssignedActiveProjects(user.id),
    getDailyData(user.id, date),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/daily?date=${addDays(date, -1)}`} className="rounded border px-3 py-1 text-sm hover:bg-gray-100">
          ← 前日
        </Link>
        <h1 className="text-xl font-bold">{formatDateJP(date)}</h1>
        <Link href={`/daily?date=${addDays(date, 1)}`} className="rounded border px-3 py-1 text-sm hover:bg-gray-100">
          翌日 →
        </Link>
      </div>
      {date !== todayJST() && (
        <div className="mb-4 text-center">
          <Link href="/daily" className="text-sm text-blue-600 hover:underline">
            今日に戻る
          </Link>
        </div>
      )}

      <DailyEntryForm
        date={date}
        assignedProjects={assignedProjects.map((p) => ({ id: p.id, name: p.name, clientName: p.clientName }))}
        attendance={
          attendance
            ? {
                clockIn: attendance.clockIn?.toISOString() ?? null,
                clockOut: attendance.clockOut?.toISOString() ?? null,
                breakMinutes: attendance.breakMinutes,
              }
            : null
        }
        entries={entries.map((e) => ({ projectId: e.projectId, projectName: e.project.name, hours: e.hours }))}
      />
    </div>
  );
}
