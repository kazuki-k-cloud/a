import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/apiGuard";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireApiRole(Role.ADMIN);
  if ("error" in guard) return guard.error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  if (body.role && !Object.values(Role).includes(body.role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(body.role !== undefined && { role: body.role }),
      ...(body.isActive !== undefined && {
        isActive: Boolean(body.isActive),
        leftAt: body.isActive ? null : new Date(),
      }),
      ...(body.department !== undefined && { department: body.department || null }),
    },
  });
  return NextResponse.json(user);
}
