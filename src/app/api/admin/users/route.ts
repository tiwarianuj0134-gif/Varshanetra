import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const userType = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const limit = parseInt(searchParams.get("limit") || "100");

    const query: Record<string, unknown> = {};
    if (userType && userType !== "all") query.userType = userType;
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (status === "pending") query.verificationStatus = "pending";

    let usersRaw = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("-passwordHash")
      .lean();

    let users = usersRaw.map(u => ({
      ...u,
      id: u._id.toString(),
    }));

    if (search) {
      const s = search.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(s) ||
        u.mobile.includes(s) ||
        (u.email?.toLowerCase().includes(s) ?? false)
      );
    }

    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { userId, action } = await req.json();
    if (!userId || !action) return NextResponse.json({ error: "userId and action required" }, { status: 400 });

    const update: Record<string, unknown> = {};
    switch (action) {
      case "activate":   update.isActive = true; break;
      case "deactivate": update.isActive = false; break;
      case "approve":    update.isVerified = true; update.verificationStatus = "approved"; break;
      case "reject":     update.verificationStatus = "rejected"; update.isActive = false; break;
      case "makeAdmin":  update.userType = "admin"; update.role = "admin"; break;
      default: return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await User.updateOne({ _id: userId }, update);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
