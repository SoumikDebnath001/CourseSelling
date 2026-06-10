"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/store/auth";

export function Navbar() {
  const account = useAuth((s) => s.account);
  const dashHref = account?.kind === "admin" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/logo.png" alt="Cricket Academy" width={34} height={34} />
          <span className="font-extrabold text-ink-900">Cricket Academy</span>
        </Link>
        <div className="flex items-center gap-5 text-sm font-medium text-ink-600">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <Link href="/catalog" className="hover:text-brand-700">Courses</Link>
          <Link href="/about" className="hover:text-brand-700">About us</Link>
          {account ? (
            <Link href={dashHref} className="rounded-lg bg-gradient-to-r from-brand-600 to-grape-600 px-4 py-1.5 font-semibold text-white">
              {account.kind === "admin" ? "Admin" : "Dashboard"}
            </Link>
          ) : (
            <Link href="/login" className="rounded-lg bg-gradient-to-r from-brand-600 to-grape-600 px-4 py-1.5 font-semibold text-white">
              Login / Register
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-ink-500">
        <div className="flex items-center gap-2">
          <Image src="/brand/ball.png" alt="" width={20} height={20} />
          <span className="font-semibold text-ink-700">Cricket Academy</span>
        </div>
        <p className="mt-2 text-xs text-ink-400">
          © {new Date().getFullYear()} Cricket Academy. Learn cricket, the right way.
        </p>
      </div>
    </footer>
  );
}
