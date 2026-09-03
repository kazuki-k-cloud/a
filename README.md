# 工数管理システム

従業員100人規模の子会社（開発チーム50人以下）向けの社内工数管理システム。

- 誰がどのプロジェクトにどれだけ稼働しているかの可視化
- 勤務時間管理（出退勤の手入力管理）
- 案件横断で、案件ごとの合計工数を集計・閲覧

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド/バックエンド | Next.js 14 (App Router) + TypeScript |
| DB | PostgreSQL + Prisma ORM |
| 認証 | NextAuth.js (Auth.js v5) + Google Provider（会社ドメイン制限） |
| ホスティング | Google Cloud Run + Cloud SQL for PostgreSQL |
| メール送信 | Gmail API（未設定時はコンソールログ出力のモック） |

## ローカル開発

### 1. 前提

- Node.js 20+
- PostgreSQLが起動していること（Dockerでも、ローカルインストールでも可）

### 2. セットアップ

```bash
npm install
cp .env.example .env
# .env の DATABASE_URL 等を環境に合わせて編集

npx prisma migrate dev
npm run prisma:seed   # サンプルデータ（管理者/マネージャー/メンバー2名、案件3件）投入

npm run dev
```

http://localhost:3000 を開くとログイン画面が表示されます。

### 3. ログイン（開発用）

`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` が未設定の間は、ログイン画面に
シード済みユーザーをワンクリックで選択できる開発用ログインが表示されます
（本番相当のGoogle OAuthを設定すると自動的に非表示になります）。

本番相当のGoogle Workspace SSOを試す場合は、Google Cloud ConsoleでOAuthクライアントを作成し、
リダイレクトURIに `http://localhost:3000/api/auth/callback/google` を追加のうえ
`.env` に `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` を設定してください。
`ALLOWED_EMAIL_DOMAINS` に許可する会社ドメインをカンマ区切りで指定します。

### 4. Docker Composeでの起動（アプリ+DB一括）

```bash
docker compose up --build
```

起動後、別ターミナルでマイグレーションとシードを実行してください。

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app node -e "require('child_process')" # (任意) シードはnpm run prisma:seedをローカルから実行してもOK
```

## 主な機能

- Google Workspace SSOログイン（ドメイン制限、初回ログイン時にUser自動作成）
- 日次入力画面：出退勤ワンクリック打刻＋手動修正、案件ボタンでの工数入力（0.5h単位）、
  勤務時間と工数合計の乖離警告
- 案件マスタ・担当者マスタ・アサイン管理（ADMIN限定）
- 稼働可視化ダッシュボード：期間指定の従業員×案件マトリクス（MANAGERは自部署のみ、ADMINは全社）
- 未入力チェックバッチ：前営業日の未入力者を検出しリマインドメール送信（モック実装。管理画面から手動実行も可能）

## 権限

| 操作 | MEMBER | MANAGER | ADMIN |
|---|---|---|---|
| 自分の工数・勤怠入力 | ○ | ○ | ○ |
| 自部署の集計閲覧 | × | ○ | ○ |
| 全社集計閲覧 | × | × | ○ |
| 案件マスタ編集 | × | × | ○ |
| 担当者・アサイン管理 | × | × | ○ |

## デプロイ

Cloud Run / Cloud SQLへのデプロイ手順は [DEPLOY.md](./DEPLOY.md) を参照してください。
`Dockerfile` / `cloudbuild.yaml` を同梱しています。

## 今後の検討事項

- 工数入力の時間単位（現状0.5h刻み）
- 勤務時間と工数合計の乖離時、警告に留めるかブロックするか
- 案件新規登録権限をMANAGERにも開放するか
- CSVエクスポート、グラフ表示などダッシュボードの拡張
