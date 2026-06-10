# Cricket Academy — Courses (Frontend)

Next.js 15 (App Router) + TypeScript + Tailwind + TanStack Query + Zustand.

## Setup
```bash
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at the Backend
npm install
npm run dev                        # http://localhost:3000
```

The Backend must be running (default `http://localhost:4000/api/v1`).

## Structure
- `src/app` — App Router routes (marketing, auth, dashboard, admin)
- `src/components` — UI + feature components
- `src/lib` — axios client, helpers
- `src/store` — Zustand auth session
- `public/brand` — academy logo + ball icon
