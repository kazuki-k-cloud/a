import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/date";
import type { Role } from "@prisma/client";

export type MatrixData = {
  users: { id: string; name: string; department: string | null }[];
  projects: { id: string; name: string }[];
  cells: Record<string, Record<string, number>>; // userId -> projectId -> hours
  userTotals: Record<string, number>;
  projectTotals: Record<string, number>;
  grandTotal: number;
};

/**
 * 期間内の従業員×案件の工数マトリクスを取得する。
 * MANAGERの場合は自部署のメンバーのみに絞り込む。
 */
export async function getMatrixData(params: {
  from: string;
  to: string;
  viewerRole: Role;
  viewerDepartment: string | null;
}): Promise<MatrixData> {
  const from = toDateOnly(params.from);
  const to = toDateOnly(params.to);

  const userWhere =
    params.viewerRole === "MANAGER"
      ? { department: params.viewerDepartment }
      : {};

  const entries = await prisma.timeEntry.findMany({
    where: {
      date: { gte: from, lte: to },
      user: userWhere,
    },
    include: { user: true, project: true },
  });

  const userMap = new Map<string, { id: string; name: string; department: string | null }>();
  const projectMap = new Map<string, { id: string; name: string }>();
  const cells: Record<string, Record<string, number>> = {};
  const userTotals: Record<string, number> = {};
  const projectTotals: Record<string, number> = {};
  let grandTotal = 0;

  for (const e of entries) {
    userMap.set(e.userId, { id: e.user.id, name: e.user.name, department: e.user.department });
    projectMap.set(e.projectId, { id: e.project.id, name: e.project.name });

    cells[e.userId] ??= {};
    cells[e.userId][e.projectId] = (cells[e.userId][e.projectId] ?? 0) + e.hours;
    userTotals[e.userId] = (userTotals[e.userId] ?? 0) + e.hours;
    projectTotals[e.projectId] = (projectTotals[e.projectId] ?? 0) + e.hours;
    grandTotal += e.hours;
  }

  const users = Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name, "ja"));
  const projects = Array.from(projectMap.values()).sort((a, b) => a.name.localeCompare(b.name, "ja"));

  return { users, projects, cells, userTotals, projectTotals, grandTotal };
}
