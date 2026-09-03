import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

// Google OAuth未設定時（ローカル動作確認用）のみ、メールアドレス選択だけでログインできる
// 開発用プロバイダーを有効化する。本番ではAUTH_GOOGLE_ID/SECRETを設定して無効化すること。
const isGoogleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

const devCredentialsProvider = Credentials({
  id: "dev-login",
  name: "開発用ログイン（メール選択）",
  credentials: {
    email: { label: "Email", type: "text" },
  },
  async authorize(credentials) {
    const email = credentials?.email;
    if (typeof email !== "string" || !email) return null;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name };
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Cloud Run等、リクエストのHostヘッダーが実行時まで確定しない環境で
  // "UntrustedHost"エラーになるのを避けるため信頼する。
  // NEXTAUTH_URL/AUTH_URLを正しく設定した上での利用を前提とする。
  trustHost: true,
  providers: isGoogleConfigured ? [Google] : [Google, devCredentialsProvider],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      // 会社ドメイン制限：許可ドメインが設定されている場合のみチェック
      const domain = email.split("@")[1];
      if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
        return "/login?error=AccessDenied";
      }

      // 退職者（isActive=false）はログイン不可
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && !existing.isActive) {
        return "/login?error=AccessDenied";
      }

      return true;
    },
    async jwt({ token, user }) {
      // 初回ログイン時（userが渡される）：DBのUserレコード（無ければ自動作成）と紐付ける
      if (user?.email) {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {},
          create: {
            email: user.email,
            name: user.name ?? user.email,
            image: user.image ?? undefined,
          },
        });
        token.sub = dbUser.id;
        token.role = dbUser.role;
        token.isActive = dbUser.isActive;
        token.name = dbUser.name;
        token.department = dbUser.department;
      } else if (token.sub) {
        // 以降のリクエスト：role/isActive/departmentの変更を反映するため都度DBを参照
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        if (dbUser) {
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
          token.name = dbUser.name;
          token.department = dbUser.department;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role) ?? "MEMBER";
        session.user.isActive = (token.isActive as boolean) ?? true;
        session.user.department = (token.department as string | null) ?? null;
        if (typeof token.name === "string") {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
});
