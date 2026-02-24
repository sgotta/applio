import { MongoClient } from "mongodb";

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;
const options = {};

let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  // During build, MONGODB_URI may not be available.
  // Create a dummy promise that will never resolve — the adapter
  // won't be called during build anyway.
  clientPromise = new Promise(() => {});
} else if (process.env.NODE_ENV === "development") {
  if (!globalThis.__mongoClientPromise) {
    const client = new MongoClient(uri, options);
    globalThis.__mongoClientPromise = client.connect();
  }
  clientPromise = globalThis.__mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
