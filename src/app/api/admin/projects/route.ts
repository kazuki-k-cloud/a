import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/apiGuard";
import { prisma } from "@/lib/prisma";
import { ProjectStatus, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const guard = await requireApiRole(Role.ADMIN);
  if ("error" in guard) return guard.error;

  const body = await req.json().catch(() => null);
  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }
  if (body.status && !Object.values(ProjectStatus).includes(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: body.name,
      clientName: body.clientName || null,
      status: body.status ?? ProjectStatus.ACTIVE,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
