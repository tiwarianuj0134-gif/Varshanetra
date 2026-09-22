import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User, UserSession } from "@/lib/models";
import { getSessionFromCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getSessionFromCookie(req.headers.get("cookie"));
    if (!token) return NextResponse.json({ user: null }, { status: 401 });

    await connectDB();

    const session = await UserSession.findOne({
      sessionToken: token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) return NextResponse.json({ user: null }, { status: 401 });

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) return NextResponse.json({ user: null }, { status: 401 });

    return NextResponse.json({
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
        alertChannels: user.alertChannels,
        alertLevels: user.alertLevels,
        subscribedDistricts: user.subscribedDistricts,
        verificationStatus: user.verificationStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
