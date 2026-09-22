import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ActiveWarning, AIPrediction, RainfallObservation, FloodRiskZone, WeatherStation } from "@/lib/models";
import { generateForecastTimeSeries, getRainfallCategory } from "@/lib/utils";
import { SHAP_FEATURES } from "@/lib/seed-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    await connectDB();

    const [warning, current, riskZones] = await Promise.all([
      ActiveWarning.findOne({ districtCode: code, isActive: true }).lean(),
      RainfallObservation.findOne({ districtCode: code, source: "fused" })
        .sort({ observedAt: -1 }).lean(),
      FloodRiskZone.find({ districtCode: code }).limit(5).lean(),
    ]);

    const predictions = await AIPrediction.find({ districtCode: code, modelName: "ensemble" })
      .sort({ forecastHorizon: 1 }).limit(10).lean();

    const modelComparison = await AIPrediction.find({ districtCode: code, forecastHorizon: 24 })
      .sort({ modelName: 1 }).lean();

    const station = warning
      ? await WeatherStation.findOne({ districtName: warning.districtName }).lean()
      : null;

    const forecastSeries = generateForecastTimeSeries(current?.rainfallMm || 50, 72);

    const dataWeights = { satellite: 0.15, radar: 0.30, station: 0.25, nwp: 0.30 };

    return NextResponse.json({
      district: {
        code,
        name:  warning?.districtName || current?.districtName || code,
        state: warning?.stateName  || current?.stateName  || "",
        lat: current?.latitude  || 0,
        lon: current?.longitude || 0,
      },
      warning: warning || null,
      current: {
        rainfallMm:  current?.rainfallMm  || 0,
        rainfallRate: current?.rainfallRate || 0,
        humidity:    station?.humidity    || 82,
        temperature: station?.temperature || 26,
        rainfall24h: station?.rainfall24h || current?.rainfallMm || 0,
        category: getRainfallCategory(current?.rainfallMm || 0),
      },
      predictions,
      modelComparison,
      forecastSeries,
      riskZones,
      dataWeights,
      shapValues: SHAP_FEATURES,
      impact: (warning?.impactSummary as Record<string, unknown>) || {},
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("District route error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
