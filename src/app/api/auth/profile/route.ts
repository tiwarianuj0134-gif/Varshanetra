import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User, UserSession } from "@/lib/models";
import { getSessionFromCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

async function getAuthUser(req: NextRequest) {
  const token = getSessionFromCookie(req.headers.get("cookie"));
  if (!token) return null;
  await connectDB();
  const session = await UserSession.findOne({ sessionToken: token, expiresAt: { $gt: new Date() } });
  if (!session) return null;
  return await User.findById(session.userId);
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, email, stateName, districtName, language,
      alertChannels, alertLevels, subscribedDistricts,
      newPassword, currentPassword } = body;

    const update: Record<string, unknown> = {};
    if (name) update.name = name;
    if (email !== undefined) update.email = email || undefined;
    if (stateName !== undefined) update.stateName = stateName || undefined;
    if (districtName !== undefined) update.districtName = districtName || undefined;
    if (language) update.language = language;
    if (alertChannels) update.alertChannels = alertChannels;
    if (alertLevels) update.alertLevels = alertLevels;
    if (subscribedDistricts !== undefined) update.subscribedDistricts = subscribedDistricts;

    if (newPassword && currentPassword) {
      const valid = user.passwordHash && await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });
      update.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await User.updateOne({ _id: user._id }, update);
    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
