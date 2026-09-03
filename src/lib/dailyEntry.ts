import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/date";
import { ProjectStatus } from "@prisma/client";

export async function getAssignedActiveProjects(userId: string) {
  const assignments = await prisma.projectAssignment.findMany({
    where: {
      userId,
      project: { status: ProjectStatus.ACTIVE },
    },
    include: { project: true },
    orderBy: { project: { name: "asc" } },
  });
  return assignments.map((a) => a.project);
}

export async function getDailyData(userId: string, dateStr: string) {
  const date = toDateOnly(dateStr);

  const [attendance, entries] = await Promise.all([
    prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    }),
    prisma.timeEntry.findMany({
      where: { userId, date },
      include: { project: true },
    }),
  ]);

  return { attendance, entries };
}
