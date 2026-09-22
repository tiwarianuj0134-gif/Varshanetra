import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User, OtpStore } from "@/lib/models";
import { generateOTP } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      name, email, mobile, password, userType = "public",
      stateName, districtName, language = "English",
      alertChannels, alertLevels,
      employeeCode, department, designation,
      institution, researchField,
    } = body;

    if (!name || !mobile || !password) {
      return NextResponse.json({ error: "Name, mobile and password are required" }, { status: 400 });
    }

    const clean = mobile.replace(/\D/g, "").slice(-10);
    const normalizedMobile = `+91${clean}`;

    const existing = await User.findOne({ mobile: normalizedMobile });
    if (existing) {
      return NextResponse.json({ error: "Mobile number already registered" }, { status: 409 });
    }

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 10);

    const otp = generateOTP();

    await OtpStore.deleteMany({ mobile: normalizedMobile, purpose: "register" });
    await OtpStore.create({
      mobile: normalizedMobile,
      email: email || undefined,
      otp,
      purpose: "register",
      tempData: {
        name, email, mobile: normalizedMobile, passwordHash, userType,
        stateName, districtName, language,
        alertChannels: alertChannels || ["sms"],
        alertLevels: alertLevels || ["RED","ORANGE"],
        employeeCode, department, designation,
        institution, researchField,
      },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`[VARSHANETRA] OTP for ${normalizedMobile}: ${otp}`);

    // In development / demo mode: include OTP in response so UI can show it
    const isDemoMode = process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true";

    return NextResponse.json({
      success: true,
      message: "OTP sent to your mobile number",
      mobile: normalizedMobile.replace(/(\+91)(\d{6})(\d{4})/, "$1XXXXXX$3"),
      // Demo mode: show OTP so users can verify without SMS
      ...(isDemoMode && { demoOtp: otp, demoNote: "OTP visible in demo mode only" }),
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
