"use client";

import Image from "next/image";
import { useSettings } from "@/hooks/useSettings";

/** Default copy used until an admin fills in the About fields in Site Settings. */
const FALLBACK = {
  title: "About the Academy",
  intro:
    "The Cricket Academy brings structured, video-first coaching to members — batting, bowling, fielding and match craft, broken into modules and topics you can learn at your own pace.",
  body:
    "Each lesson includes resources, optional tests to check your understanding, and a comment space where you can ask coaches questions directly under the video.\n\nCourses are created and curated by academy admins and coaches. Log in with your academy account to access everything.",
};

export default function AboutPage() {
  const { settings } = useSettings();
  const about = settings.about ?? { images: [] };

  const title = about.title || FALLBACK.title;
  const intro = about.intro || FALLBACK.intro;
  const body = about.body || FALLBACK.body;
  const images = (about.images ?? []).filter((img) => img.url);

  // Split the body into paragraphs on blank lines so admins can write multi-paragraph copy.
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{title}</h1>

      {intro && <p className="mt-4 text-ink-600">{intro}</p>}

      {paragraphs.map((p, i) => (
        <p key={i} className="mt-4 text-ink-600">{p}</p>
      ))}

      {images.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {images.map((img, i) => (
            <div key={img.publicId ?? i} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink-100 bg-ink-50">
              <Image src={img.url!} alt={`${title} ${i + 1}`} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
