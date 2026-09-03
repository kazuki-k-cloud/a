import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

const isGoogleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/daily");
  }

  const devUsers = isGoogleConfigured
    ? []
    : await prisma.user.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: { email: true, name: true, role: true },
      });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold text-gray-800">工数管理システム</h1>
      <p className="text-sm text-gray-500">
        会社のGoogleアカウントでログインしてください。
      </p>
      {searchParams.error && (
        <p className="rounded bg-red-50 px-4 py-2 text-sm text-red-600">
          このGoogleアカウントではログインできません。会社ドメインのアカウントを使用するか、管理者にお問い合わせください。
        </p>
      )}
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/daily" });
        }}
      >
        <button
          type="submit"
          className="flex items-center gap-2 rounded border bg-white px-6 py-2 shadow-sm hover:bg-gray-50"
        >
          Googleでログイン
        </button>
      </form>

      {!isGoogleConfigured && (
        <div className="mt-8 w-full rounded border border-amber-300 bg-amber-50 p-4">
          <p className="mb-3 text-xs font-semibold text-amber-700">
            開発用ログイン（Google OAuth未設定のため表示中）
          </p>
          <div className="flex flex-col gap-2">
            {devUsers.map((u) => (
              <form
                key={u.email}
                action={async () => {
                  "use server";
                  await signIn("dev-login", {
                    email: u.email,
                    redirectTo: "/daily",
                  });
                }}
              >
                <button
                  type="submit"
                  className="w-full rounded border bg-white px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  {u.name}（{u.email} / {u.role}）としてログイン
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
