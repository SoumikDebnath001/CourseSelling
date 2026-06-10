# Cricket Academy — Course Selling Platform · Architecture Plan

> A **second app** that lives alongside an existing Cricket Academy / Obuya Grassroots
> platform and **shares the same MongoDB database**. It is inspired by the StudyNotion
> EdTech project (course → module → topic → video flow), rewritten in modern TypeScript,
> and extended with **per-video comments (like / star / pin)**, **optional module tests**,
> an **optional final course test**, and a **site-wide mail system**.
>
> ⚠️ **Hard isolation rule:** this app NEVER creates, alters, or writes the existing
> collections. It only *reads* `users` and `admins` (for login). Every collection it
> owns is written under a `_appTwo` suffix so the two apps cannot collide.

---

## 0. Repository layout

```
CourseSelling/
├─ models/                            # the OTHER app's schemas — REFERENCE ONLY, never imported/edited
├─ studynotion-edtech-project-main/   # design reference only
├─ Backend/                           # Express + TypeScript + MongoDB (API server)
├─ Frontend/                          # Next.js (App Router) + TypeScript (web client)
├─ Academylogo.png                    # provided brand asset (1024×1024)
├─ ball_icon_Bg_less.png              # provided brand asset (1024×1024)
└─ PLAN.md
```

Frontend and Backend are **fully separate** apps (own `package.json`, `.env`, deploy
lifecycle). They talk only over HTTP (REST + JWT).

---

## 1. The shared-database contract (most important section)

### What already exists in this DB (owned by the other app — DO NOT TOUCH)
`users`, `admins`, `courses`, `courseprogresses`, `courseenrollments`, `programs`,
`enrollments`, `categories`(none today), products, orders, blogs, events, … and ~30 more.

### How this app stays isolated
1. **Read-only models for auth only.** Two thin Mongoose models map to the existing
   `users` and `admins` collections, declared with `{ autoIndex: false }` and only the
   fields we read. We never call `.save()`, `create`, `updateX`, or `syncIndexes()` on
   them — they are strictly for **login lookups**. No index is ever built on those
   collections by us.
2. **Every owned collection is suffixed `_appTwo`.** Each new model pins an explicit
   collection name as the 3rd arg of `model(name, schema, "<name>_appTwo")`, e.g.
   `model("Ca_Course", schema, "courses_appTwo")`. Model *names* are also prefixed
   `Ca_` so they can't clash with the other app's registered model names if code ever
   shares a process.
3. **Cross-app references are by ObjectId only.** New docs store `userId` / `adminId`
   pointing at existing `users` / `admins` `_id`s, but the existing docs are never
   mutated (we do NOT push into `User.courses`, etc. — enrollment lives in our own
   `enrollments_appTwo`).

### Owned collections (all created by this app)
```
onlinePlatformUser_appTwo   courses_appTwo        modules_appTwo
topics_appTwo               comments_appTwo       tests_appTwo
testattempts_appTwo         enrollments_appTwo    courseprogress_appTwo
categories_appTwo           ratings_appTwo
```
`onlinePlatformUser_appTwo` holds people who sign up on THIS site directly (no
existing academy account). Existing `users`/`admins` are still read-only.

---

## 2. Identity & roles

Three identity sources. `kind: "user" | "admin"`; users also carry
`source: "member" | "platform"`.

| Who                | Source collection           | Auth                                  | Can do |
|--------------------|-----------------------------|---------------------------------------|--------|
| **Admin**          | `admins` (read-only)        | email+password, **URL-only** (`/admin/login`, not linked in UI) | Everything: categories, courses, modules, topics, video/resource uploads, module & final tests, publish, moderate comments (pin/star/delete), dashboards & members. |
| **Member**         | `users` (read-only)         | email+password                        | Consume courses: enroll, watch, comment, like, take tests, progress, rate. |
| **Online learner** | `onlinePlatformUser_appTwo` (owned) | **registers on this site** (name/email/password → **OTP email verify**), then logs in by **email+password OR passwordless OTP** | Same consumption rights as a member. |

After any successful login the user is sent to the **Home** page. Registration
exists ONLY for online learners; if a registrant's email already belongs to an
academy member they're told to log in instead. OTP secrets are hashed (SHA-256,
10-min expiry); passwords for platform users are bcrypt-hashed by this app.

- Passwords are verified with **bcrypt** (`bcryptjs.compare`) against the existing hashes.
  Existing models store `password` with `select:false`, so our read model explicitly
  re-selects it for the compare.
- Guards before login: `isDeleted !== true`, `isActive !== false`, `isBlocked !== true`
  (User), `isDeleted !== true` (Admin).
- **Two login endpoints / two portals:** `/auth/login` (User → student app) and
  `/auth/admin/login` (Admin → authoring app). JWT payload:
  `{ id, kind: "user" | "admin", role, name, email }`.
- No signup, no email verification, no password-reset writes (those belong to the other
  app). If a password reset is ever needed it's done in the primary app.

---

## 3. Data model — collections this app OWNS (Mongoose, suffixed)

Hierarchy required by the brief:
`Course → Module → Topic → Video(Cloudinary)+Resources → Comments(like/star/pin)`,
with **optional Test** on each Module and **optional final Test** on the Course.

```
Ca_Category → categories_appTwo
  name(unique), description, icon, isActive

Ca_Course → courses_appTwo
  courseName, slug(unique), courseDescription, whatYouWillLearn,
  thumbnail{url,publicId}, price, tags:[String],
  category → Ca_Category,
  createdByAdmin → (admins._id),          # author, read-only ref
  modules: [Ca_Module],                   # ordered
  finalTest → Ca_Test (optional),
  instructions: [String],
  status: "Draft"|"Published",
  studentsEnrolledCount (denormalized), timestamps

Ca_Module → modules_appTwo
  moduleName, description, order,
  course → Ca_Course,
  topics: [Ca_Topic],
  test → Ca_Test (optional)               # module-level test

Ca_Topic → topics_appTwo                  # the video unit
  title, description, order,
  module → Ca_Module, course → Ca_Course,
  videoUrl, videoPublicId, timeDurationSec,
  resources: [{ name, url, publicId, type }],   # pdf / link / file
  commentCount (denormalized), timestamps

Ca_Comment → comments_appTwo
  topic → Ca_Topic, course → Ca_Course,
  authorId, authorModel: "User"|"Admin",  # dynamic ref (refPath)
  authorNameSnapshot,                      # denormalized for display
  text,
  parent → Ca_Comment (null = top-level; set = 1-level reply),
  likes: [userId],                         # toggled by any enrolled user
  isPinned: Boolean,                       # admin only → floats to top
  isStarred: Boolean,                      # admin only → "featured/helpful" badge
  isEdited: Boolean, timestamps

Ca_Test → tests_appTwo                     # reused for module AND final tests
  title, description,
  scope: "module"|"course",
  course → Ca_Course, module → Ca_Module (null for final),
  questions: [{ questionText, options:[String], correctOption:Number,
               points, explanation }],
  passingScorePct (default 60), timeLimitMins (optional),
  isPublished: Boolean

Ca_TestAttempt → testattempts_appTwo
  test → Ca_Test, userId, course → Ca_Course,
  answers: [{ questionIndex, selectedOption }],
  scorePct, passed: Boolean, submittedAt

Ca_Enrollment → enrollments_appTwo         # our enrollment (NOT the other app's)
  userId, course → Ca_Course,
  status: "active"|"cancelled",
  enrolledAt, timestamps
  # unique (userId, course) for active

Ca_CourseProgress → courseprogress_appTwo
  userId, course → Ca_Course,
  completedTopics: [Ca_Topic],
  passedTests: [Ca_Test], timestamps

Ca_RatingReview → ratings_appTwo
  userId, course → Ca_Course(index), rating, review, timestamps
```

**Comment semantics** (the "stared, liked, pin" requirement):
- **like** — any enrolled user toggles; `likes[]` of userIds; count shown.
- **pin** — Admin only; pinned comments sort to the top of the topic.
- **star** — Admin only; "featured / helpful" badge (great Q&A).
- **replies** — one level deep via `parent`.

---

## 4. Backend structure (`/Backend`)

```
Backend/
├─ src/
│  ├─ index.ts                  # boot, mount routes, connect DB + Cloudinary
│  ├─ config/{db,cloudinary,env}.ts
│  ├─ models/
│  │  ├─ external/              # READ-ONLY maps to existing collections
│  │  │  ├─ ExistingUser.ts     # collection "users",  autoIndex:false
│  │  │  └─ ExistingAdmin.ts    # collection "admins", autoIndex:false
│  │  └─ *.ts                   # Ca_* owned models (suffixed collections)
│  ├─ middleware/
│  │  ├─ auth.ts                # requireAuth, requireAdmin, requireStudent
│  │  ├─ validate.ts            # Zod body/params validator
│  │  └─ error.ts               # central error handler
│  ├─ controllers/
│  │  ├─ auth.ts                # login (User), adminLogin (Admin), me
│  │  ├─ category.ts            # create/list/page            (write=admin)
│  │  ├─ course.ts             # CRUD, publish, details, fullDetails, adminList
│  │  ├─ module.ts              # create/update/delete         (admin)
│  │  ├─ topic.ts               # create/update/delete + video/resource upload (admin)
│  │  ├─ comment.ts             # add, list, like, pin, star, edit, delete, reply
│  │  ├─ test.ts                # create/update/get/submit, results (admin authors)
│  │  ├─ enrollment.ts          # enrollFree  ← payment seam
│  │  ├─ progress.ts            # mark topic complete, get progress
│  │  ├─ rating.ts              # create, course reviews, average
│  │  └─ admin.ts               # dashboard stats, students list
│  ├─ routes/                   # thin routers
│  ├─ mail/{mailSender.ts, templates/}
│  ├─ services/payment.ts       # PaymentProvider interface; FreeProvider now
│  ├─ utils/{token,cloudinaryUpload,slug,asyncHandler}.ts
│  └─ types/                    # shared TS types + Express Request augmentation
├─ .env.example  tsconfig.json  package.json
```

**Payment seam:** `services/payment.ts` exports `PaymentProvider`
(`createOrder`, `verify`), bound today to `FreeProvider` (auto-succeeds).
`enrollment.ts` enrolls into `enrollments_appTwo` + sends the email. Adding
Razorpay/Stripe later = one file + env keys, no other changes.

---

## 5. Mail system (site-wide, best-effort)

Single `mailSender` (Nodemailer) + typed branded templates. Mail writes nothing to
existing collections — it just emails the person's existing address.

| Event                          | Template            |
|--------------------------------|---------------------|
| Course enrollment              | `courseEnrollment`  |
| Module test passed / failed    | `testResult`        |
| Final course test passed       | `coursePassed`      |
| Reply to your comment          | `commentReply`      |
| (Admin) course published       | `coursePublished`   |

Signup/welcome/OTP/password templates are intentionally **omitted** — there is no
registration in this app. Failures are logged, never crash the request.

---

## 6. API surface (high level)

```
POST   /api/v1/auth/login              # User (member/coach)
POST   /api/v1/auth/admin/login        # Admin
GET    /api/v1/auth/me

GET    /api/v1/categories              POST /api/v1/categories         (admin)
GET    /api/v1/categories/:id/page

GET    /api/v1/courses                 # published catalog
GET    /api/v1/courses/:slug           # public details
GET    /api/v1/courses/:id/full        # enrolled full content
POST   /api/v1/courses   PUT/DELETE /:id   PATCH /:id/publish          (admin)
GET    /api/v1/admin/courses                                           (admin)

POST/PUT/DELETE  /api/v1/modules[/:id]                                 (admin)
POST/PUT/DELETE  /api/v1/topics[/:id]              # multipart upload  (admin)

GET    /api/v1/topics/:id/comments
POST   /api/v1/topics/:id/comments                 (enrolled user/admin)
POST   /api/v1/comments/:id/like                   (enrolled user)
PATCH  /api/v1/comments/:id/pin                     (admin)
PATCH  /api/v1/comments/:id/star                    (admin)
PUT/DELETE /api/v1/comments/:id                      (author or admin)

POST/PUT /api/v1/tests[/:id]                         (admin)
GET    /api/v1/tests/:id                # no answers
POST   /api/v1/tests/:id/submit                      (enrolled) → graded
GET    /api/v1/tests/:id/result                      (enrolled)

POST   /api/v1/enroll/:courseId         # free enroll (payment seam)
POST   /api/v1/progress/:courseId/complete-topic
GET    /api/v1/progress/:courseId

POST   /api/v1/ratings    GET /api/v1/courses/:id/reviews
GET    /api/v1/admin/dashboard   GET /api/v1/admin/students            (admin)
```

---

## 7. Frontend structure (`/Frontend`, Next.js App Router + TS)

Stack: Tailwind, TanStack Query (server state), Zustand (auth), react-hook-form + Zod,
axios (JWT interceptor), react-hot-toast, lucide-react. Brand: `Academylogo.png` →
nav/login; `ball_icon_Bg_less.png` → favicon, loaders, completed-topic markers
(copied to `Frontend/public/brand/`).

```
src/app/
  (marketing)/      page.tsx(home)  catalog/[category]  courses/[slug]  about  contact
  (auth)/           login/                 admin/login/        # two login forms only
  (dashboard)/
    dashboard/  my-profile/  enrolled-courses/
    learn/[courseId]/[topicId]/            # video + resources + comments + tests
    admin/  courses/ add-course/ edit-course/[id]/ categories/ students/ tests/
components/  ui/ layout/ course/ player/ comments/ test/
lib/{axios,react-query,utils}.ts   store/auth.ts   hooks/   types/
```

The student app and admin app share components but are gated by `kind` in the JWT.

---

## 8. Build phases (each = a reviewable checkpoint)

1. **Scaffold + infra + DB isolation** — both folders, deps, tsconfig, env examples;
   DB + Cloudinary connect; the two read-only external models (`users`/`admins`),
   verified to never index/write; Express boot; Next.js boot; Tailwind; brand assets;
   axios/query/zustand; base UI kit; README run instructions.
2. **Auth (login-only) + mail core** — bcrypt login for User & Admin, JWT, guards,
   `/me`; mailSender + base templates; frontend login pages (user + admin), auth store,
   protected routing.
3. **Catalog & course content (admin)** — Category/Course/Module/Topic models + CRUD +
   Cloudinary video/resource upload; admin course builder UI; catalog + course landing.
4. **Enrollment + learning + progress** — free-enroll (payment seam) into
   `enrollments_appTwo`, enrolled full-course fetch, video player page, resources,
   mark-complete/progress, enrollment email.
5. **Comments** — model + endpoints (add/reply/like/pin/star/edit/delete), comment UI
   under each video with like/pin/star controls.
6. **Tests** — Test/TestAttempt models, module + final test authoring (admin),
   TestRunner + grading + results, test-result email, progress integration.
7. **Polish** — ratings/reviews, admin dashboard & students, contact form, remaining
   templates, empty/loading/error states, final pass.

Delivered in order; you review at each checkpoint before I continue.

---

## 9. Environment variables

**Backend `.env`** (shares MONGODB_URI with the other app)
```
PORT=4000
MONGODB_URI=                      # SAME cluster/db as the existing app
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=  CLOUDINARY_API_KEY=  CLOUDINARY_API_SECRET=
MAIL_HOST=  MAIL_USER=  MAIL_PASS=  MAIL_FROM="Cricket Academy <...>"
CLIENT_URL=http://localhost:3000
```
**Frontend `.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

You supply the (shared) Mongo URI, Cloudinary, and SMTP creds before runtime. Because
the URI is shared, the isolation rules in §1 are what keep the existing app safe.
