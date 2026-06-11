import { ImageResponse } from "next/og";

export const runtime = "edge";

// OG image (1200×630) do curso Lakehouse, gerada no edge.
// Referenciada pelo og:image da landing estática /lakehouse-comunidade/.
const STACK = ["MinIO", "Iceberg", "Spark", "Airflow", "Superset"];

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(ellipse at top left, #14b7de40 0%, transparent 50%), radial-gradient(ellipse at bottom right, #14b7de30 0%, transparent 60%), linear-gradient(135deg, #06101c 0%, #0a1422 100%)",
          padding: "80px",
          color: "#e6f1ff",
          fontFamily: "system-ui",
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(230,241,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(230,241,255,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top: AZURIS wordmark + badge da turma */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #14b7de 0%, #0891b2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "44px",
                fontWeight: 800,
                color: "#06101c",
              }}
            >
              A
            </div>
            <div
              style={{
                fontSize: "40px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "#14b7de",
              }}
            >
              AZURIS
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "24px",
              fontWeight: 600,
              color: "#67e8f9",
              border: "1px solid #14b7de66",
              borderRadius: "999px",
              padding: "10px 24px",
              background: "#14b7de14",
            }}
          >
            Turma 1 · 22/06/2026
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: "76px",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            zIndex: 1,
            maxWidth: "1000px",
          }}
        >
          Lakehouse:{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #14b7de 0%, #67e8f9 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            &nbsp;Pipeline na Prática
          </span>
        </div>

        {/* Subline */}
        <div
          style={{
            marginTop: "28px",
            fontSize: "28px",
            color: "rgba(230,241,255,0.72)",
            fontWeight: 400,
            zIndex: 1,
            maxWidth: "920px",
          }}
        >
          Curso online ao vivo · do zero ao dashboard em 5 semanas
        </div>

        {/* Stack chips */}
        <div style={{ display: "flex", gap: "14px", marginTop: "36px", zIndex: 1 }}>
          {STACK.map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                fontSize: "22px",
                fontWeight: 600,
                color: "#cbe9f5",
                border: "1px solid #1f4a63",
                borderRadius: "12px",
                padding: "10px 18px",
                background: "#0a1c2a",
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Footer URL */}
        <div
          style={{
            marginTop: "44px",
            fontSize: "22px",
            color: "#14b7de",
            fontFamily: "monospace",
            zIndex: 1,
          }}
        >
          azuris.com.br/lakehouse-comunidade
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
