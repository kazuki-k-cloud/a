import Link from "next/link";
import { requireRole } from "@/lib/authGuard";
import { getMatrixData } from "@/lib/dashboard";
import { monthRange, todayJST, weekRange } from "@/lib/date";
import { Role } from "@prisma/client";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const user = await requireRole(Role.MANAGER);

  const defaultRange = monthRange(todayJST());
  const from = searchParams.from && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.from) ? searchParams.from : defaultRange.from;
  const to = searchParams.to && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.to) ? searchParams.to : defaultRange.to;

  const { users, projects, cells, userTotals, projectTotals, grandTotal } = await getMatrixData({
    from,
    to,
    viewerRole: user.role,
    viewerDepartment: user.department,
  });

  const thisWeek = weekRange(todayJST());
  const thisMonth = monthRange(todayJST());

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold">稼働可視化ダッシュボード</h1>
      <p className="mb-6 text-sm text-gray-500">
        {user.role === "ADMIN" ? "全社の稼働状況を表示しています。" : "自部署の稼働状況を表示しています。"}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard?from=${thisWeek.from}&to=${thisWeek.to}`}
          className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
        >
          今週
        </Link>
        <Link
          href={`/dashboard?from=${thisMonth.from}&to=${thisMonth.to}`}
          className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
        >
          今月
        </Link>
        <form className="flex items-center gap-2 text-sm">
          <input type="date" name="from" defaultValue={from} className="rounded border px-2 py-1" />
          <span>〜</span>
          <input type="date" name="to" defaultValue={to} className="rounded border px-2 py-1" />
          <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700">
            表示
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="sticky left-0 bg-gray-50 px-3 py-2">従業員</th>
              {projects.map((p) => (
                <th key={p.id} className="px-3 py-2 text-right">
                  {p.name}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-bold">合計</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={projects.length + 2} className="px-3 py-6 text-center text-gray-400">
                  対象期間の工数データがありません。
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="sticky left-0 bg-white px-3 py-2">{u.name}</td>
                {projects.map((p) => (
                  <td key={p.id} className="px-3 py-2 text-right font-mono">
                    {cells[u.id]?.[p.id] ? cells[u.id][p.id].toFixed(1) : "-"}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-mono font-bold">{(userTotals[u.id] ?? 0).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
          {users.length > 0 && (
            <tfoot>
              <tr className="border-t bg-gray-50 font-bold">
                <td className="sticky left-0 bg-gray-50 px-3 py-2">合計</td>
                {projects.map((p) => (
                  <td key={p.id} className="px-3 py-2 text-right font-mono">
                    {(projectTotals[p.id] ?? 0).toFixed(1)}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-mono">{grandTotal.toFixed(1)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
