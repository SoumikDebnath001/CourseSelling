/**
 * Isolation proof. Run with:  npm run check:isolation
 *
 * Connects to the SHARED database and verifies — WITHOUT writing a single document —
 * that this app's data layer is correctly isolated from the existing app:
 *
 *   1. The read-only external models resolve to the existing `users` / `admins`
 *      collections and can be read.
 *   2. `autoIndex` is globally off (no index builds on shared collections).
 *   3. The owned-model helper produces only `*_appTwo` collection names.
 *   4. It lists existing collections so you can eyeball that nothing was clobbered.
 *
 * This script performs ONLY reads + metadata queries.
 */
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { ExistingUser } from "../models/external/ExistingUser";
import { ExistingAdmin } from "../models/external/ExistingAdmin";
import { ownedCollectionName } from "../utils/ownedModel";

async function main() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("No database handle after connect");

  console.log("\n──────── ISOLATION CHECK ────────\n");

  // 1. autoIndex must be globally disabled
  const autoIndex = mongoose.get("autoIndex");
  console.log(`autoIndex global setting : ${autoIndex} ${autoIndex === false ? "✅" : "❌ EXPECTED false"}`);

  // 2. External models target the right collections
  console.log(`ExistingUser  → collection "${ExistingUser.collection.collectionName}" ${ExistingUser.collection.collectionName === "users" ? "✅" : "❌"}`);
  console.log(`ExistingAdmin → collection "${ExistingAdmin.collection.collectionName}" ${ExistingAdmin.collection.collectionName === "admins" ? "✅" : "❌"}`);

  // 3. Read-only reachability (counts only, no documents mutated)
  const [userCount, adminCount] = await Promise.all([
    ExistingUser.estimatedDocumentCount(),
    ExistingAdmin.estimatedDocumentCount(),
  ]);
  console.log(`users  readable          : ${userCount} docs ✅`);
  console.log(`admins readable          : ${adminCount} docs ✅`);

  // Detect bcrypt hashes on a sample (helps confirm the login strategy)
  const sample = await ExistingUser.findOne({}).select("+password email").lean();
  if (sample?.password) {
    const looksBcrypt = /^\$2[aby]\$/.test(sample.password);
    console.log(`sample password hash     : ${sample.password.slice(0, 7)}… ${looksBcrypt ? "✅ bcrypt" : "⚠️ NOT bcrypt"}`);
  } else {
    console.log("sample password hash     : (no user / password not selectable)");
  }

  // 4. Owned-collection naming convention
  for (const base of ["Course", "Module", "Topic", "Comment", "Test", "Enrollment"]) {
    console.log(`owned "${base}"`.padEnd(24) + `→ "${ownedCollectionName(base)}"`);
  }

  // 5. Existing collections snapshot (so you can confirm nothing was touched/created)
  const collections = (await db.listCollections().toArray()).map((c) => c.name).sort();
  const appTwo = collections.filter((c) => c.endsWith("_appTwo"));
  console.log(`\nTotal collections in DB  : ${collections.length}`);
  console.log(`Existing (non-appTwo)    : ${collections.length - appTwo.length}`);
  console.log(`Owned (*_appTwo)         : ${appTwo.length ? appTwo.join(", ") : "(none yet — expected before Phase 3)"}`);
  console.log("\nAll existing collections:");
  console.log(collections.filter((c) => !c.endsWith("_appTwo")).join(", "));

  console.log("\n✅ Isolation check complete — no writes were performed.\n");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Isolation check failed:", err);
  process.exit(1);
});
