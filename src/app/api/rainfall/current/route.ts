import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { RainfallObservation, ActiveWarning } from "@/lib/models";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") || "fused";

  try {
    await connectDB();

    const observations = await RainfallObservation.find({ source })
      .sort({ rainfallMm: -1 })
      .limit(100)
      .lean();

    // Build warning map
    const warnings = await ActiveWarning.find({ isActive: true })
      .select("districtCode warningLevel")
      .lean();

    const warningMap: Record<string, string> = {};
    for (const w of warnings) warningMap[w.districtCode] = w.warningLevel;

    const enhanced = observations.map(obs => ({
      ...obs,
      warningLevel: warningMap[obs.districtCode || ""] || "GREEN",
    }));

    return NextResponse.json({
      data: enhanced,
      source,
      total: enhanced.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
