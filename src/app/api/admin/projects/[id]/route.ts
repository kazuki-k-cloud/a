import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/apiGuard";
import { prisma } from "@/lib/prisma";
import { ProjectStatus, Role } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireApiRole(Role.ADMIN);
  if ("error" in guard) return guard.error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  if (body.status && !Object.values(ProjectStatus).includes(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.clientName !== undefined && { clientName: body.clientName || null }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
      ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
    },
  });
  return NextResponse.json(project);
}
