import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pin = body.pin;
    const correctPin = process.env.ACCESS_PIN || "USICK2026";

    if (!pin || String(pin).trim() !== String(correctPin).trim()) {
      return NextResponse.json(
        {
          valid: false,
          error: "Kode PIN Verifikasi salah. Harap masukkan PIN akses yang benar untuk mendaftar.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json(
      { valid: false, error: "Terjadi kesalahan saat memverifikasi PIN." },
      { status: 500 }
    );
  }
}
