type MailMessage = { to: string; subject: string; text: string };

/**
 * メール送信の抽象化。
 * MAIL_PROVIDER=mock（デフォルト）: コンソールログ出力のみ。
 * MAIL_PROVIDER=gmail: Gmail API（サービスアカウント経由）で送信。
 *   GMAIL_SERVICE_ACCOUNT_KEY / GMAIL_SENDER_EMAIL が環境変数に用意され次第、
 *   googleapis の gmail.users.messages.send を呼び出す実装に差し替える。
 */
export async function sendMail(msg: MailMessage): Promise<void> {
  const provider = process.env.MAIL_PROVIDER ?? "mock";

  if (provider === "gmail") {
    await sendViaGmail(msg);
    return;
  }

  console.log(
    `[MOCK MAIL]\nTo: ${msg.to}\nSubject: ${msg.subject}\n---\n${msg.text}\n---`
  );
}

async function sendViaGmail(msg: MailMessage): Promise<void> {
  const key = process.env.GMAIL_SERVICE_ACCOUNT_KEY;
  const sender = process.env.GMAIL_SENDER_EMAIL;

  if (!key || !sender) {
    console.warn(
      "[Gmail] GMAIL_SERVICE_ACCOUNT_KEY / GMAIL_SENDER_EMAIL が未設定のため、コンソールログにフォールバックします。"
    );
    console.log(`[MOCK MAIL - gmail fallback]\nTo: ${msg.to}\nSubject: ${msg.subject}\n---\n${msg.text}\n---`);
    return;
  }

  // TODO: Gmail API連携（googleapis パッケージ導入後に実装）
  // const { google } = await import("googleapis");
  // const auth = new google.auth.JWT({
  //   email: JSON.parse(key).client_email,
  //   key: JSON.parse(key).private_key,
  //   subject: sender,
  //   scopes: ["https://www.googleapis.com/auth/gmail.send"],
  // });
  // const gmail = google.gmail({ version: "v1", auth });
  // const raw = Buffer.from(
  //   `To: ${msg.to}\r\nSubject: ${msg.subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${msg.text}`
  // ).toString("base64url");
  // await gmail.users.messages.send({ userId: "me", requestBody: { raw } });

  throw new Error("Gmail API連携は未実装です。googleapisパッケージを導入し、上記TODOを実装してください。");
}
