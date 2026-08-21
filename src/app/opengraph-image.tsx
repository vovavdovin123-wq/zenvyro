import { ImageResponse } from "next/og";

export const alt = "Zenvyro — веб-студия";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
        <div
          style={{
            display: "flex",
            width: 96,
            height: 96,
            borderRadius: 28,
            background: "linear-gradient(135deg, #A855F7 0%, #FF9FFC 100%)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              border: "6px solid #FFFFFF",
              borderRightColor: "transparent",
              borderBottomColor: "transparent",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: 6 }}>ZENVYRO</div>
          <div style={{ marginTop: 12, fontSize: 28, color: "#B19EEF" }}>Сайты с характером. Сервисы без лишнего.</div>
        </div>
      </div>
    ),
    size,
  );
}
