"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded border px-3 py-1 text-gray-600 hover:bg-gray-100"
    >
      ログアウト
    </button>
  );
}
