const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 日本時間での「今日」の日付文字列 (YYYY-MM-DD) を返す */
export function todayJST(): string {
  const jst = new Date(Date.now() + JST_OFFSET_MS);
  return jst.toISOString().slice(0, 10);
}

/** YYYY-MM-DD文字列を、その日を表すUTC 00:00のDateに変換する（DB保存用） */
export function toDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** DateをYYYY-MM-DD文字列に変換する */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** dateStr（YYYY-MM-DD）に日数を加算した文字列を返す */
export function addDays(dateStr: string, days: number): string {
  const d = toDateOnly(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateString(d);
}

/** dateStr（YYYY-MM-DD）を "2026年9月3日(木)" 形式で表示する */
export function formatDateJP(dateStr: string): string {
  const d = toDateOnly(dateStr);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getUTCDay()];
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日(${weekday})`;
}

/** HH:mm文字列とdateStr(YYYY-MM-DD)から、その時刻を表すDateを作る（JSTとして解釈） */
export function combineDateAndTimeJST(dateStr: string, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const utcMs = toDateOnly(dateStr).getTime() + (h * 60 + m) * 60 * 1000 - JST_OFFSET_MS;
  return new Date(utcMs);
}

/** DateをJSTのHH:mm文字列に変換する */
export function toTimeStringJST(date: Date | null | undefined): string {
  if (!date) return "";
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return jst.toISOString().slice(11, 16);
}

/** 現在時刻(JST)をHH:mm文字列で返す */
export function nowTimeStringJST(): string {
  return toTimeStringJST(new Date());
}

/** dateStrを含む月の初日・末日（YYYY-MM-DD）を返す */
export function monthRange(dateStr: string): { from: string; to: string } {
  const d = toDateOnly(dateStr);
  const from = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const to = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return { from: toDateString(from), to: toDateString(to) };
}

/** dateStrを含む週（月曜〜日曜, YYYY-MM-DD）を返す */
export function weekRange(dateStr: string): { from: string; to: string } {
  const d = toDateOnly(dateStr);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const from = new Date(d);
  from.setUTCDate(from.getUTCDate() + diffToMonday);
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 6);
  return { from: toDateString(from), to: toDateString(to) };
}
