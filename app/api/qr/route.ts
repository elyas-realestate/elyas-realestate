import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

// ══════════════════════════════════════════════════════════════
// /api/qr — توليد QR Code للروابط
// GET ?text=<text>&color=<hex>&bg=<hex>&size=<n>&format=png|svg
// ══════════════════════════════════════════════════════════════

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const text = url.searchParams.get("text");
  if (!text) return new NextResponse("text param required", { status: 400 });

  const color = url.searchParams.get("color") || "#1A1206";
  const bg = url.searchParams.get("bg") || "#FFFFFF";
  const sizeParam = parseInt(url.searchParams.get("size") || "512", 10);
  const size = Math.max(128, Math.min(2048, sizeParam));
  const format = url.searchParams.get("format") === "svg" ? "svg" : "png";

  try {
    if (format === "svg") {
      const svg = await QRCode.toString(text, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 2,
        color: { dark: color, light: bg },
        width: size,
      });
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    const buffer = await QRCode.toBuffer(text, {
      type: "png",
      errorCorrectionLevel: "H",
      margin: 2,
      color: { dark: color, light: bg },
      width: size,
    });

    // تحويل Buffer (Node) إلى Uint8Array (Web Standard متوافق مع BodyInit)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("[qr] error:", e);
    return new NextResponse("Failed to generate QR", { status: 500 });
  }
}
