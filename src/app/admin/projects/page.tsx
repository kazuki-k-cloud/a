import { requireRole } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import ProjectAdminTable from "@/components/ProjectAdminTable";

export default async function AdminProjectsPage() {
  await requireRole(Role.ADMIN);

  const projects = await prisma.project.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-xl font-bold">案件マスタ</h1>
      <ProjectAdminTable
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          clientName: p.clientName,
          status: p.status,
          startDate: p.startDate ? p.startDate.toISOString().slice(0, 10) : "",
          endDate: p.endDate ? p.endDate.toISOString().slice(0, 10) : "",
        }))}
      />
    </div>
  );
}
