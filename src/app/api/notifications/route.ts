import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Notification, UserSession } from "@/lib/models";
import { getSessionFromCookie } from "@/lib/auth";
import mongoose from "mongoose";

async function getAuthUserId(req: NextRequest): Promise<mongoose.Types.ObjectId | null> {
  const token = getSessionFromCookie(req.headers.get("cookie"));
  if (!token) return null;
  await connectDB();
  const session = await UserSession.findOne({ sessionToken: token, expiresAt: { $gt: new Date() } });
  return session?.userId || null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ notifications: [], unreadCount: 0 });

    const notifs = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = notifs.filter(n => !n.isRead).length;
    return NextResponse.json({ notifications: notifs, unreadCount });
  } catch (error) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { markAllRead, notificationId } = await req.json();

    if (markAllRead) {
      await Notification.updateMany({ userId }, { isRead: true });
    } else if (notificationId) {
      await Notification.updateOne({ _id: notificationId, userId }, { isRead: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
