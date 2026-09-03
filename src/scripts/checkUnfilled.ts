/**
 * 未入力チェックのCLI実行スクリプト。
 * 使い方: npm run unfilled:check [-- YYYY-MM-DD]
 * Cloud Run上ではCloud SchedulerからHTTPエンドポイント(/api/unfilled/check)を叩く運用を想定しているが、
 * ローカル確認やcron直接実行用にこのスクリプトも用意する。
 */
import { runUnfilledCheck } from "@/lib/unfilledCheck";
import { prisma } from "@/lib/prisma";

async function main() {
  const dateArg = process.argv[2];
  const result = await runUnfilledCheck(dateArg);
  console.log(`未入力チェック対象日: ${result.targetDate}`);
  console.log(`未入力者数: ${result.unfilledUsers.length}`);
  for (const u of result.unfilledUsers) {
    console.log(` - ${u.name} <${u.email}>`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
