import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User, OtpStore } from "@/lib/models";
import { generateOTP } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { identifier, mobile } = await req.json();
    const id = identifier || mobile;
    if (!id) return NextResponse.json({ error: "Email or mobile required" }, { status: 400 });

    const clean = id.replace(/\D/g, "").slice(-10);
    const normalizedMobile = /^\d{10}$/.test(clean) ? `+91${clean}` : id;

    const user = await User.findOne({
      $or: [{ email: id }, { mobile: normalizedMobile }, { mobile: id }],
    });

    // Don't reveal if user exists
    if (!user) {
      return NextResponse.json({ success: true, message: "If registered, you will receive an OTP" });
    }

    const otp = generateOTP();
    await OtpStore.deleteMany({ mobile: user.mobile, purpose: "forgot" });
    await OtpStore.create({
      mobile: user.mobile, otp, purpose: "forgot",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`[VARSHANETRA] Reset OTP for ${user.mobile}: ${otp}`);
    return NextResponse.json({
      success: true,
      message: "OTP sent to your registered mobile",
      mobile: user.mobile.replace(/(\+91)(\d{6})(\d{4})/, "$1XXXXXX$3"),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
