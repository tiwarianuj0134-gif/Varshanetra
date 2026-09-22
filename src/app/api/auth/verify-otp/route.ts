import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User, OtpStore, UserSession, Notification } from "@/lib/models";
import { generateSessionToken, createSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { mobile, otp, purpose = "register" } = await req.json();

    if (!mobile || !otp) {
      return NextResponse.json({ error: "Mobile and OTP required" }, { status: 400 });
    }

    const clean = mobile.replace(/\D/g, "").slice(-10);
    const normalizedMobile = `+91${clean}`;

    const record = await OtpStore.findOne({
      mobile: normalizedMobile,
      purpose,
      isUsed: false,
    });

    if (!record) {
      return NextResponse.json({ error: "OTP not found or already used. Request a new one." }, { status: 400 });
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
    }

    if ((record.attempts || 0) >= 3) {
      return NextResponse.json({ error: "Too many failed attempts. Request a new OTP." }, { status: 400 });
    }

    if (record.otp !== otp) {
      await OtpStore.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 });
    }

    await OtpStore.updateOne({ _id: record._id }, { isUsed: true });

    let userDoc: InstanceType<typeof User> | null = null;

    if (purpose === "register") {
      const td = record.tempData as Record<string, unknown>;
      userDoc = await User.create({
        name: td.name,
        email: td.email || undefined,
        mobile: normalizedMobile,
        passwordHash: td.passwordHash,
        userType: td.userType || "public",
        role: td.userType === "admin" ? "admin" : "user",
        stateName: td.stateName || undefined,
        districtName: td.districtName || undefined,
        language: td.language || "English",
        alertChannels: td.alertChannels || ["sms"],
        alertLevels: td.alertLevels || ["RED","ORANGE"],
        employeeCode: td.employeeCode || undefined,
        department: td.department || undefined,
        designation: td.designation || undefined,
        institution: td.institution || undefined,
        researchField: td.researchField || undefined,
        mobileVerified: true,
        isVerified: td.userType === "public",
        verificationStatus: td.userType === "public" ? "approved" : "pending",
      });

      await Notification.create({
        userId: userDoc._id,
        type: "system",
        title: "Welcome to VARSHANETRA! 🌧️",
        message: `Welcome ${td.name as string}! Your account is ready. Stay safe with AI-powered flood warnings.`,
        severity: "success",
      });
    } else if (purpose === "login") {
      userDoc = await User.findOne({ mobile: normalizedMobile });
      if (!userDoc) return NextResponse.json({ error: "User not found" }, { status: 404 });
    } else {
      return NextResponse.json({ success: true, message: "OTP verified" });
    }

    const sessionToken = generateSessionToken();
    await UserSession.create({
      sessionToken,
      userId: userDoc._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await User.updateOne({ _id: userDoc._id }, { lastLoginAt: new Date() });

    const response = NextResponse.json({
      success: true,
      message: purpose === "register" ? "Account created!" : "Login successful!",
      user: {
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        mobile: userDoc.mobile,
        userType: userDoc.userType,
        role: userDoc.role,
        stateName: userDoc.stateName,
        districtName: userDoc.districtName,
        language: userDoc.language,
        isVerified: userDoc.isVerified,
        avatarUrl: userDoc.avatarUrl,
      },
    });

    response.headers.set("Set-Cookie", createSessionCookie(sessionToken));
    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
