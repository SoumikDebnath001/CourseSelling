# Cricket Academy — Courses (Backend)

Express + TypeScript + MongoDB. **Shares** the existing academy database but is
strictly isolated from it.

## Isolation contract (read before touching models)
- Reads only `users` / `admins` (login), via read-only models in
  `src/models/external/` (`autoIndex:false`, never written).
- Writes ONLY to `*_appTwo` collections. Define every owned model through
  `ownedModel()` in `src/utils/ownedModel.ts` — never `mongoose.model()` directly.
- `autoIndex` is globally disabled so no index is ever built on existing collections.

## Setup
```bash
cp .env.example .env               # fill in the SHARED MONGODB_URI, JWT, Cloudinary, mail
npm install
npm run check:isolation            # proves isolation against the real DB (no writes)
npm run dev                        # http://localhost:4000/api/v1
```

## Scripts
- `npm run dev` — hot-reload dev server (tsx)
- `npm run check:isolation` — connect, verify external models + naming, list collections
- `npm run build` / `npm start` — compile + run
- `npm run typecheck` — tsc --noEmit
