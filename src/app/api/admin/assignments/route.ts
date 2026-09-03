import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/apiGuard";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const guard = await requireApiRole(Role.ADMIN);
  if ("error" in guard) return guard.error;

  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.projectId) {
    return NextResponse.json({ error: "userId_and_projectId_required" }, { status: 400 });
  }

  const assignment = await prisma.projectAssignment.upsert({
    where: { userId_projectId: { userId: body.userId, projectId: body.projectId } },
    update: {},
    create: { userId: body.userId, projectId: body.projectId },
  });
  return NextResponse.json(assignment, { status: 201 });
}
