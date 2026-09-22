import mongoose, { Schema, Document, Model } from "mongoose";

// ─── USER ────────────────────────────────────────────────
export interface IUser extends Document {
  name: string;
  email?: string;
  mobile: string;
  passwordHash?: string;
  userType: "public" | "government" | "researcher" | "admin";
  role: string;
  stateName?: string;
  districtName?: string;
  language: string;
  avatarUrl?: string;
  employeeCode?: string;
  department?: string;
  designation?: string;
  institution?: string;
  researchField?: string;
  isActive: boolean;
  isVerified: boolean;
  mobileVerified: boolean;
  verificationStatus: "pending" | "approved" | "rejected";
  alertChannels: string[];
  alertLevels: string[];
  subscribedDistricts: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, sparse: true },
  mobile: { type: String, required: true, unique: true },
  passwordHash: String,
  userType: { type: String, enum: ["public","government","researcher","admin"], default: "public" },
  role: { type: String, default: "user" },
  stateName: String,
  districtName: String,
  language: { type: String, default: "English" },
  avatarUrl: String,
  employeeCode: String,
  department: String,
  designation: String,
  institution: String,
  researchField: String,
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  mobileVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  alertChannels: { type: [String], default: ["sms"] },
  alertLevels: { type: [String], default: ["RED","ORANGE"] },
  subscribedDistricts: { type: [String], default: [] },
  lastLoginAt: Date,
}, { timestamps: true });

// ─── OTP STORE ───────────────────────────────────────────
export interface IOtp extends Document {
  mobile: string;
  email?: string;
  otp: string;
  purpose: "register" | "login" | "forgot";
  tempData?: Record<string, unknown>;
  attempts: number;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  mobile: { type: String, required: true },
  email: String,
  otp: { type: String, required: true },
  purpose: { type: String, enum: ["register","login","forgot"], required: true },
  tempData: Schema.Types.Mixed,
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
}, { timestamps: true });

OtpSchema.index({ mobile: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ─── USER SESSION ─────────────────────────────────────────
export interface ISession extends Document {
  sessionToken: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  sessionToken: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── NOTIFICATION ─────────────────────────────────────────
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  severity: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, default: "info" },
  relatedId: String,
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, isRead: 1 });

// ─── RAINFALL OBSERVATION ────────────────────────────────
export interface IRainfallObservation extends Document {
  stationId?: string;
  districtCode?: string;
  districtName?: string;
  stateName?: string;
  latitude: number;
  longitude: number;
  rainfallMm: number;
  rainfallRate?: number;
  source: string;
  observedAt: Date;
  createdAt: Date;
}

const RainfallSchema = new Schema<IRainfallObservation>({
  stationId: String,
  districtCode: String,
  districtName: String,
  stateName: String,
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  rainfallMm: { type: Number, required: true },
  rainfallRate: Number,
  source: { type: String, required: true },
  observedAt: { type: Date, default: Date.now },
}, { timestamps: true });

RainfallSchema.index({ source: 1 });
RainfallSchema.index({ districtCode: 1 });
RainfallSchema.index({ observedAt: -1 });

// ─── AI PREDICTION ───────────────────────────────────────
export interface IAIPrediction extends Document {
  districtCode: string;
  districtName: string;
  stateName: string;
  latitude: number;
  longitude: number;
  modelName: string;
  forecastHorizon: number;
  predictedRainfallMm: number;
  confidenceScore: number;
  uncertaintyLower?: number;
  uncertaintyUpper?: number;
  rainfallCategory?: string;
  shapValues?: unknown[];
  forecastValidAt: Date;
  createdAt: Date;
}

const AIPredictionSchema = new Schema<IAIPrediction>({
  districtCode: { type: String, required: true },
  districtName: { type: String, required: true },
  stateName: { type: String, required: true },
  latitude: Number,
  longitude: Number,
  modelName: { type: String, required: true },
  forecastHorizon: { type: Number, required: true },
  predictedRainfallMm: { type: Number, required: true },
  confidenceScore: { type: Number, required: true },
  uncertaintyLower: Number,
  uncertaintyUpper: Number,
  rainfallCategory: String,
  shapValues: [Schema.Types.Mixed],
  forecastValidAt: Date,
}, { timestamps: true });

AIPredictionSchema.index({ districtCode: 1 });
AIPredictionSchema.index({ modelName: 1 });

// ─── ACTIVE WARNING ──────────────────────────────────────
export interface IActiveWarning extends Document {
  warningId: string;
  districtCode: string;
  districtName: string;
  stateName: string;
  warningLevel: "RED" | "ORANGE" | "YELLOW" | "GREEN";
  expectedRainfallMm: number;
  expectedRainfallMax?: number;
  forecastHours: number;
  populationAtRisk?: number;
  affectedAreaKm2?: number;
  impactSummary?: Record<string, unknown>;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  issuedAt: Date;
  updatedAt: Date;
}

const WarningSchema = new Schema<IActiveWarning>({
  warningId: { type: String, required: true, unique: true },
  districtCode: { type: String, required: true },
  districtName: { type: String, required: true },
  stateName: { type: String, required: true },
  warningLevel: { type: String, enum: ["RED","ORANGE","YELLOW","GREEN"], required: true },
  expectedRainfallMm: { type: Number, required: true },
  expectedRainfallMax: Number,
  forecastHours: { type: Number, required: true },
  populationAtRisk: Number,
  affectedAreaKm2: Number,
  impactSummary: Schema.Types.Mixed,
  isActive: { type: Boolean, default: true },
  validFrom: Date,
  validUntil: Date,
  issuedAt: { type: Date, default: Date.now },
}, { timestamps: true });

WarningSchema.index({ isActive: 1 });
WarningSchema.index({ warningLevel: 1 });
WarningSchema.index({ districtCode: 1 });

// ─── WEATHER STATION ─────────────────────────────────────
export interface IWeatherStation extends Document {
  stationId: string;
  stationName: string;
  districtName?: string;
  stateName?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  stationType?: string;
  isActive: boolean;
  lastReportedAt?: Date;
  currentRainfall?: number;
  rainfall24h?: number;
  humidity?: number;
  temperature?: number;
}

const WeatherStationSchema = new Schema<IWeatherStation>({
  stationId: { type: String, required: true, unique: true },
  stationName: { type: String, required: true },
  districtName: String,
  stateName: String,
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  elevation: Number,
  stationType: String,
  isActive: { type: Boolean, default: true },
  lastReportedAt: Date,
  currentRainfall: Number,
  rainfall24h: Number,
  humidity: Number,
  temperature: Number,
}, { timestamps: true });

WeatherStationSchema.index({ isActive: 1 });

// ─── FLOOD RISK ZONE ─────────────────────────────────────
export interface IFloodRiskZone extends Document {
  zoneName: string;
  districtCode: string;
  districtName: string;
  stateName: string;
  latitude: number;
  longitude: number;
  riskLevel: string;
  estimatedDepthM?: number;
  affectedPopulation?: number;
  rainfallThresholdMm?: number;
  riverProximityKm?: number;
  elevationM?: number;
  isCurrentlyFlooded: boolean;
}

const FloodRiskZoneSchema = new Schema<IFloodRiskZone>({
  zoneName: { type: String, required: true },
  districtCode: { type: String, required: true },
  districtName: { type: String, required: true },
  stateName: { type: String, required: true },
  latitude: Number,
  longitude: Number,
  riskLevel: { type: String, required: true },
  estimatedDepthM: Number,
  affectedPopulation: Number,
  rainfallThresholdMm: Number,
  riverProximityKm: Number,
  elevationM: Number,
  isCurrentlyFlooded: { type: Boolean, default: false },
}, { timestamps: true });

// ─── ALERT SUBSCRIPTION ──────────────────────────────────
export interface IAlertSubscription extends Document {
  phoneNumber: string;
  email?: string;
  name?: string;
  districts: string[];
  alertLevels: string[];
  channels: string[];
  language: string;
  isActive: boolean;
}

const AlertSubscriptionSchema = new Schema<IAlertSubscription>({
  phoneNumber: { type: String, required: true, unique: true },
  email: String,
  name: String,
  districts: [String],
  alertLevels: [String],
  channels: [String],
  language: { type: String, default: "English" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ─── COMMUNITY REPORT ────────────────────────────────────
export interface ICommunityReport extends Document {
  reporterName: string;
  reporterPhone?: string;
  latitude: number;
  longitude: number;
  locationName: string;
  districtName?: string;
  stateName?: string;
  reportType: string;
  description?: string;
  waterDepthCm?: number;
  severity: string;
  photoUrl?: string;
  isVerified: boolean;
  upvotes: number;
  reportedAt: Date;
}

const CommunityReportSchema = new Schema<ICommunityReport>({
  reporterName: { type: String, required: true },
  reporterPhone: String,
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  locationName: { type: String, required: true },
  districtName: String,
  stateName: String,
  reportType: { type: String, required: true },
  description: String,
  waterDepthCm: Number,
  severity: { type: String, required: true },
  photoUrl: String,
  isVerified: { type: Boolean, default: false },
  upvotes: { type: Number, default: 0 },
  reportedAt: { type: Date, default: Date.now },
}, { timestamps: true });

CommunityReportSchema.index({ reportedAt: -1 });

// ─── MODEL PERFORMANCE METRIC ────────────────────────────
export interface IModelMetric extends Document {
  modelName: string;
  metricDate: Date;
  accuracy?: number;
  rmse?: number;
  csi?: number;
  pod?: number;
  far?: number;
  correlation?: number;
  totalPredictions?: number;
}

const ModelMetricSchema = new Schema<IModelMetric>({
  modelName: { type: String, required: true },
  metricDate: Date,
  accuracy: Number,
  rmse: Number,
  csi: Number,
  pod: Number,
  far: Number,
  correlation: Number,
  totalPredictions: Number,
}, { timestamps: true });

ModelMetricSchema.index({ modelName: 1 });

// ─── CHAT SESSION ────────────────────────────────────────
export interface IChatSession extends Document {
  sessionId: string;
  userId?: mongoose.Types.ObjectId;
  messages: Array<{ role: string; content: string; timestamp?: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  messages: [{
    role: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// ─── SIMULATION RESULT ───────────────────────────────────
export interface ISimulation extends Document {
  simulationId: string;
  locationName: string;
  districtName?: string;
  stateName?: string;
  latitude: number;
  longitude: number;
  rainfallMm: number;
  durationHours: number;
  maxWaterDepthM?: number;
  affectedAreaKm2?: number;
  populationAtRisk?: number;
  buildingsAffected?: number;
  roadsSubmergedKm?: number;
  timeSeriesData?: unknown[];
  riskZones?: unknown[];
}

const SimulationSchema = new Schema<ISimulation>({
  simulationId: { type: String, required: true, unique: true },
  locationName: String,
  districtName: String,
  stateName: String,
  latitude: Number,
  longitude: Number,
  rainfallMm: Number,
  durationHours: Number,
  maxWaterDepthM: Number,
  affectedAreaKm2: Number,
  populationAtRisk: Number,
  buildingsAffected: Number,
  roadsSubmergedKm: Number,
  timeSeriesData: [Schema.Types.Mixed],
  riskZones: [Schema.Types.Mixed],
}, { timestamps: true });

// ─── BULLETIN ────────────────────────────────────────────
export interface IBulletin extends Document {
  bulletinId: string;
  type: string;
  title: string;
  stateName?: string;
  districtName?: string;
  language: string;
  content: string;
  includes: string[];
  aiEnhanced: boolean;
  isPublished: boolean;
  publishedAt?: Date;
}

const BulletinSchema = new Schema<IBulletin>({
  bulletinId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  stateName: String,
  districtName: String,
  language: { type: String, default: "English" },
  content: { type: String, required: true },
  includes: [String],
  aiEnhanced: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
}, { timestamps: true });

BulletinSchema.index({ districtName: 1 });

// ─── Helper: safe model registration ────────────────────
function getModel<T extends Document>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

export const User = getModel<IUser>("User", UserSchema);
export const OtpStore = getModel<IOtp>("OtpStore", OtpSchema);
export const UserSession = getModel<ISession>("UserSession", SessionSchema);
export const Notification = getModel<INotification>("Notification", NotificationSchema);
export const RainfallObservation = getModel<IRainfallObservation>("RainfallObservation", RainfallSchema);
export const AIPrediction = getModel<IAIPrediction>("AIPrediction", AIPredictionSchema);
export const ActiveWarning = getModel<IActiveWarning>("ActiveWarning", WarningSchema);
export const WeatherStation = getModel<IWeatherStation>("WeatherStation", WeatherStationSchema);
export const FloodRiskZone = getModel<IFloodRiskZone>("FloodRiskZone", FloodRiskZoneSchema);
export const AlertSubscription = getModel<IAlertSubscription>("AlertSubscription", AlertSubscriptionSchema);
export const CommunityReport = getModel<ICommunityReport>("CommunityReport", CommunityReportSchema);
export const ModelMetric = getModel<IModelMetric>("ModelMetric", ModelMetricSchema);
export const ChatSession = getModel<IChatSession>("ChatSession", ChatSessionSchema);
export const Simulation = getModel<ISimulation>("Simulation", SimulationSchema);
export const Bulletin = getModel<IBulletin>("Bulletin", BulletinSchema);
