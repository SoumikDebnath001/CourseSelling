"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/store/auth";
import { useSettings } from "@/hooks/useSettings";
import PillNav from "@/components/ui/PillNav";

/**
 * Nav link with a "top + bottom bar" hover animation: two bars slide in from the
 * edges (top bar from the left, bottom bar from the right) and meet across the
 * label, then retract on leave. Driven by GSAP.
 */
function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const top = useRef<HTMLSpanElement>(null);
  const bottom = useRef<HTMLSpanElement>(null);

  const enter = () => {
    gsap.to(top.current, { scaleX: 1, transformOrigin: "left", duration: 0.3, ease: "power3.out" });
    gsap.to(bottom.current, { scaleX: 1, transformOrigin: "right", duration: 0.3, ease: "power3.out" });
  };
  const leave = () => {
    gsap.to(top.current, { scaleX: 0, transformOrigin: "right", duration: 0.3, ease: "power3.in" });
    gsap.to(bottom.current, { scaleX: 0, transformOrigin: "left", duration: 0.3, ease: "power3.in" });
  };

  return (
    <Link
      href={href}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onClick={onClick}
      className="relative inline-block px-0.5 py-1 transition-colors hover:text-brand-700 w-fit"
    >
      <span
        ref={top}
        aria-hidden
        className="absolute left-0 top-0 h-0.5 w-full origin-left scale-x-0 rounded bg-gradient-to-r from-brand-600 to-grape-600"
      />
      {children}
      <span
        ref={bottom}
        aria-hidden
        className="absolute bottom-0 left-0 h-0.5 w-full origin-right scale-x-0 rounded bg-gradient-to-r from-grape-600 to-brand-600"
      />
    </Link>
  );
}

export function Navbar() {
  const account = useAuth((s) => s.account);
  const { settings } = useSettings();
  const dashHref = account?.kind === "admin" ? "/admin" : "/dashboard";

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // GSAP animation for mobile sidebar slide-in
  useEffect(() => {
    if (isSidebarOpen) {
      gsap.to(overlayRef.current, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(sidebarRef.current, { x: 0, duration: 0.4, ease: "power3.out" });
      // Prevent body scrolling when sidebar is open
      document.body.style.overflow = "hidden"; 
    } else {
      gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.3, ease: "power2.in" });
      gsap.to(sidebarRef.current, { x: "100%", duration: 0.4, ease: "power3.in" });
      // Restore body scrolling
      document.body.style.overflow = ""; 
    }
    
    // Cleanup to ensure body scrolling is restored on unmount
    return () => { document.body.style.overflow = ""; };
  }, [isSidebarOpen]);

  return (
    <>
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-center px-4 py-3">
        <PillNav
          logo="/brand/logo.png"
          logoAlt={settings?.platformName || "Academy"}
          logoText={settings?.platformName || "Academy"}
          items={[
            { label: 'Home', href: '/' },
            { label: 'Courses', href: '/catalog' },
            { label: 'About us', href: '/about' },
            { label: account ? (account.kind === "admin" ? "Admin" : "Dashboard") : "Login / Register", href: account ? dashHref : '/login' }
          ]}
          onMobileMenuClick={() => setIsSidebarOpen(true)}
          ease="power2.easeOut"
          baseColor="#16a34a"
          pillColor="#f5f3ff"
          hoveredPillTextColor="#ffffff"
          pillTextColor="#111827"
          className="shadow-sm border border-ink-100 rounded-full"
        />
      </nav>
      </header>

      {/* ───────── Mobile Sidebar Overlay ───────── */}
      {/* Rendered OUTSIDE the backdrop-blurred header — a `backdrop-filter` ancestor
          would otherwise become the containing block for these `fixed` elements and
          make the sidebar scroll with the page. */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] bg-ink-900/40 backdrop-blur-sm invisible opacity-0 md:hidden"
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ───────── Mobile Sidebar ───────── */}
      <div 
        ref={sidebarRef}
        className="fixed top-0 right-0 z-[110] h-[100dvh] w-64 sm:w-80 bg-white shadow-2xl translate-x-full md:hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 bg-brand-50/30">
          <div className="flex items-center gap-2">
            <Image src="/brand/logo.png" alt={settings?.platformName || "Academy"} width={28} height={28} />
            <span className="font-extrabold text-ink-900">{settings?.platformName || "Academy"}</span>
          </div>
          <button 
            className="p-2 text-ink-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors focus:outline-none"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Sidebar Links */}
        <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto text-base font-medium text-ink-700">
          <div className="flex flex-col gap-5">
            <NavLink href="/" onClick={() => setIsSidebarOpen(false)}>Home</NavLink>
            <NavLink href="/catalog" onClick={() => setIsSidebarOpen(false)}>Courses</NavLink>
            <NavLink href="/about" onClick={() => setIsSidebarOpen(false)}>About us</NavLink>
          </div>
          
          <div className="h-px w-full bg-ink-100" />
          
          <div className="flex flex-col gap-3 mt-2">
            {account ? (
              <Link 
                href={dashHref} 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-grape-600 px-4 py-3.5 font-semibold text-white shadow-md shadow-brand-600/20 active:scale-95 transition-transform"
              >
                {account.kind === "admin" ? "Admin" : "Dashboard"}
              </Link>
            ) : (
              <Link 
                href="/login" 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-grape-600 px-4 py-3.5 font-semibold text-white shadow-md shadow-brand-600/20 active:scale-95 transition-transform"
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

