import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  WeatherStation, RainfallObservation, ActiveWarning,
  AIPrediction, FloodRiskZone, ModelMetric, User,
} from "@/lib/models";
import {
  INDIAN_DISTRICTS, generateRealisticRainfall,
  generateWarningLevel, getImpactSummary, MODEL_CONFIG, SHAP_FEATURES,
} from "@/lib/seed-data";
import bcrypt from "bcryptjs";

// Guard: allow GET for status check, POST to force re-seed
export async function GET() {
  try {
    await connectDB();
    const stationCount = await WeatherStation.countDocuments();
    const warningCount = await ActiveWarning.countDocuments({ isActive: true });
    const seeded = stationCount > 0;
    return NextResponse.json({ seeded, stationCount, warningCount });
  } catch (error) {
    return NextResponse.json({ seeded: false, error: String(error) });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ── Check if already seeded — only re-seed if forced ──
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    const stationCount = await WeatherStation.countDocuments();
    if (stationCount > 0 && !force) {
      return NextResponse.json({
        success: true,
        message: "Already seeded. Pass ?force=1 to re-seed.",
        alreadySeeded: true,
      });
    }

    const now = new Date();
    const month = now.getMonth() + 1;

    // ── Drop data collections (NOT users) ─────────────────
    await Promise.all([
      WeatherStation.deleteMany({}),
      RainfallObservation.deleteMany({}),
      ActiveWarning.deleteMany({}),
      AIPrediction.deleteMany({}),
      FloodRiskZone.deleteMany({}),
      ModelMetric.deleteMany({}),
    ]);

    // ── 0. Demo and admin accounts (idempotent) ───────────────────
    const demoAccounts = [
      {
        name: "Public Demo User",
        mobile: "+919800000001",
        password: "Demo@1234",
        userType: "public",
        role: "citizen",
        stateName: "Maharashtra",
        districtName: "Mumbai",
      },
      {
        name: "Government Demo User",
        mobile: "+919800000002",
        password: "Demo@1234",
        userType: "government",
        role: "district_officer",
        stateName: "Maharashtra",
        districtName: "Mumbai",
      },
      {
        name: "Admin Demo User",
        mobile: "+919800000003",
        password: "Admin@1234",
        userType: "admin",
        role: "admin",
        stateName: "Delhi",
        districtName: "New Delhi",
      },
      {
        name: "Researcher Demo User",
        mobile: "+919800000004",
        password: "Demo@1234",
        userType: "researcher",
        role: "scientist",
        stateName: "Karnataka",
        districtName: "Bengaluru",
      },
    ] as const;

    for (const account of demoAccounts) {
      const existing = await User.findOne({ mobile: account.mobile });
      const passwordHash = await bcrypt.hash(account.password, 10);

      if (existing) {
        await User.updateOne(
          { _id: existing._id },
          {
            $set: {
              name: account.name,
              passwordHash,
              userType: account.userType,
              role: account.role,
              stateName: account.stateName,
              districtName: account.districtName,
              isActive: true,
              isVerified: true,
              mobileVerified: true,
              verificationStatus: "approved",
              language: "English",
            },
          },
        );
      } else {
        await User.create({
          name: account.name,
          mobile: account.mobile,
          passwordHash,
          userType: account.userType,
          role: account.role,
          stateName: account.stateName,
          districtName: account.districtName,
          isActive: true,
          isVerified: true,
          mobileVerified: true,
          verificationStatus: "approved",
          language: "English",
          alertChannels: ["sms", "app"],
          alertLevels: ["RED", "ORANGE"],
          subscribedDistricts: [account.districtName],
        });
      }
    }

    const adminExists = await User.findOne({ userType: "admin" });
    if (!adminExists) {
      const adminHash = await bcrypt.hash("Admin@1234", 10);
      await User.create({
        name: "VARSHANETRA Admin",
        mobile: "+919999999999",
        passwordHash: adminHash,
        userType: "admin",
        role: "admin",
        stateName: "Delhi",
        districtName: "New Delhi",
        isActive: true,
        isVerified: true,
        mobileVerified: true,
        verificationStatus: "approved",
      });
    }

    // ── 1. Weather Stations ────────────────────────────────
    const stationDocs = INDIAN_DISTRICTS.map((d, i) => {
      const wl = generateWarningLevel(month, d.lat, d.lon);
      const r24 = generateRealisticRainfall(d.lat, d.lon, wl);
      return {
        stationId: `AWS-${d.code}`,
        stationName: `${d.name} AWS`,
        districtName: d.name, stateName: d.state,
        latitude: d.lat + (Math.random() - 0.5) * 0.05,
        longitude: d.lon + (Math.random() - 0.5) * 0.05,
        elevation: Math.round(Math.random() * 800 + 10),
        stationType: i % 3 === 0 ? "ARG" : "AWS",
        isActive: Math.random() > 0.05,
        lastReportedAt: new Date(now.getTime() - Math.random() * 1800000),
        currentRainfall: parseFloat((r24 / 24 + (Math.random() - 0.3) * 5).toFixed(2)),
        rainfall24h: parseFloat(r24.toFixed(1)),
        humidity: parseFloat((75 + Math.random() * 20).toFixed(1)),
        temperature: parseFloat((22 + Math.random() * 12).toFixed(1)),
      };
    });
    await WeatherStation.insertMany(stationDocs);

    // ── 2. Rainfall Observations ──────────────────────────
    const sources = ["fused","satellite","radar","station","nwp"] as const;
    const obsDocs: unknown[] = [];
    for (const d of INDIAN_DISTRICTS) {
      const wl = generateWarningLevel(month, d.lat, d.lon);
      for (const src of sources) {
        obsDocs.push({
          stationId: `AWS-${d.code}`, districtCode: d.code,
          districtName: d.name, stateName: d.state,
          latitude: d.lat, longitude: d.lon,
          rainfallMm: parseFloat(generateRealisticRainfall(d.lat, d.lon, wl).toFixed(1)),
          rainfallRate: parseFloat((Math.random() * 15 + 0.5).toFixed(2)),
          source: src,
          observedAt: new Date(now.getTime() - Math.random() * 900000),
        });
      }
    }
    await RainfallObservation.insertMany(obsDocs);

    // ── 3. Active Warnings ────────────────────────────────
    const warnDocs: unknown[] = [];
    for (const d of INDIAN_DISTRICTS) {
      const wl = generateWarningLevel(month, d.lat, d.lon);
      if (wl === "GREEN") continue;
      const mm = generateRealisticRainfall(d.lat, d.lon, wl);
      const impact = getImpactSummary(wl, d.pop);
      warnDocs.push({
        warningId: `WARN-${d.code}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
        districtCode: d.code, districtName: d.name, stateName: d.state,
        warningLevel: wl,
        expectedRainfallMm: mm,
        expectedRainfallMax: parseFloat((mm * 1.3).toFixed(1)),
        forecastHours: 24,
        populationAtRisk: impact.populationAtRisk,
        affectedAreaKm2: parseFloat((Math.random() * 500 + 50).toFixed(1)),
        impactSummary: impact, isActive: true,
        validFrom: now,
        validUntil: new Date(now.getTime() + 86400000),
        issuedAt: new Date(now.getTime() - Math.random() * 3600000),
      });
    }
    if (warnDocs.length) await ActiveWarning.insertMany(warnDocs);

    // ── 4. AI Predictions ─────────────────────────────────
    const horizons = [3, 6, 12, 24, 48, 72];
    const predDocs: unknown[] = [];
    for (const d of INDIAN_DISTRICTS.slice(0, 30)) {
      const wl = generateWarningLevel(month, d.lat, d.lon);
      for (const model of MODEL_CONFIG) {
        for (const h of horizons) {
          const base = generateRealisticRainfall(d.lat, d.lon, wl);
          const pred = base * (0.9 + Math.random() * 0.2);
          const unc = 1 + (h / 72) * 0.3;
          const conf = Math.max(0.5, model.accuracy / 100 - (h / 72) * 0.15);
          predDocs.push({
            districtCode: d.code, districtName: d.name, stateName: d.state,
            latitude: d.lat, longitude: d.lon,
            modelName: model.id, forecastHorizon: h,
            predictedRainfallMm: parseFloat(pred.toFixed(1)),
            confidenceScore: parseFloat(conf.toFixed(3)),
            uncertaintyLower: parseFloat((pred / unc).toFixed(1)),
            uncertaintyUpper: parseFloat((pred * unc).toFixed(1)),
            rainfallCategory: wl === "RED" ? "extremely_heavy" : wl === "ORANGE" ? "very_heavy" : "heavy",
            shapValues: SHAP_FEATURES,
            forecastValidAt: new Date(now.getTime() + h * 3600000),
          });
        }
      }
    }
    await AIPrediction.insertMany(predDocs);

    // ── 5. Flood Risk Zones ───────────────────────────────
    const zones: unknown[] = [];
    const riskAreas = [
      { suffix: "River Basin",      risk: "high",   depthM: 2.5, threshold: 120 },
      { suffix: "Low-lying Area",   risk: "high",   depthM: 1.8, threshold: 80  },
      { suffix: "Urban Zone",       risk: "medium", depthM: 0.8, threshold: 150 },
    ];
    for (const d of INDIAN_DISTRICTS.slice(0, 25)) {
      for (const ra of riskAreas) {
        zones.push({
          zoneName: `${d.name} ${ra.suffix}`,
          districtCode: d.code, districtName: d.name, stateName: d.state,
          latitude:  d.lat + (Math.random() - 0.5) * 0.2,
          longitude: d.lon + (Math.random() - 0.5) * 0.2,
          riskLevel: ra.risk,
          estimatedDepthM: ra.depthM + Math.random() * 0.5,
          affectedPopulation: Math.round(Math.random() * 50000 + 5000),
          rainfallThresholdMm: ra.threshold,
          riverProximityKm: parseFloat((Math.random() * 5 + 0.5).toFixed(1)),
          elevationM: parseFloat((Math.random() * 50 + 5).toFixed(1)),
          isCurrentlyFlooded: Math.random() < 0.2,
        });
      }
    }
    await FloodRiskZone.insertMany(zones);

    // ── 6. Model Performance Metrics ──────────────────────
    const metrics: unknown[] = [];
    for (const model of MODEL_CONFIG) {
      for (let i = 0; i < 7; i++) {
        metrics.push({
          modelName: model.id,
          metricDate: new Date(2026, i, 15),
          accuracy: parseFloat((model.accuracy * 0.88 + i * 1 + Math.random() * 2).toFixed(1)),
          rmse: parseFloat((8.5 - i * 0.6 + Math.random() * 0.5).toFixed(2)),
          csi: parseFloat((0.55 + i * 0.025 + Math.random() * 0.02).toFixed(3)),
          pod: parseFloat((0.72 + i * 0.02  + Math.random() * 0.02).toFixed(3)),
          far: parseFloat((0.28 - i * 0.02  + Math.random() * 0.02).toFixed(3)),
          correlation: parseFloat((0.78 + i * 0.02 + Math.random() * 0.01).toFixed(3)),
          totalPredictions: 1000 + i * 500,
        });
      }
    }
    await ModelMetric.insertMany(metrics);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      counts: {
        stations: stationDocs.length,
        observations: obsDocs.length,
        warnings: warnDocs.length,
        predictions: predDocs.length,
        floodZones: zones.length,
        metrics: metrics.length,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
