# デプロイ手順（Google Cloud Run / Cloud SQL）

## 前提

- GCPプロジェクトが用意済みで、課金が有効
- `gcloud` CLIでログイン・プロジェクト設定済み

## 1. 必要なAPIの有効化

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com
```

## 2. Artifact Registryリポジトリ作成

```bash
gcloud artifacts repositories create koudo-app \
  --repository-format=docker \
  --location=asia-northeast1
```

## 3. Cloud SQL for PostgreSQL作成

```bash
gcloud sql instances create koudo-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=asia-northeast1

gcloud sql databases create koudo_db --instance=koudo-db
gcloud sql users create app --instance=koudo-db --password=<STRONG_PASSWORD>
```

## 4. Secret Managerにシークレット登録

```bash
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe koudo-db --format='value(connectionName)')

# Cloud Run実行時用（unixソケット経由）
echo -n "postgresql://app:<STRONG_PASSWORD>@localhost/koudo_db?host=/cloudsql/${INSTANCE_CONNECTION_NAME}" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Cloud Buildのマイグレーション実行用（Cloud SQL Auth Proxy経由）
echo -n "postgresql://app:<STRONG_PASSWORD>@cloudsql-proxy:5432/koudo_db?schema=public" | \
  gcloud secrets create DATABASE_URL_MIGRATE --data-file=-

openssl rand -base64 33 | gcloud secrets create AUTH_SECRET --data-file=-
echo -n "<Google OAuth Client ID>" | gcloud secrets create AUTH_GOOGLE_ID --data-file=-
echo -n "<Google OAuth Client Secret>" | gcloud secrets create AUTH_GOOGLE_SECRET --data-file=-
openssl rand -base64 33 | gcloud secrets create CRON_SECRET --data-file=-
```

Cloud BuildおよびCloud Runのサービスアカウントに `roles/secretmanager.secretAccessor` と
`roles/cloudsql.client` を付与してください。

## 5. ビルド・デプロイ

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_CLOUDSQL_INSTANCE=${INSTANCE_CONNECTION_NAME},_APP_URL=https://<CloudRunのURL>,_ALLOWED_EMAIL_DOMAINS=yourcompany.com
```

初回はCloud RunのURLが確定していないため、一度デプロイしてURLを確認した後、
`_APP_URL` を更新して再実行してください（`NEXTAUTH_URL`にも影響します）。

## 6. Google OAuth設定

Google Cloud ConsoleのOAuth同意画面・認証情報で、リダイレクトURIに以下を追加:

```
https://<CloudRunのURL>/api/auth/callback/google
```

## 7. 未入力チェックバッチのスケジュール設定（Cloud Scheduler）

毎朝9時（JST）に前営業日の未入力チェックを実行し、リマインドメールを送信します。

```bash
gcloud scheduler jobs create http koudo-unfilled-check \
  --location=asia-northeast1 \
  --schedule="0 9 * * 1-5" \
  --time-zone="Asia/Tokyo" \
  --uri="https://<CloudRunのURL>/api/unfilled/check" \
  --http-method=POST \
  --headers="x-cron-secret=<CRON_SECRETの値>,Content-Type=application/json" \
  --message-body="{}"
```

## メール送信をGmail APIに切り替える

1. Google Workspace管理コンソールでサービスアカウントにドメイン全体の委任を設定し、
   `https://www.googleapis.com/auth/gmail.send` スコープを許可
2. `npm install googleapis` を実行し、`src/lib/mail.ts` の `sendViaGmail` 内のTODOを実装
3. Secret Managerに `GMAIL_SERVICE_ACCOUNT_KEY`（サービスアカウントキーJSON）を登録し、
   Cloud Runの環境変数 `MAIL_PROVIDER=gmail` を設定
