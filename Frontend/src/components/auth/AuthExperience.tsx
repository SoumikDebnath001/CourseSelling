"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, User, KeyRound, ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuthActions } from "@/hooks/useAuthActions";
import { apiError } from "@/lib/axios";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Tab = "login" | "register";
type LoginMethod = "password" | "otp";
type Step = "form" | "verify";

export function AuthExperience() {
  const router = useRouter();
  const actions = useAuthActions();
  const [tab, setTab] = useState<Tab>("login");
  const [method, setMethod] = useState<LoginMethod>("password");
  const [step, setStep] = useState<Step>("form");
  const [showPw, setShowPw] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [sentNote, setSentNote] = useState("");

  const goHome = () => {
    toast.success("Welcome to the academy!");
    router.replace("/");
  };
  const fail = (e: unknown) => toast.error(apiError(e));

  /* ── submit handlers ── */
  const submitPasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    actions.login.mutate({ email, password }, { onSuccess: goHome, onError: fail });
  };
  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    actions.register.mutate(
      { name, email, password },
      {
        onSuccess: (res) => {
          const msg = (res?.data as { message?: string })?.message ?? "Verification code sent to your email.";
          setSentNote(msg);
          toast.success("Mail sent ✅");
          setStep("verify");
        },
        onError: fail,
      }
    );
  };
  const submitRegisterVerify = (e: React.FormEvent) => {
    e.preventDefault();
    actions.verifyOtp.mutate({ email, otp }, { onSuccess: goHome, onError: fail });
  };
  const requestLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    actions.requestOtp.mutate(
      { email },
      {
        onSuccess: (res) => {
          const msg = (res?.data as { message?: string })?.message ?? "If that email has an account, a code is on its way.";
          setSentNote(msg);
          toast.success("Mail sent ✅");
          setStep("verify");
        },
        onError: fail,
      }
    );
  };
  const submitLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    actions.loginOtp.mutate({ email, otp }, { onSuccess: goHome, onError: fail });
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setStep("form");
    setOtp("");
    setSentNote("");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-grape-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-80 w-80 rounded-full bg-sun-400/20 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2 text-white">
          <Image src="/brand/logo.png" alt="" width={40} height={40} className="rounded-lg bg-white/10 p-1" />
          <span className="text-lg font-extrabold">Cricket Academy</span>
        </Link>
        <div className="relative text-white">
          <Sparkles className="h-8 w-8 text-sun-300" />
          <h2 className="mt-4 text-4xl font-extrabold leading-tight">
            Train smarter.<br />Play sharper.
          </h2>
          <p className="mt-4 max-w-sm text-brand-100">
            Video-first coaching, module tests and coach feedback — all in one place. Sign in to
            pick up where you left off, or create an account to start.
          </p>
          <ul className="mt-8 space-y-2 text-sm text-brand-100">
            {["HD lessons by academy coaches", "Tests that track your progress", "Ask questions under every video"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-sun-300">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-brand-200">© {new Date().getFullYear()} Cricket Academy</p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-ink-50 px-5 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 lg:hidden">
            <Image src="/brand/logo.png" alt="" width={28} height={28} /> Cricket Academy
          </Link>

          {/* Tabs */}
          <div className="mb-6 inline-flex rounded-xl bg-ink-100 p-1">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={cn(
                  "rounded-lg px-5 py-1.5 text-sm font-semibold capitalize transition",
                  tab === t ? "bg-white text-brand-700 shadow-sm" : "text-ink-500"
                )}
              >
                {t === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* ── LOGIN ── */}
          {tab === "login" && (
            <div>
              <h1 className="text-2xl font-extrabold text-ink-900">Welcome back</h1>
              <p className="mt-1 text-sm text-ink-500">Members and online learners — sign in below.</p>

              <div className="mt-5 inline-flex gap-1 rounded-lg bg-ink-100 p-1 text-xs font-semibold">
                <button onClick={() => { setMethod("password"); setStep("form"); }} className={cn("rounded-md px-3 py-1.5", method === "password" ? "bg-white text-brand-700 shadow-sm" : "text-ink-500")}>Password</button>
                <button onClick={() => { setMethod("otp"); setStep("form"); }} className={cn("rounded-md px-3 py-1.5", method === "otp" ? "bg-white text-brand-700 shadow-sm" : "text-ink-500")}>Email code</button>
              </div>

              {method === "password" ? (
                <form onSubmit={submitPasswordLogin} className="mt-5 space-y-4">
                  <IconInput icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} />
                  <IconInput
                    icon={Lock}
                    type={showPw ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={setPassword}
                    trailing={
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="text-ink-400">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  <BrandButton loading={actions.login.isPending}>Sign in</BrandButton>
                </form>
              ) : step === "form" ? (
                <form onSubmit={requestLoginOtp} className="mt-5 space-y-4">
                  <IconInput icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} />
                  <p className="text-xs text-ink-400">We&apos;ll email you a 6-digit code to sign in — no password needed. (Online learners only.)</p>
                  <BrandButton loading={actions.requestOtp.isPending}>Send code</BrandButton>
                </form>
              ) : (
                <OtpForm
                  email={email}
                  otp={otp}
                  setOtp={setOtp}
                  sentNote={sentNote}
                  loading={actions.loginOtp.isPending}
                  onSubmit={submitLoginOtp}
                  onBack={() => setStep("form")}
                />
              )}
            </div>
          )}

          {/* ── REGISTER ── */}
          {tab === "register" && (
            <div>
              <h1 className="text-2xl font-extrabold text-ink-900">Create your account</h1>
              <p className="mt-1 text-sm text-ink-500">
                New here? Sign up for the course platform. Already an academy member? Just log in.
              </p>

              {step === "form" ? (
                <form onSubmit={submitRegister} className="mt-5 space-y-4">
                  <IconInput icon={User} placeholder="Full name" value={name} onChange={setName} />
                  <IconInput icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} />
                  <IconInput
                    icon={Lock}
                    type={showPw ? "text" : "password"}
                    placeholder="Password (min 6 chars)"
                    value={password}
                    onChange={setPassword}
                    trailing={
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="text-ink-400">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  <IconInput
                    icon={Lock}
                    type={showPw ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                  />
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="-mt-2 text-xs text-ball-600">Passwords don&apos;t match</p>
                  )}
                  <BrandButton loading={actions.register.isPending}>Create account</BrandButton>
                </form>
              ) : (
                <OtpForm
                  email={email}
                  otp={otp}
                  setOtp={setOtp}
                  sentNote={sentNote}
                  loading={actions.verifyOtp.isPending}
                  onSubmit={submitRegisterVerify}
                  onBack={() => setStep("form")}
                  verifyLabel="Verify & continue"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── small building blocks ── */
function IconInput({
  icon: Icon,
  trailing,
  value,
  onChange,
  ...rest
}: {
  icon: React.ComponentType<{ className?: string }>;
  trailing?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      {trailing && <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span>}
    </div>
  );
}

function BrandButton({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <Button
      type="submit"
      loading={loading}
      className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-grape-600 py-2.5 text-base hover:from-brand-700 hover:to-grape-700"
    >
      {children}
    </Button>
  );
}

function OtpForm({
  email,
  otp,
  setOtp,
  sentNote,
  loading,
  onSubmit,
  onBack,
  verifyLabel = "Sign in",
}: {
  email: string;
  otp: string;
  setOtp: (v: string) => void;
  sentNote?: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  verifyLabel?: string;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      {sentNote && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Mail sent — {sentNote}</span>
        </div>
      )}
      <div className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
        <KeyRound className="mb-1 h-4 w-4" />
        Enter the 6-digit code sent to <span className="font-semibold">{email}</span>.
      </div>
      <input
        inputMode="numeric"
        maxLength={6}
        placeholder="••••••"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        className="w-full rounded-xl border border-ink-200 bg-white py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <BrandButton loading={loading}>{verifyLabel}</BrandButton>
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
    </form>
  );
}
