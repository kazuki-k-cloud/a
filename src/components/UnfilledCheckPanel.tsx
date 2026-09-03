"use client";

import { useState } from "react";

type Result = {
  targetDate: string;
  checkedAt: string;
  unfilledUsers: { id: string; name: string; email: string }[];
};

export default function UnfilledCheckPanel({ defaultDate }: { defaultDate: string }) {
  const [date, setDate] = useState(defaultDate);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);

  async function runCheck() {
    setPending(true);
    setResult(null);
    const res = await fetch("/api/unfilled/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    if (res.ok) {
      setResult(await res.json());
    }
    setPending(false);
  }

  return (
    <div className="rounded border bg-white p-4">
      <div className="mb-4 flex items-end gap-3">
        <label className="flex flex-col text-sm">
          対象日
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border px-2 py-1" />
        </label>
        <button
          onClick={runCheck}
          disabled={pending}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "実行中..." : "未入力チェックを実行"}
        </button>
      </div>

      {result && (
        <div className="rounded bg-gray-50 p-3 text-sm">
          <p className="mb-2 font-medium">
            {result.targetDate} 時点の未入力者: {result.unfilledUsers.length}名
          </p>
          {result.unfilledUsers.length === 0 ? (
            <p className="text-gray-500">未入力者はいません。</p>
          ) : (
            <ul className="list-disc pl-5">
              {result.unfilledUsers.map((u) => (
                <li key={u.id}>
                  {u.name}（{u.email}）にリマインドメールを送信しました（モック：サーバーログを確認）
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
