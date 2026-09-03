import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { runUnfilledCheck } from "@/lib/unfilledCheck";

/**
 * 未入力チェックのバッチ実行エンドポイント。
 * 以下いずれかの方法で認可する:
 *  1. Cloud Scheduler等からの呼び出し: ヘッダー "x-cron-secret" が CRON_SECRET と一致
 *  2. 管理画面からの手動実行: ADMIN権限のログインセッション
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = req.headers.get("x-cron-secret");

  let authorized = false;
  if (cronSecret && providedSecret === cronSecret) {
    authorized = true;
  } else {
    const session = await auth();
    if (session?.user?.role === "ADMIN") {
      authorized = true;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await runUnfilledCheck(body?.date);
  return NextResponse.json(result);
}
