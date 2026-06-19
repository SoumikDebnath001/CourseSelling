"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, FolderTree, Users, Settings } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AccountBar } from "@/components/layout/AccountBar";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/categories", label: "Paths", icon: FolderTree },
  { href: "/admin/students", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <RequireAuth kind="admin">
      <div className="min-h-screen bg-ink-50">
        <AccountBar home="/admin" />
        <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
          <aside className="hidden w-52 shrink-0 sm:block">
            <nav className="space-y-1">
              {nav.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                      active ? "bg-pitch-600 text-white" : "text-ink-600 hover:bg-white"
                    )}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </RequireAuth>
  );
}
