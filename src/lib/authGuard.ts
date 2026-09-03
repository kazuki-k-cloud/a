import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@prisma/client";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

const ROLE_RANK: Record<Role, number> = {
  MEMBER: 0,
  MANAGER: 1,
  ADMIN: 2,
};

/** 指定ロール以上の権限を要求する。不足していれば /daily にリダイレクト */
export async function requireRole(minRole: Role) {
  const user = await requireUser();
  if (ROLE_RANK[user.role] < ROLE_RANK[minRole]) {
    redirect("/daily");
  }
  return user;
}
