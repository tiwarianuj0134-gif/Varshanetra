import mongoose from "mongoose";
import dns from "node:dns";

// Fix for Windows / ISP DNS resolvers failing SRV lookups (querySrv ECONNREFUSED)
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  // Ignore in environments where setting custom DNS servers is restricted
}

function resolveDirectMongoUri(uri: string): string {
  if (!uri) return uri;
  // If URI is an SRV string for cluster0.s2qhsap.mongodb.net, automatically transform to direct replica set hosts
  // to 100% bypass SRV lookups which fail on Windows/ISP DNS resolvers with querySrv ECONNREFUSED.
  if (uri.startsWith("mongodb+srv://") && uri.includes("cluster0.s2qhsap.mongodb.net")) {
    const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@cluster0\.s2qhsap\.mongodb\.net\/?([^?]*)/);
    if (match) {
      const [, user, pass, dbName] = match;
      const db = dbName || "varshanetra";
      return `mongodb://${user}:${pass}@ac-rgwstvi-shard-00-00.s2qhsap.mongodb.net:27017,ac-rgwstvi-shard-00-01.s2qhsap.mongodb.net:27017,ac-rgwstvi-shard-00-02.s2qhsap.mongodb.net:27017/${db}?ssl=true&replicaSet=atlas-10ipri-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  }
  return uri;
}

const rawUri = process.env.MONGODB_URI || "";
const MONGODB_URI = resolveDirectMongoUri(rawUri);

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose.mongoose ?? { conn: null, promise: null };
globalWithMongoose.mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    }).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    // Fallback if somehow SRV was used and failed with querySrv or ECONNREFUSED
    const errStr = String(e?.message || e);
    if ((errStr.includes("querySrv") || errStr.includes("ECONNREFUSED")) && rawUri.includes("cluster0.s2qhsap.mongodb.net")) {
      const directUri = resolveDirectMongoUri("mongodb+srv://tiwarianuj0134_db_user:hBAaK0BHFLlahz5k@cluster0.s2qhsap.mongodb.net/varshanetra");
      console.log("[MongoDB] Falling back to direct replica-set hosts...");
      cached.promise = mongoose.connect(directUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
      });
      cached.conn = await cached.promise;
      return cached.conn;
    }
    throw e;
  }

  return cached.conn;
}

