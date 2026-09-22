import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User, OtpStore } from "@/lib/models";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { mobile, otp, newPassword } = await req.json();
    if (!mobile || !otp || !newPassword) {
      return NextResponse.json({ error: "Mobile, OTP and new password required" }, { status: 400 });
    }

    const clean = mobile.replace(/\D/g, "").slice(-10);
    const normalizedMobile = `+91${clean}`;

    const record = await OtpStore.findOne({
      mobile: normalizedMobile,
      purpose: "forgot",
      createdAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) },
    }).sort({ createdAt: -1 });

    if (!record) return NextResponse.json({ error: "OTP expired or not found. Please request a new OTP." }, { status: 400 });
    if (record.otp !== otp) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });

    await OtpStore.updateOne({ _id: record._id }, { isUsed: true });
    const hash = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ mobile: normalizedMobile }, { passwordHash: hash });

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
