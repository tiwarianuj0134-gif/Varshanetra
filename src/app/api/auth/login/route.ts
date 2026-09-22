import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User, UserSession, OtpStore } from "@/lib/models";
import { generateSessionToken, createSessionCookie, generateOTP } from "@/lib/auth";
import bcrypt from "bcryptjs";

async function createSessionResponse(user: any, rememberMe: boolean) {
  const sessionToken = generateSessionToken();

  await UserSession.create({
    sessionToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
  });

  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

  const response = NextResponse.json({
    success: true,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      userType: user.userType,
      role: user.role,
      stateName: user.stateName,
      districtName: user.districtName,
      language: user.language,
      isVerified: user.isVerified,
      avatarUrl: user.avatarUrl,
    },
  });

  response.headers.set("Set-Cookie", createSessionCookie(sessionToken, rememberMe));
  return response;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { identifier, password, rememberMe = false, otpMode = false } = await req.json();

    if (!identifier) {
      return NextResponse.json({ error: "Email or mobile is required" }, { status: 400 });
    }

    const clean = identifier.replace(/\D/g, "").slice(-10);
    const normalizedMobile = /^\d{10}$/.test(clean) ? `+91${clean}` : identifier;

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { mobile: normalizedMobile },
        { mobile: identifier },
      ],
    });

    if (!user) {
      const demoRoleMap = {
        "+919800000001": { userType: "public", role: "citizen", password: "Demo@1234", name: "Public Demo User", districtName: "Mumbai", stateName: "Maharashtra" },
        "+919800000002": { userType: "government", role: "district_officer", password: "Demo@1234", name: "Government Demo User", districtName: "Mumbai", stateName: "Maharashtra" },
        "+919800000003": { userType: "admin", role: "admin", password: "Admin@1234", name: "Admin Demo User", districtName: "New Delhi", stateName: "Delhi" },
        "+919800000004": { userType: "researcher", role: "scientist", password: "Demo@1234", name: "Researcher Demo User", districtName: "Bengaluru", stateName: "Karnataka" },
      } as const;

      const demoAccount = demoRoleMap[normalizedMobile as keyof typeof demoRoleMap];
      if (demoAccount) {
        const passwordHash = await bcrypt.hash(demoAccount.password, 10);
        const seedUser = await User.create({
          name: demoAccount.name,
          mobile: normalizedMobile,
          passwordHash,
          userType: demoAccount.userType,
          role: demoAccount.role,
          stateName: demoAccount.stateName,
          districtName: demoAccount.districtName,
          language: "English",
          isActive: true,
          isVerified: true,
          mobileVerified: true,
          verificationStatus: "approved",
          alertChannels: ["sms", "app"],
          alertLevels: ["RED", "ORANGE"],
          subscribedDistricts: [demoAccount.districtName],
        });

        const createdUser = await User.findById(seedUser._id);
        if (createdUser) {
          return await createSessionResponse(createdUser, rememberMe);
        }
      }

      return NextResponse.json({ error: "No account found with this email or mobile" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account deactivated. Contact support." }, { status: 403 });
    }

    // OTP (passwordless) mode
    if (otpMode) {
      const otp = generateOTP();
      await OtpStore.deleteMany({ mobile: user.mobile, purpose: "login" });
      await OtpStore.create({
        mobile: user.mobile, otp, purpose: "login",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });
      console.log(`[VARSHANETRA] Login OTP for ${user.mobile}: ${otp}`);
      const isDemoMode = process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true";
      return NextResponse.json({
        success: true,
        message: "OTP sent",
        mobile: user.mobile.replace(/(\+91)(\d{6})(\d{4})/, "$1XXXXXX$3"),
        ...(isDemoMode && { demoOtp: otp, demoNote: "OTP visible in demo mode only" }),
      });
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const valid = user.passwordHash && await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    if (user.userType === "government" && user.verificationStatus === "pending") {
      return NextResponse.json({
        error: "Your government account is pending verification.",
        verificationPending: true,
      }, { status: 403 });
    }

    return await createSessionResponse(user, rememberMe);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
