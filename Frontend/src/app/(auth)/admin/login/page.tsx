"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { api, apiError } from "@/lib/axios";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import type { LoginResponse } from "@/types/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>("/auth/admin/login", { email, password });
      setAuth(data.token, data.account);
      toast.success("Signed in");
      router.replace("/admin");
    } catch (err) {
      toast.error(apiError(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-900 via-brand-900 to-ink-900 px-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-extrabold text-ink-900">Admin access</h1>
          <p className="text-sm text-ink-400">Manage courses, tests and comments.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input type="email" required placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-ink-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input type={showPw ? "text" : "password"} required maxLength={72} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-ink-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button type="submit" loading={loading} className="w-full rounded-xl bg-brand-600 py-2.5 hover:bg-brand-700">
            Sign in
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-center">
          <Image src="/brand/ball.png" alt="" width={18} height={18} className="opacity-40" />
        </div>
      </div>
    </div>
  );
}
