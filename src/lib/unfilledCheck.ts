import { prisma } from "@/lib/prisma";
import { formatDateJP, toDateOnly, toDateString, todayJST } from "@/lib/date";
import { sendMail } from "@/lib/mail";

/** dateStrの前営業日（土日を除く直近の日）をYYYY-MM-DD形式で返す */
export function previousBusinessDay(dateStr: string): string {
  const d = toDateOnly(dateStr);
  do {
    d.setUTCDate(d.getUTCDate() - 1);
  } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return toDateString(d);
}

/** 指定日にTimeEntryが1件も無い在籍中のユーザー一覧を返す */
export async function findUnfilledUsers(dateStr: string) {
  const date = toDateOnly(dateStr);

  const [activeUsers, entries] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true } }),
    prisma.timeEntry.findMany({ where: { date }, select: { userId: true } }),
  ]);

  const filledUserIds = new Set(entries.map((e) => e.userId));
  return activeUsers.filter((u) => !filledUserIds.has(u.id));
}

/**
 * 未入力チェックを実行し、対象者にリマインドメール（モック実装ではコンソールログ）を送信する。
 * dateStrを省略した場合は前営業日をチェック対象とする。
 */
export async function runUnfilledCheck(dateStr?: string) {
  const targetDate = dateStr ?? previousBusinessDay(todayJST());
  const unfilledUsers = await findUnfilledUsers(targetDate);
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  for (const user of unfilledUsers) {
    await sendMail({
      to: user.email,
      subject: "【工数入力のお願い】昨日分が未入力です",
      text: `${user.name}さん\n\n${formatDateJP(targetDate)}の工数がまだ入力されていません。\n以下のリンクから入力をお願いします。\n${baseUrl}/daily?date=${targetDate}\n`,
    });
  }

  return {
    targetDate,
    checkedAt: new Date().toISOString(),
    unfilledUsers: unfilledUsers.map((u) => ({ id: u.id, name: u.name, email: u.email })),
  };
}
