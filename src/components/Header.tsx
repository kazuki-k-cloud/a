import Link from "next/link";
import { auth } from "@/auth";
import LogoutButton from "@/components/LogoutButton";

const ROLE_LABEL: Record<string, string> = {
  MEMBER: "メンバー",
  MANAGER: "マネージャー",
  ADMIN: "管理者",
};

export default async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/daily" className="text-lg font-bold text-blue-700">
            工数管理システム
          </Link>
          {user && (
            <nav className="flex gap-4 text-sm">
              <Link href="/daily" className="hover:text-blue-600">
                日次入力
              </Link>
              {(user.role === "MANAGER" || user.role === "ADMIN") && (
                <Link href="/dashboard" className="hover:text-blue-600">
                  ダッシュボード
                </Link>
              )}
              {user.role === "ADMIN" && (
                <>
                  <Link href="/admin/projects" className="hover:text-blue-600">
                    案件マスタ
                  </Link>
                  <Link href="/admin/users" className="hover:text-blue-600">
                    担当者マスタ
                  </Link>
                  <Link href="/admin/unfilled" className="hover:text-blue-600">
                    未入力チェック
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">
              {user.name}（{ROLE_LABEL[user.role]}）
            </span>
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
