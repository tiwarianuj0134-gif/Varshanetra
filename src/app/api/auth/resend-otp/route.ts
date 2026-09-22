import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { OtpStore } from "@/lib/models";
import { generateOTP } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { mobile, purpose = "register" } = await req.json();
    const clean = mobile.replace(/\D/g, "").slice(-10);
    const normalizedMobile = `+91${clean}`;

    const prev = await OtpStore.findOne({ mobile: normalizedMobile, purpose });
    const otp = generateOTP();

    await OtpStore.deleteMany({ mobile: normalizedMobile, purpose });
    await OtpStore.create({
      mobile: normalizedMobile, otp, purpose,
      tempData: prev?.tempData || undefined,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`[VARSHANETRA] Resent OTP for ${normalizedMobile}: ${otp}`);
    return NextResponse.json({ success: true, message: "OTP resent" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
