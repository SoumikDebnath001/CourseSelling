import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function JoinCTASection({
  account,
  cta,
}: {
  account: any;
  cta: any;
}) {
  if (account) return null;

  return (
    <section className="relative w-full bg-[url('/homepage/HomeHero2.png')] bg-fixed bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="reveal relative mx-auto max-w-6xl px-4 pb-12 sm:pb-20 pt-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-amber-600 px-6 py-10 text-center sm:px-16 sm:py-12 shadow-2xl border border-white/10">
        <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-white/10 sm:h-32 sm:w-32" />

        <div className="pointer-events-none absolute -bottom-10 right-4 h-32 w-32 rounded-full bg-amber-400/20 sm:right-10 sm:h-40 sm:w-40" />

        <h2 className="relative text-2xl font-extrabold text-white sm:text-3xl">
          Let&apos;s join the academy
        </h2>

        <p className="relative mx-auto mt-2 max-w-md text-sm text-teal-100 sm:text-base">
          Create your free account and start learning cricket the right
          way today.
        </p>

        <Link
          href="/login"
          {...cta}
          className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-teal-700 sm:w-auto"
        >
          Get started
          <ArrowRight data-arrow className="h-4 w-4" />
        </Link>
        </div>
      </div>
    </section>
  );
}
