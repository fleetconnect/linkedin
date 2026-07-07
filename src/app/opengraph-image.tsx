import { ImageResponse } from "next/og";
import { site } from "@/lib/content";

export const alt = `${site.name} — AI-Powered Construction & Renovation Estimates`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(circle at 20% 20%, #111830 0%, #05070d 55%)",
          color: "#f5f7fb",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #38bdf8, #6366f1)",
              color: "#05070d",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            A
          </div>
          {site.name}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 980,
          }}
        >
          Turn blueprints into bulletproof estimates in minutes
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 28,
            color: "#93a0bd",
            maxWidth: 860,
          }}
        >
          AI-powered construction & renovation estimating for contractors and remodelers.
        </div>
      </div>
    ),
    { ...size },
  );
}
