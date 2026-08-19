import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Database, Order } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "db.json");

let queue: Promise<unknown> = Promise.resolve();

function lock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readDb(): Promise<Database> {
  try {
    const raw = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Database;
    return { orders: parsed.orders ?? [] };
  } catch {
    return { orders: [] };
  }
}

async function writeDb(db: Database): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
}

export async function listOrders(): Promise<Order[]> {
  const db = await lock(readDb);
  return [...db.orders].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const db = await lock(readDb);
  return db.orders.find((order) => order.id === id);
}

export async function upsertOrder(order: Order): Promise<Order> {
  return lock(async () => {
    const db = await readDb();
    const index = db.orders.findIndex((item) => item.id === order.id);
    if (index >= 0) db.orders[index] = order;
    else db.orders.unshift(order);
    await writeDb(db);
    return order;
  });
}

export async function findOrderByTelegram(telegramId: number): Promise<Order | undefined> {
  const orders = await listOrders();
  return orders.find(
    (order) =>
      order.client.telegramId === telegramId &&
      order.status !== "closed" &&
      order.status !== "rejected" &&
      order.status !== "skipped" &&
      order.status !== "kp_archived" &&
      order.status !== "paused",
  );
}
