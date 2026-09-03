import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { combineDateAndTimeJST, toDateOnly } from "@/lib/date";

type EntryInput = { projectId: string; hours: number; memo?: string };

type DailyPayload = {
  date: string; // YYYY-MM-DD
  clockIn: string | null; // HH:mm
  clockOut: string | null; // HH:mm
  breakMinutes: number;
  entries: EntryInput[];
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: DailyPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  if (!Array.isArray(body.entries)) {
    return NextResponse.json({ error: "invalid_entries" }, { status: 400 });
  }

  const date = toDateOnly(body.date);
  const clockIn = body.clockIn ? combineDateAndTimeJST(body.date, body.clockIn) : null;
  const clockOut = body.clockOut ? combineDateAndTimeJST(body.date, body.clockOut) : null;
  const breakMinutes = Number.isFinite(body.breakMinutes) ? Math.max(0, body.breakMinutes) : 0;

  const validEntries = body.entries
    .filter((e) => e.projectId && Number.isFinite(e.hours) && e.hours > 0)
    .map((e) => ({ projectId: e.projectId, hours: Math.round(e.hours * 2) / 2, memo: e.memo ?? null }));

  await prisma.$transaction(async (tx) => {
    await tx.attendance.upsert({
      where: { userId_date: { userId, date } },
      update: { clockIn, clockOut, breakMinutes },
      create: { userId, date, clockIn, clockOut, breakMinutes },
    });

    const existing = await tx.timeEntry.findMany({
      where: { userId, date },
      select: { id: true, projectId: true },
    });

    const keepProjectIds = new Set(validEntries.map((e) => e.projectId));
    const toDelete = existing.filter((e) => !keepProjectIds.has(e.projectId));
    if (toDelete.length > 0) {
      await tx.timeEntry.deleteMany({
        where: { id: { in: toDelete.map((e) => e.id) } },
      });
    }

    for (const entry of validEntries) {
      await tx.timeEntry.upsert({
        where: { userId_projectId_date: { userId, projectId: entry.projectId, date } },
        update: { hours: entry.hours, memo: entry.memo },
        create: { userId, projectId: entry.projectId, date, hours: entry.hours, memo: entry.memo },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
