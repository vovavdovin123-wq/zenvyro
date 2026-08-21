import { ImageResponse } from "next/og";
import { getWork } from "@/content/works";

export const alt = "Кейс Zenvyro";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = getWork(slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#0B0A10",
          color: "#F2F1F7",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 4, color: "#B19EEF", textTransform: "uppercase" }}>Zenvyro · кейс</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: 700 }}>{work?.title ?? "Кейс"}</div>
          <div style={{ marginTop: 18, fontSize: 28, color: "#8A8A94", maxWidth: 900 }}>
            {work?.summary ?? "Сайты, сервисы и Telegram-продукты."}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
