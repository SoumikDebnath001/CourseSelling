import mongoose, { Schema, Model } from "mongoose";

/**
 * The single source of truth for this app's collection-isolation rule.
 *
 * This is a COMPLETELY SEPARATE project that only shares the `users` / `admins`
 * collections (read-only, for login). Every collection THIS app owns lives under a
 * `_appTwo` suffix so it can never collide with the existing Cricket Academy
 * collections in the shared database. Model names are prefixed `Ca_` so registered
 * model names stay unique too.
 *
 *   ownedModel("Course", schema, "courses")
 *     -> model "Ca_Course", collection "courses_appTwo"
 *
 * Use this for EVERY schema the app defines. Never create an owned model with a
 * bare `mongoose.model(...)` call — that risks landing on an existing collection.
 */
export const APP_SUFFIX = "_appTwo";

export function ownedCollectionName(base: string): string {
  return `${base}${APP_SUFFIX}`;
}

export function ownedModel<T>(modelBase: string, schema: Schema<T>, collectionBase: string): Model<T> {
  const modelName = `Ca_${modelBase}`;
  // Reuse the compiled model across hot reloads (tsx watch).
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName] as Model<T>;
  }
  return mongoose.model<T>(modelName, schema, ownedCollectionName(collectionBase));
}
