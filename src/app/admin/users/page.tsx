import { requireRole } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { ProjectStatus, Role } from "@prisma/client";
import UserAdminPanel from "@/components/UserAdminPanel";

export default async function AdminUsersPage() {
  await requireRole(Role.ADMIN);

  const [users, projects, assignments] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    prisma.project.findMany({
      where: { status: ProjectStatus.ACTIVE },
      orderBy: { name: "asc" },
    }),
    prisma.projectAssignment.findMany({
      include: { user: true, project: true },
      orderBy: [{ user: { name: "asc" } }, { project: { name: "asc" } }],
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-xl font-bold">担当者マスタ・アサイン管理</h1>
      <UserAdminPanel
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          department: u.department,
          role: u.role,
          isActive: u.isActive,
        }))}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        assignments={assignments.map((a) => ({
          id: a.id,
          userId: a.userId,
          userName: a.user.name,
          projectId: a.projectId,
          projectName: a.project.name,
        }))}
      />
    </div>
  );
}
