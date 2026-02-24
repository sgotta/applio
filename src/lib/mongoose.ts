import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.__mongoose ?? {
  conn: null,
  promise: null,
};
if (!globalThis.__mongoose) globalThis.__mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
