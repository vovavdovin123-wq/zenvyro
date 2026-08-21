import "../loadEnv";
import { getOrder } from "../store";
import { notifyAdmins, sendTelegram } from "../telegram";
import { templates, replyApprovalMarkup } from "../templates";
import { telegram } from "../config";

async function main() {
  if (!telegram.token || telegram.adminChatIds.length === 0) {
    console.error("Нет TELEGRAM_BOT_TOKEN или TELEGRAM_ADMIN_CHAT_IDS");
    process.exit(1);
  }

  const ping = await Promise.all(
    telegram.adminChatIds.map((chatId) =>
      sendTelegram(chatId, "Тест Zenvyro: заявка с сайта теперь приходит в этот чат, VPN не нужен."),
    ),
  );
  if (!ping.every(Boolean)) {
    console.error(`ping fail via ${telegram.apiRoot}`);
    process.exit(1);
  }

  const order = await getOrder("1ec7dbde");
  if (order) {
    const sent = await notifyAdmins(templates.adminReview(order), replyApprovalMarkup(order.id));
    if (!sent) {
      console.error("order card fail");
      process.exit(1);
    }
  }

  console.log(`ok via ${telegram.apiRoot}`);
}

void main();
