import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StatsDay } from "./types";

export type { StatsDay };

type StatsFile = { days: StatsDay[] };

const dataDir = path.join(process.cwd(), "data");
const statsPath = path.join(dataDir, "stats.json");
const MOSCOW = "Europe/Moscow";

let queue: Promise<unknown> = Promise.resolve();

function lock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function calendarDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: MOSCOW }).format(date);
}

function today() {
  return calendarDate();
}

function shiftMoscowDate(date: Date, days: number) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: MOSCOW }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const utc = Date.UTC(year, month - 1, day + days);
  return calendarDate(new Date(utc));
}

async function readStats(): Promise<StatsFile> {
  try {
    const raw = await readFile(statsPath, "utf8");
    const parsed = JSON.parse(raw) as StatsFile;
    return { days: parsed.days ?? [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { days: [] };
    }
    throw error;
  }
}

async function writeStats(file: StatsFile) {
  await mkdir(dataDir, { recursive: true });
  const days = [...file.days].sort((a, b) => a.date.localeCompare(b.date)).slice(-60);
  await writeFile(statsPath, JSON.stringify({ days }, null, 2));
}

function emptyDay(date: string): StatsDay {
  return { date, pageviews: 0, sessions: 0, applyStarts: 0, applySubmits: 0 };
}

export async function recordStat(event: "pageview" | "session" | "apply_start" | "apply_submit") {
  return lock(async () => {
    const file = await readStats();
    const date = today();
    let day = file.days.find((item) => item.date === date);
    if (!day) {
      day = emptyDay(date);
      file.days.push(day);
    }
    if (event === "pageview") day.pageviews += 1;
    if (event === "session") day.sessions += 1;
    if (event === "apply_start") day.applyStarts += 1;
    if (event === "apply_submit") day.applySubmits += 1;
    await writeStats(file);
    return day;
  });
}

export async function listStats(days = 14): Promise<StatsDay[]> {
  const file = await lock(readStats);
  const out: StatsDay[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const key = shiftMoscowDate(now, -i);
    out.push(file.days.find((item) => item.date === key) ?? emptyDay(key));
  }
  return out;
}
