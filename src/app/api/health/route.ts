import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ ok: true, db: "mongodb" });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
