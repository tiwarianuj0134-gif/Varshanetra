import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { UserSession } from "@/lib/models";
import { getSessionFromCookie, clearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionFromCookie(req.headers.get("cookie"));
    if (token) {
      await connectDB();
      await UserSession.deleteOne({ sessionToken: token });
    }
    const response = NextResponse.json({ success: true });
    response.headers.set("Set-Cookie", clearSessionCookie());
    return response;
  } catch {
    const response = NextResponse.json({ success: true });
    response.headers.set("Set-Cookie", clearSessionCookie());
    return response;
  }
}
