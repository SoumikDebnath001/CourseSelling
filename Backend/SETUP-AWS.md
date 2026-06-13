# AWS S3 + CloudFront setup (beginner walkthrough)

This is the one-time cloud setup so the app can store course media and stream it
fast to many viewers. You do this **once** in the AWS Console (web UI).

**The plan:**

```
Admin uploads video  ──▶  Your API (Node)  ──▶  S3 bucket  (PRIVATE — the safe vault)
                                                    │
Student watches  ◀── CloudFront (CDN, fast)  ◀──────┘
```

- **S3** = where files live. Kept **private** so nobody can grab them directly.
- **CloudFront** = the delivery network in front of S3. It caches each video at
  edge servers worldwide, so 10 (or 10,000) people watching the same video is
  cheap and smooth — S3 is hit once, then everyone is served from the cache.

Total time: ~30–40 minutes. You need an AWS account (free to create; this usage
is very low-cost — typically a few dollars/month at your scale, and there's a
12-month free tier).

> Tip: keep a scratch note open. You'll collect **5 values** to paste into
> `Backend/.env` at the end: region, access key id, secret access key, bucket
> name, CloudFront domain. (Two more optional values for protected videos.)

---

## Step 1 — Create the S3 bucket (the storage)

1. Sign in to the [AWS Console](https://console.aws.amazon.com/).
2. Top-right, pick a **Region** near your users (e.g. *Asia Pacific (Mumbai)
   ap-south-1*). Remember this — it's your `AWS_REGION`.
3. Search **S3** → open it → **Create bucket**.
4. **Bucket name**: something globally unique, e.g. `cricket-academy-media`
   (this is your `S3_BUCKET`).
5. **Block Public Access**: leave **all 4 boxes CHECKED** (fully private). ✅
   CloudFront will be allowed to read it — the public never touches S3 directly.
6. Leave the rest as default → **Create bucket**.

---

## Step 2 — Create the CloudFront distribution (the CDN)

1. Search **CloudFront** → **Create distribution**.
2. **Origin domain**: click the box and pick your S3 bucket from the list
   (it shows `cricket-academy-media.s3...`).
3. **Origin access**: choose **Origin access control settings (recommended)**.
   - Click **Create control setting** → keep defaults → **Create**.
   - This creates an "OAC" so only CloudFront can read your private bucket.
4. **Viewer protocol policy**: **Redirect HTTP to HTTPS**.
5. **Web Application Firewall**: "Do not enable" is fine to start.
6. Leave everything else default → **Create distribution**.
7. AWS shows a yellow banner: **"The S3 bucket policy needs to be updated."**
   Click **Copy policy**, then **Go to S3 bucket permissions** → **Bucket
   policy → Edit** → paste → **Save**. (This grants CloudFront read access.)
8. Wait ~5–10 min until the distribution status is **Enabled / Deployed**.
9. Copy the **Distribution domain name** — looks like
   `d1234abcd.cloudfront.net`. This is your `CLOUDFRONT_DOMAIN`
   (paste it **without** `https://`).

> Don't change "Default root object". The app builds full file paths itself.

---

## Step 3 — Create an IAM user (the API's key to upload)

Your server needs permission to put/delete files in the bucket.

1. Search **IAM** → **Users** → **Create user**.
2. Name: `cricket-academy-api`. **Do NOT** enable console access. → Next.
3. **Permissions** → **Attach policies directly** → search and tick
   **AmazonS3FullAccess** (simple to start; you can tighten this later to just
   your one bucket). → Create user.
4. Open the user → **Security credentials** tab → **Create access key** →
   choose **Application running outside AWS** → Create.
5. Copy both values now (the secret is shown only once):
   - **Access key ID** → `AWS_ACCESS_KEY_ID`
   - **Secret access key** → `AWS_SECRET_ACCESS_KEY`

---

## Step 4 — Fill in `Backend/.env`

Open `Backend/.env` (copy from `.env.example` if you haven't) and set:

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...your-key...
AWS_SECRET_ACCESS_KEY=...your-secret...
S3_BUCKET=cricket-academy-media
CLOUDFRONT_DOMAIN=d1234abcd.cloudfront.net
```

Restart the backend. On boot you should see:

```
✅ S3 + CloudFront configured (bucket: cricket-academy-media, cdn: d1234abcd.cloudfront.net)
```

**That's it — you're live.** Log in as admin, add a course with a thumbnail,
add a topic with a video, then open the course as a student and play it. The
video now streams from CloudFront.

---

## Step 5 (optional, recommended) — Protect videos with signed URLs

Without this, anyone who gets a CloudFront video link could share it. Signed
URLs make each video link **expire** (default 6 hours) and be **tamper-proof**,
so only logged-in, enrolled students get a working link. The app does this
automatically once you provide a signing key — until then it serves plain URLs.

1. **Make a key pair** on your computer (terminal):
   ```bash
   openssl genrsa -out cf_private.pem 2048
   openssl rsa -pubout -in cf_private.pem -out cf_public.pem
   ```
2. **CloudFront → Key management → Public keys → Create public key**. Paste the
   contents of `cf_public.pem`. Save. Copy the generated **Public key ID**.
3. **CloudFront → Key management → Key groups → Create key group**. Add the
   public key you just made. Save.
4. **Attach the key group to your distribution**: CloudFront → your distribution
   → **Behaviors** → edit the default behavior → **Restrict viewer access** =
   **Yes** → **Trusted key groups** → select your key group → Save.
5. Put the values in `Backend/.env`:
   - `CLOUDFRONT_KEY_PAIR_ID` = the **Public key ID** from step 2.
   - `CLOUDFRONT_PRIVATE_KEY` = the contents of `cf_private.pem` as **one line**.
     Convert newlines to `\n`, e.g.:
     ```bash
     awk 'NF {printf "%s\\n", $0}' cf_private.pem
     ```
     Copy that output into the value:
     ```env
     CLOUDFRONT_KEY_PAIR_ID=K1ABCD2EFGHIJ
     CLOUDFRONT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n
     ```
6. Restart the backend. Course videos now stream via expiring signed URLs.

> Keep `cf_private.pem` secret (never commit it). It's the master key to your videos.

---

## How this maps to the requirement "10 users watch one video at a time"

- The first viewer's request fills the CloudFront edge cache; the other nine are
  served straight from the cache — no extra S3 reads, low cost, no buffering.
- CloudFront auto-scales; 10 concurrent viewers is trivial for it.
- The `<video>` player supports HTTP range requests through CloudFront, so users
  can seek/scrub and the browser only downloads the parts being watched.

## Costs (rough, your scale)

- S3 storage: ~$0.023 / GB / month.
- CloudFront delivery: ~$0.085 / GB out (first 1 TB), and the first 1 TB/month
  is free for 12 months on the AWS Free Tier.
- A handful of courses + light traffic = typically a few dollars a month.

## Troubleshooting

- **Boot warning `⚠️ S3/CloudFront not configured`** → a required `.env` value is
  missing/empty. All of `AWS_REGION`, `AWS_ACCESS_KEY_ID`,
  `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`, `CLOUDFRONT_DOMAIN` must be set.
- **Upload returns 503 "Media uploads are not configured"** → same as above.
- **Video/thumbnail shows 403 (AccessDenied)** → the S3 bucket policy from
  Step 2.7 wasn't saved, or the distribution isn't deployed yet.
- **Thumbnail won't render in Next.js** → it must be a `*.cloudfront.net` URL
  (already allowed) or set `NEXT_PUBLIC_CDN_HOSTNAME` for a custom domain.
- **Signed video gives 403** → the key group isn't attached to the behavior
  (Step 5.4), or `CLOUDFRONT_PRIVATE_KEY` newlines aren't `\n`-encoded.
