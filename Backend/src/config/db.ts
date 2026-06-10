import mongoose from "mongoose";
import { env } from "./env";

/**
 * Connects to the SHARED MongoDB.
 *
 * Safety posture for a shared database:
 *  - `autoIndex` is disabled globally. We never want this app's model definitions to
 *    trigger index builds on collections the other app owns. Our own *_appTwo
 *    collections get their indexes created explicitly in a controlled script.
 *  - `strictQuery` keeps queries predictable.
 */
export async function connectDB(): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);
  mongoose.set("autoIndex", false);

  mongoose.connection.on("connected", () => {
    console.log(`✅ MongoDB connected → db "${mongoose.connection.name}"`);
  });
  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

  await mongoose.connect(env.MONGODB_URI);
  return mongoose;
}
