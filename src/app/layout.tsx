import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "工数管理システム",
  description: "社内工数・勤怠管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-gray-50 text-gray-900">
        <SessionProviderWrapper>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
