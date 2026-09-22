import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ActiveWarning } from "@/lib/models";

// Severity order for client-side sort
const LEVEL_ORDER: Record<string, number> = { RED: 3, ORANGE: 2, YELLOW: 1, GREEN: 0 };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state   = searchParams.get("state");
  const level   = searchParams.get("level");
  const limit   = parseInt(searchParams.get("limit") || "50");

  try {
    await connectDB();

    const query: Record<string, unknown> = { isActive: true };
    if (state) query.stateName   = state;
    if (level) query.warningLevel = level;

    const warnings = await ActiveWarning.find(query)
      .limit(limit)
      .lean();

    // Single sort by severity desc, then rainfall desc
    warnings.sort((a, b) => {
      const lvlDiff = (LEVEL_ORDER[b.warningLevel] || 0) - (LEVEL_ORDER[a.warningLevel] || 0);
      if (lvlDiff !== 0) return lvlDiff;
      return (b.expectedRainfallMm || 0) - (a.expectedRainfallMm || 0);
    });

    return NextResponse.json({
      warnings,
      total: warnings.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
