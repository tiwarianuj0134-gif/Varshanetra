import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { CommunityReport } from "@/lib/models";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    await connectDB();
    const reports = await CommunityReport.find({})
      .sort({ reportedAt: -1 })
      .limit(limit)
      .lean();
    return NextResponse.json({ reports, total: reports.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const reporterName = body.reporterName?.trim() || "Local Citizen";
    const reportType = body.reportType || "waterlogging";
    const severity = body.severity || "moderate";
    const locationName = body.locationName?.trim() || body.districtName || "Reported Location";
    const latitude = parseFloat(body.latitude) || 19.0760;
    const longitude = parseFloat(body.longitude) || 72.8777;
    const {
      reporterPhone, districtName, stateName, description, waterDepthCm
    } = body;

    const report = await CommunityReport.create({
      reporterName,
      reporterPhone: reporterPhone || undefined,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      locationName,
      districtName: districtName || undefined,
      stateName: stateName || undefined,
      reportType,
      description: description || undefined,
      waterDepthCm: waterDepthCm ? parseFloat(waterDepthCm) : undefined,
      severity,
      isVerified: false,
      upvotes: 0,
      reportedAt: new Date(),
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
