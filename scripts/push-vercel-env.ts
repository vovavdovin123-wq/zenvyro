import { spawn } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local" });

const names = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_ADMIN_CHAT_IDS", "STUDIO_PASSWORD"];

function addEnv(name: string) {
  const value = process.env[name] ?? "";
  if (!value) {
    throw new Error(`missing ${name}`);
  }
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      "npx",
      ["vercel", "env", "add", name, "production", "--yes", "--sensitive", "--force"],
      { stdio: ["pipe", "inherit", "inherit"], shell: true },
    );
    child.stdin.write(value);
    child.stdin.end();
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${name} exit ${code}`));
    });
  });
}

async function main() {
  for (const name of names) {
    await addEnv(name);
    console.log(`ok ${name}`);
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
