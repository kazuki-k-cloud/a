import { requireRole } from "@/lib/authGuard";
import { previousBusinessDay } from "@/lib/unfilledCheck";
import { formatDateJP, todayJST } from "@/lib/date";
import { Role } from "@prisma/client";
import UnfilledCheckPanel from "@/components/UnfilledCheckPanel";

export default async function AdminUnfilledPage() {
  await requireRole(Role.ADMIN);

  const targetDate = previousBusinessDay(todayJST());

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-xl font-bold">未入力チェック（バッチ処理）</h1>
      <p className="mb-6 text-sm text-gray-500">
        前営業日（{formatDateJP(targetDate)}）の工数が未入力の在籍中ユーザーを検出し、リマインドメールを送信します。
        現在はメール送信をコンソールログ出力でモック実装しています（環境変数MAIL_PROVIDER=gmailでGmail API連携に切替可能）。
        本番運用ではCloud Schedulerから毎朝9時に <code className="rounded bg-gray-100 px-1">/api/unfilled/check</code> を呼び出す想定です。
      </p>
      <UnfilledCheckPanel defaultDate={targetDate} />
    </div>
  );
}
