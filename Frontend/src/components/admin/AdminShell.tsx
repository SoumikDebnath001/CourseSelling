"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, FolderTree, Users, Settings, ExternalLink, Menu, X, LogOut, ClipboardCheck } from "lucide-react";
import { gsap } from "gsap";
import toast from "react-hot-toast";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AccountBar } from "@/components/layout/AccountBar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/Button";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/physical-assessments", label: "Physical Assessments", icon: ClipboardCheck },
  { href: "/admin/students", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
  { href: "/", label: "Back to Site", icon: ExternalLink, exact: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuth((s) => s.clearAuth);
  
  const [confirming, setConfirming] = useState(false);
  
  const doLogout = () => {
    clearAuth();
    toast.success("Signed out");
    router.replace("/");
  };
  
  // Mobile sidebar state
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
      document.body.style.overflow = "hidden"; 
    } else {
      gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.3, ease: "power2.in" });
      gsap.to(sidebarRef.current, { x: "-100%", duration: 0.4, ease: "power3.in" });
      document.body.style.overflow = ""; 
    }
    return () => { document.body.style.overflow = ""; };
  }, [isSidebarOpen]);

  return (
    <RequireAuth kind="admin">
      <div className="min-h-screen bg-ink-50 flex flex-col relative">
        <AccountBar 
          home="/admin" 
          hideLogout={true} 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        
        <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-6 flex-1">
          {/* Desktop Sidebar */}
          <aside className="hidden w-52 shrink-0 sm:block">
            <nav className="space-y-1 sticky top-[88px]">
              {nav.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-pitch-600 text-white shadow-sm" : "text-ink-600 hover:bg-white hover:text-ink-900"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" /> {label}
                  </Link>
                );
              })}
              
              <div className="h-px w-full bg-ink-200 my-2" />
              <button
                onClick={() => setConfirming(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" /> Logout
              </button>
            </nav>
          </aside>
          
          <div className="min-w-0 flex-1">{children}</div>
        </div>

        {/* ───────── Mobile Sidebar Overlay ───────── */}
        <div 
          ref={overlayRef}
          className="fixed inset-0 z-[60] bg-ink-900/40 backdrop-blur-sm invisible opacity-0 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* ───────── Mobile Sidebar ───────── */}
        <div 
          ref={sidebarRef}
          className="fixed top-0 left-0 z-[70] h-[100dvh] w-64 bg-white shadow-2xl -translate-x-full sm:hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 bg-ink-50/50">
            <span className="font-extrabold text-ink-900">Admin Menu</span>
            <button 
              className="p-2 text-ink-500 hover:text-brand-600 hover:bg-ink-100 rounded-full transition-colors focus:outline-none"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
            {nav.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                    active ? "bg-pitch-600 text-white shadow-sm" : "text-ink-700 hover:bg-ink-50"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" /> {label}
                </Link>
              );
            })}
            
            <div className="h-px w-full bg-ink-100 my-2" />
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setConfirming(true);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-ink-700 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" /> Logout
            </button>
          </div>
        </div>

        {/* Logout confirmation */}
        {confirming && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirming(false)}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ball-50">
                <LogOut className="h-6 w-6 text-ball-600" />
              </div>
              <h3 className="mt-3 text-lg font-bold text-ink-900">Log out?</h3>
              <p className="mt-1 text-sm text-ink-500">Are you sure you want to log out of the admin panel?</p>
              <div className="mt-5 flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setConfirming(false)}>Cancel</Button>
                <Button variant="danger" className="flex-1" onClick={doLogout}>Log out</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
