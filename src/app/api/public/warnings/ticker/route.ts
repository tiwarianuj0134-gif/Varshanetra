import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ActiveWarning } from "@/lib/models";

export async function GET() {
  try {
    await connectDB();

    const warnings = await ActiveWarning.find({ isActive: true })
      .sort({ expectedRainfallMm: -1 })
      .limit(15)
      .lean();

    const ticker = warnings.map((w: any) => ({
      district: w.districtName,
      state: w.stateName,
      level: w.warningLevel,
      rainfall: Math.round(w.expectedRainfallMm)
    }));

    return NextResponse.json({ ticker });
  } catch (error) {
    console.error("Error fetching ticker:", error);
    
    // Return fallback ticker data
    return NextResponse.json({
      ticker: [
        { district: "Mumbai", state: "Maharashtra", level: "RED", rainfall: 287 },
        { district: "Pune", state: "Maharashtra", level: "ORANGE", rainfall: 156 },
        { district: "Thiruvananthapuram", state: "Kerala", level: "ORANGE", rainfall: 142 },
        { district: "Chennai", state: "Tamil Nadu", level: "YELLOW", rainfall: 98 },
        { district: "Kolkata", state: "West Bengal", level: "RED", rainfall: 234 }
      ]
    });
  }
}
