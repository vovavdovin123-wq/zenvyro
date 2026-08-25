import "../src/studio/loadEnv";
import { applyHumanAction, createOrder, getOrder, listOrders } from "../src/studio/orders";
import type { HumanAction, Order } from "../src/studio/types";
import { listUsage } from "../src/studio/usage";

const lead = [
  "Тип: лендинг на Next",
  "Цель: продавать зерно кофейни «Северная обжарка» подпиской на неделю",
  "Срок: 10 дней",
  "Бюджет: 45000",
  "Ориентиры: тёплый лендинг, 3 лота, форма заказа без оплаты",
].join("\n");

const PIPELINE: HumanAction[] = [
  "approve_reply",
  "confirm_price",
  "mark_prepayment",
  "approve_spec",
  "accept_stage",
  "accept_stage",
  "open_demo",
];

async function ignoreNotify<T>(label: string, fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/TELEGRAM|ORDER_BOT/i.test(message)) throw error;
    console.error(`${label}: ${message}`);
    return undefined;
  }
}

async function latest(): Promise<Order | undefined> {
  const orders = await listOrders();
  return orders.find((item) => item.client.name === "Северная обжарка") ?? orders[0];
}

async function main() {
  let order =
    (await latest()) ??
    (await ignoreNotify("create", () =>
      createOrder({
        source: "web",
        leadText: lead,
        client: {
          name: "Северная обжарка",
          email: "roast@example.test",
          phone: "+7 (999) 111-22-33",
          telegramUsername: "severnaya_obzharka",
        },
      }),
    )) ??
    (await latest());

  if (!order) throw new Error("Не удалось создать тестовый заказ");

  for (const action of PIPELINE) {
    order = (await getOrder(order.id)) ?? order;
    const extra = action === "open_demo" ? { demoUrl: "/demo" } : undefined;
    await ignoreNotify(action, () => applyHumanAction(order.id, action, extra));
    order = (await getOrder(order.id)) ?? order;
    console.error(`${action} → ${order.status}`);
    if (order.status === "closed") break;
  }

  const usage = await listUsage();
  process.stdout.write(
    JSON.stringify(
      {
        id: order.id,
        status: order.status,
        spec: order.spec,
        demo: "/demo",
        usage,
      },
      null,
      2,
    ) + "\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
