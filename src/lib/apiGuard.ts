import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Role } from "@prisma/client";

const ROLE_RANK: Record<Role, number> = {
  MEMBER: 0,
  MANAGER: 1,
  ADMIN: 2,
};

/** APIルート用: セッションと権限を確認し、不足していれば401/403のNextResponseを返す */
export async function requireApiRole(minRole: Role) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) } as const;
  }
  if (ROLE_RANK[session.user.role] < ROLE_RANK[minRole]) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) } as const;
  }
  return { user: session.user } as const;
}
