import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AlertSubscription } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const phoneNumber = body.phoneNumber || body.phone || body.mobile;
    const districts = body.districts || body.subscribedDistricts;
    const { email, name, alertLevels, channels, language } = body;

    if (!phoneNumber || !districts?.length) {
      return NextResponse.json({ error: "Phone and at least one district required" }, { status: 400 });
    }

    const result = await AlertSubscription.findOneAndUpdate(
      { phoneNumber },
      {
        phoneNumber, email: email || undefined, name: name || undefined,
        districts, alertLevels: alertLevels || ["RED","ORANGE"],
        channels: channels || ["sms"],
        language: language || "English",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
    return NextResponse.json({
      success: true,
      message: isNew ? "Subscribed successfully" : "Subscription updated",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
