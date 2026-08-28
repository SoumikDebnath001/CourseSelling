# The obuya blueprint — E-Learning Platform

Course-selling / e-learning platform for the The obuya blueprint (Kenya). Students register,
buy/enroll in cricket courses, watch video lessons, take tests, climb progression levels, and earn
certificates (some gated behind an in-person physical assessment).

## Repo layout

- `Frontend/` — Next.js 15 (App Router, TypeScript, Tailwind). State via TanStack React Query + axios (`src/lib/axios.ts`).
- `Backend/` — Express + TypeScript + Mongoose (MongoDB). Entry `src/index.ts`; routes → controllers → models.
- `nginx/`, `docker-compose.yml` — deployment (nginx reverse proxy, Docker).
- `models/` (repo root) — legacy/reference model sketches, NOT used by the app. The real models are `Backend/src/models/`.
- `fwdcertificatecomponents/` — certificate design assets (sample PNGs).

## Commands

- Frontend: `npm run dev | build | lint | typecheck` (in `Frontend/`)
- Backend: `npm run dev | build | typecheck` (in `Backend/`); utility scripts: `mail:test`, `pesapal:test`, `sync:indexes`, `check:isolation`

## Key domain concepts

- **Two user pools**: `OnlinePlatformUser` (self-registered online learners) vs. external/legacy academy
  members (`Backend/src/models/external/` — `ExistingUser`, `ExistingAdmin`). Academy members log in with
  password; online learners can also use email OTP.
- **Auth**: JWT + OTP codes over email (`Backend/src/controllers/auth.ts`, mail via nodemailer).
  Registration = form → OTP email → verify. Registration requires accepting the Terms & Conditions pop-up.
- **Progression levels**: configurable in Settings (`levels`); learners earn per-category points to unlock levels.
- **Certificates**: issued after course completion; some require passing an offline **physical assessment**
  (student applies with WhatsApp number, admin reviews). Rendered client-side as print-ready HTML in
  `Frontend/src/lib/certificate.ts`.
- **Certificate signatories**: `Settings.certificate.signatories` is the admin-managed pool of people
  (name, role lines, transparent-PNG signature) — CRUD at `/settings/signatories[/:id]`, UI on
  `/admin/certificates`. Each course selects up to 3 of them (`Course.certificateSignatories` ids), chosen
  at course creation and in the course builder's Completion-certificate card; empty selection falls back to
  the pool's first signatory. `resolveSignatories()` in `Frontend/src/lib/certificate.ts` maps ids → blocks.
  The flat `Settings.certificate.coachName/roleLine*/signature*` fields are the legacy single signatory,
  kept only as the migration source (auto-promoted into the pool by `Settings.getSingleton()`).
- **Payments**: Pesapal gateway (`Backend/src/controllers/payment.ts`).
- **Settings singleton** (`Backend/src/models/Settings.ts`, `Settings.getSingleton()`): one document holding
  platform branding, contacts, footer/socials, About page, certificate signatory, watermark, levels, and
  **Terms & Conditions** (`terms.content`). Edited at `/admin/settings` (Frontend
  `src/app/admin/settings/page.tsx`), read publicly via `GET /settings`. New nested fields need: model schema +
  zod schema + merge logic in `controllers/settings.ts`, `Settings` type in `Frontend/src/types/api.ts`, and
  the defaults merge in `Frontend/src/hooks/useSettings.ts`.

## Terms & Conditions ("Consent and Participation Agreement")

- Default text lives in `Backend/src/config/terms.ts` (seeds/backfills the Settings doc) with a frontend
  fallback copy in `Frontend/src/lib/terms.ts`. Admin edits it in Settings → "Terms & conditions" tab.
- Text format convention: `## ` heading, `- ` bullet, blank line = paragraph. Rendered by
  `Frontend/src/components/auth/TermsModal.tsx` (sign-up pop-up) and `termsBlock()` in
  `Backend/src/mail/templates/index.ts` (included in the registration/verification email).
- Sign-up flow (`Frontend/src/components/auth/AuthExperience.tsx`): user must tick "I Agree" in the
  pop-up before the account is created; submitting without agreeing opens the pop-up and continues
  registration after agreement.

## Conventions

- Backend controllers use `asyncHandler` + `ApiError` (`src/utils/asyncHandler.ts`) and zod schemas
  validated by `validateBody` middleware; routes guard with `requireAuth` / `requireAdmin`.
- File uploads via `express-fileupload` → `src/utils/storage.ts` (S3-style storage with presigned URLs —
  re-sign stored asset URLs before returning them, see `signSettingsAssets`).
- Frontend data hooks live in `src/hooks/` (React Query), shared API types in `src/types/api.ts`.
  Toasts via `react-hot-toast`; icons via `lucide-react`; styling with Tailwind utility classes and the
  `cn()` helper. Custom palette names: `ink`, `brand`, `grape`, `pitch`, `ball`, `sun`.
- Emails use `baseLayout()` in `Backend/src/mail/templates/baseLayout.ts` (pitch-green branded shell).
