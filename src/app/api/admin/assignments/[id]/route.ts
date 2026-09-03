import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/apiGuard";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireApiRole(Role.ADMIN);
  if ("error" in guard) return guard.error;

  await prisma.projectAssignment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
