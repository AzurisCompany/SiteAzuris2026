import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Azuris — Engenharia de Dados, Lakehouse, ClickHouse e IA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
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

        {/* Top: AZURIS wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              background:
                "linear-gradient(135deg, #14b7de 0%, #0891b2 100%)",
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
              fontSize: "44px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "#14b7de",
            }}
          >
            AZURIS
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Headline */}
        <div
          style={{
            fontSize: "68px",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            zIndex: 1,
            maxWidth: "900px",
          }}
        >
          Engenharia de Dados,
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #14b7de 0%, #67e8f9 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Lakehouse e IA
          </span>{" "}
          em produção.
        </div>

        {/* Subline */}
        <div
          style={{
            marginTop: "32px",
            fontSize: "26px",
            color: "rgba(230,241,255,0.7)",
            fontWeight: 400,
            zIndex: 1,
            maxWidth: "900px",
          }}
        >
          Data Lake · ClickHouse · Migração de Dados · Redução de Custo · Workshop de IA
        </div>

        {/* Footer URL */}
        <div
          style={{
            marginTop: "48px",
            fontSize: "22px",
            color: "#14b7de",
            fontFamily: "monospace",
            zIndex: 1,
          }}
        >
          azuris.com.br
        </div>
      </div>
    ),
    { ...size },
  );
}
