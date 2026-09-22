"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { X } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useSettings } from "@/hooks/useSettings";
import PillNav from "@/components/ui/PillNav";

/**
 * Nav link with a "top + bottom bar" hover animation.
 */
function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const top = useRef<HTMLSpanElement>(null);
  const bottom = useRef<HTMLSpanElement>(null);

  const enter = () => {
    gsap.to(top.current, {
      scaleX: 1,
      transformOrigin: "left",
      duration: 0.3,
      ease: "power3.out",
    });

    gsap.to(bottom.current, {
      scaleX: 1,
      transformOrigin: "right",
      duration: 0.3,
      ease: "power3.out",
    });
  };

  const leave = () => {
    gsap.to(top.current, {
      scaleX: 0,
      transformOrigin: "right",
      duration: 0.3,
      ease: "power3.in",
    });

    gsap.to(bottom.current, {
      scaleX: 0,
      transformOrigin: "left",
      duration: 0.3,
      ease: "power3.in",
    });
  };

  return (
    <Link
      href={href}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onClick={onClick}
      className="
        relative
        inline-block
        w-fit
        px-0.5
        py-1
        transition-colors
        hover:text-teal-700
      "
    >
      <span
        ref={top}
        aria-hidden
        className="
          absolute
          left-0
          top-0
          h-0.5
          w-full
          origin-left
          scale-x-0
          rounded
          bg-gradient-to-r
          from-teal-600
          to-amber-600
        "
      />

      {children}

      <span
        ref={bottom}
        aria-hidden
        className="
          absolute
          bottom-0
          left-0
          h-0.5
          w-full
          origin-right
          scale-x-0
          rounded
          bg-gradient-to-r
          from-amber-600
          to-teal-600
        "
      />
    </Link>
  );
}

export function Navbar() {
  const account = useAuth((s) => s.account);
  const { settings } = useSettings();

  const dashHref =
    account?.kind === "admin"
      ? "/admin"
      : "/dashboard";

  // Stable nav items — PillNav rebuilds its GSAP timelines (and replays its
  // intro animation) whenever this array identity changes.
  const navItems = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Courses", href: "/catalog" },
      { label: "About us", href: "/about" },
      {
        label: account
          ? account.kind === "admin"
            ? "Admin"
            : "Dashboard"
          : "Login / Register",
        href: account ? dashHref : "/login",
      },
    ],
    [account, dashHref]
  );

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close sidebar on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // Mobile sidebar animation
  useEffect(() => {
    if (isSidebarOpen) {
      gsap.to(overlayRef.current, {
        autoAlpha: 1,
        duration: 0.3,
        ease: "power2.out",
      });

      gsap.to(sidebarRef.current, {
        x: 0,
        duration: 0.4,
        ease: "power3.out",
      });

      document.body.style.overflow = "hidden";
    } else {
      gsap.to(overlayRef.current, {
        autoAlpha: 0,
        duration: 0.3,
        ease: "power2.in",
      });

      gsap.to(sidebarRef.current, {
        x: "100%",
        duration: 0.4,
        ease: "power3.in",
      });

      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  return (
    <>
      {/* =========================================================
          MAIN NAVBAR
      ========================================================= */}

      <header className="fixed left-0 top-0 z-50 w-full pt-3">
        <nav className="mx-auto flex max-w-6xl items-center justify-center px-4">
          <PillNav
            logo="/brand/logo-sm.webp"
            logoAlt={settings?.platformName || "Academy"}
            logoText={settings?.platformName || "Academy"}
            logoTextColor="#d97706"
            items={navItems}
            onMobileMenuClick={openSidebar}
            ease="power2.easeOut"
            baseColor="#16a34a"
            pillColor="rgba(255,255,255,0.12)"
            hoveredPillTextColor="#ffffff"
            pillTextColor="#10201a"
            className="
              rounded-full

              /* Mobile: transparent */
              border-transparent
              bg-transparent
              shadow-none
              ring-0

              backdrop-blur-none
              backdrop-saturate-100

              /* Desktop: glass navbar */
              md:border-white/30
              md:bg-green-600/40
              md:backdrop-blur-2xl
              md:backdrop-saturate-150
              md:shadow-[0_8px_32px_rgba(0,0,0,0.15)]
              md:ring-1
              md:ring-white/10
            "
          />
        </nav>
      </header>

      {/* =========================================================
          MOBILE SIDEBAR OVERLAY
      ========================================================= */}

      <div
        ref={overlayRef}
        className="
          invisible
          fixed
          inset-0
          z-[100]
          bg-ink-900/40
          opacity-0
          backdrop-blur-sm
          md:hidden
        "
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* =========================================================
          MOBILE SIDEBAR
      ========================================================= */}

      <div
        ref={sidebarRef}
        className="
          fixed
          right-0
          top-0
          z-[110]

          flex
          h-[100dvh]
          w-64
          translate-x-full
          flex-col

          bg-white
          shadow-2xl

          sm:w-80
          md:hidden
        "
      >
        {/* Sidebar Header */}
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-ink-100
            bg-teal-50/30
            px-5
            py-4
          "
        >
          <div className="flex items-center gap-2">
            <Image
              src="/brand/logo.png"
              alt={settings?.platformName || "Academy"}
              width={28}
              height={28}
            />

            <span className="font-extrabold text-[#d97706]">
              {settings?.platformName || "Academy"}
            </span>
          </div>

          {/* Close button */}
          <button
            type="button"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full

              border
              border-teal-100

              bg-white

              text-ink-500

              shadow-sm

              transition-all
              duration-200

              hover:bg-teal-50
              hover:text-teal-600

              active:scale-95

              focus:outline-none
            "
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Links */}
        <div
          className="
            flex
            flex-1
            flex-col
            gap-6
            overflow-y-auto
            p-6
            text-base
            font-medium
            text-ink-700
          "
        >
          <div className="flex flex-col gap-5">
            <NavLink
              href="/"
              onClick={() => setIsSidebarOpen(false)}
            >
              Home
            </NavLink>

            <NavLink
              href="/catalog"
              onClick={() => setIsSidebarOpen(false)}
            >
              Courses
            </NavLink>

            <NavLink
              href="/about"
              onClick={() => setIsSidebarOpen(false)}
            >
              About us
            </NavLink>
          </div>

          <div className="h-px w-full bg-ink-100" />

          {/* Account */}
          <div className="mt-2 flex flex-col gap-3">
            {account ? (
              <Link
                href={dashHref}
                onClick={() => setIsSidebarOpen(false)}
                className="
                  flex
                  items-center
                  justify-center
                  rounded-xl

                  bg-gradient-to-r
                  from-teal-600
                  to-amber-600

                  px-4
                  py-3.5

                  font-semibold
                  text-white

                  shadow-md
                  shadow-teal-600/20

                  transition-transform

                  active:scale-95
                "
              >
                {account.kind === "admin"
                  ? "Admin"
                  : "Dashboard"}
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsSidebarOpen(false)}
                className="
                  flex
                  items-center
                  justify-center
                  rounded-xl

                  bg-gradient-to-r
                  from-teal-600
                  to-amber-600

                  px-4
                  py-3.5

                  font-semibold
                  text-white

                  shadow-md
                  shadow-teal-600/20

                  transition-transform

                  active:scale-95
                "
              >
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}