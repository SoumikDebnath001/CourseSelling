"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Mail, Lock, User, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useSettings } from "@/hooks/useSettings";
import { apiError } from "@/lib/axios";
import { Button } from "@/components/ui/Button";
import { TermsModal } from "@/components/auth/TermsModal";
import { DEFAULT_TERMS } from "@/lib/terms";
import { cn } from "@/lib/utils";

type Tab = "login" | "register";
type LoginMethod = "password" | "otp";
type Step = "form" | "verify";

export function AuthExperience() {
  const router = useRouter();
  const actions = useAuthActions();
  const { settings } = useSettings();
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
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [pendingRegister, setPendingRegister] = useState(false);

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
  const doRegister = () => {
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
  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password.length > 30) return toast.error("Password must be at most 30 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    if (!agreedTerms) {
      setPendingRegister(true);
      setShowTerms(true);
      return;
    }
    doRegister();
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
    setAgreedTerms(false);
    setShowTerms(false);
    setPendingRegister(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-pitch-900 via-ink-900 to-amber-900 p-4 sm:p-6 lg:p-8">
      {/* Background blobs for vibrancy */}

      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-pitch-500/30 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-amber-500/30 blur-[100px]" />

      {/* Glass Container */}
      <div className="relative z-10 flex w-full max-w-[1000px] flex-col overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl lg:flex-row">

        {/* Left Side: Dynamic Illustration */}
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 bg-white/5 p-6 lg:w-1/2 lg:p-12">

          {/* Desktop Logo (Absolute) */}
          <Link href="/" className="hidden lg:flex absolute left-8 top-8 items-center gap-2 text-white transition-opacity hover:opacity-80">
            <Image src="/brand/logo.png" alt="Logo" width={32} height={32} className="rounded-lg bg-white/20 p-1" />
            <span className="font-extrabold tracking-tight">The obuya blueprint</span>
          </Link>

          {/* Mobile Logo (Relative, above SVG) */}
          <Link href="/" className="mb-4 flex items-center gap-2 text-white lg:hidden transition-opacity hover:opacity-80">
            <Image src="/brand/logo.png" alt="Logo" width={32} height={32} className="rounded-lg bg-white/20 p-1" />
            <span className="text-lg font-extrabold tracking-tight">The obuya blueprint</span>
          </Link>

          <div className="relative mt-2 lg:mt-8 w-full max-w-[180px] lg:max-w-xs aspect-[4/3] transition-all duration-500 drop-shadow-2xl hover:scale-105">
            {tab === "login" ? (
              <Image src="/auth/Login.svg" alt="Login Illustration" fill className="object-contain" priority />
            ) : (
              <Image src="/auth/Signup.svg" alt="Signup Illustration" fill className="object-contain" priority />
            )}
          </div>
          <div className="relative z-10 mt-4 lg:mt-8 text-center text-white hidden sm:block">
            <h2 className="text-xl lg:text-3xl font-extrabold tracking-tight">
              {tab === "login" ? "Welcome Back!" : "Join Us Today"}
            </h2>
            <p className="mx-auto mt-2 lg:mt-3 max-w-[280px] text-xs lg:text-sm text-white/70">
              {tab === "login"
                ? "Pick up where you left off. Continue your learning journey right now."
                : "Create an account to track your progress and access premium coaching."}
            </p>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="flex w-full flex-col p-6 sm:p-8 lg:p-12 lg:w-1/2">
          <Link href="/" className="mb-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          {/* Tabs */}
          <div className="mb-8 flex rounded-xl bg-black/20 p-1.5 backdrop-blur-md">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all",
                  tab === t ? "bg-white/20 text-white shadow-sm" : "text-white/60 hover:text-white"
                )}
              >
                {t === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* ── LOGIN ── */}
          {tab === "login" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h1 className="text-2xl font-extrabold text-white">Sign in</h1>
              <p className="mt-1 text-sm text-white/60">Members and online learners — log in below.</p>

              <div className="mt-6 mb-2 inline-flex gap-1 rounded-lg bg-black/20 p-1 text-xs font-semibold">
                <button onClick={() => { setMethod("password"); setStep("form"); }} className={cn("rounded-md px-3 py-1.5 transition-all", method === "password" ? "bg-white/20 text-white" : "text-white/60 hover:text-white")}>Password</button>
                <button onClick={() => { setMethod("otp"); setStep("form"); }} className={cn("rounded-md px-3 py-1.5 transition-all", method === "otp" ? "bg-white/20 text-white" : "text-white/60 hover:text-white")}>Email code</button>
              </div>

              {method === "password" ? (
                <form onSubmit={submitPasswordLogin} className="space-y-4">
                  <IconInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />
                  <IconInput
                    icon={Lock}
                    type={showPw ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={setPassword}
                    maxLength={72}
                    trailing={
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="text-white/50 hover:text-white transition">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  <div className="pt-2">
                    <BrandButton loading={actions.login.isPending}>Sign in</BrandButton>
                  </div>
                </form>
              ) : step === "form" ? (
                <form onSubmit={requestLoginOtp} className="space-y-4">
                  <IconInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />
                  <p className="text-xs text-white/60">We&apos;ll email you a 6-digit code to sign in — no password needed. (Online learners only.)</p>
                  <div className="pt-2">
                    <BrandButton loading={actions.requestOtp.isPending}>Send code</BrandButton>
                  </div>
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
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h1 className="text-2xl font-extrabold text-white">Create account</h1>
              <p className="mt-1 text-sm text-white/60">
                New here? Sign up below to join the platform.
              </p>

              {step === "form" ? (
                <form onSubmit={submitRegister} className="mt-6 space-y-4">
                  <IconInput icon={User} placeholder="Full name" value={name} onChange={setName} />
                  <IconInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />
                  <IconInput
                    icon={Lock}
                    type={showPw ? "text" : "password"}
                    placeholder="Password (6–30 chars)"
                    value={password}
                    onChange={setPassword}
                    maxLength={30}
                    trailing={
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="text-white/50 hover:text-white transition">
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
                    <p className="-mt-2 text-xs text-rose-gold-400">Passwords don&apos;t match</p>
                  )}
                  <label className="flex cursor-pointer items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPendingRegister(false);
                          setShowTerms(true);
                        } else {
                          setAgreedTerms(false);
                        }
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10 text-amber-500 focus:ring-amber-500/30"
                    />
                    <span className="text-sm text-white/70">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setPendingRegister(false);
                          setShowTerms(true);
                        }}
                        className="font-semibold text-amber-400 underline underline-offset-2 hover:text-amber-300"
                      >
                        Terms &amp; Conditions
                      </button>
                    </span>
                  </label>
                  <div className="pt-2">
                    <BrandButton loading={actions.register.isPending}>Create account</BrandButton>
                  </div>
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

      {showTerms && (
        <TermsModal
          content={settings.terms?.content || DEFAULT_TERMS}
          onAgree={() => {
            setAgreedTerms(true);
            setShowTerms(false);
            if (pendingRegister) {
              setPendingRegister(false);
              doRegister();
            }
          }}
          onClose={() => {
            setShowTerms(false);
            setPendingRegister(false);
          }}
        />
      )}
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
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/50 outline-none backdrop-blur-sm transition focus:border-amber-400/50 focus:bg-white/20 focus:ring-2 focus:ring-amber-400/20"
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
      className="w-full rounded-xl border border-white/10 bg-gradient-to-r from-pitch-500 to-amber-500 py-2.5 text-base text-white shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] hover:from-pitch-400 hover:to-amber-400 hover:shadow-xl hover:shadow-amber-500/30 active:scale-[0.98]"
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
    <form onSubmit={onSubmit} className="mt-6 space-y-5 animate-in fade-in duration-300">
      {sentNote && (
        <div className="flex items-start gap-2 rounded-xl border border-pitch-400/30 bg-pitch-400/10 p-3 text-sm font-medium text-pitch-100 backdrop-blur-md">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pitch-300" />
          <span>Mail sent — {sentNote}</span>
        </div>
      )}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
        <KeyRound className="mb-2 h-4 w-4 text-amber-400" />
        Enter the 6-digit code sent to <span className="font-semibold text-white">{email}</span>.
      </div>
      <input
        inputMode="numeric"
        maxLength={6}
        placeholder="••••••"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        className="w-full rounded-xl border border-white/20 bg-white/10 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder-white/30 outline-none backdrop-blur-sm transition focus:border-amber-400/50 focus:bg-white/20 focus:ring-2 focus:ring-amber-400/20"
      />
      <div className="pt-2">
        <BrandButton loading={loading}>{verifyLabel}</BrandButton>
      </div>
      <button type="button" onClick={onBack} className="flex items-center justify-center gap-1 w-full mt-2 text-sm text-white/60 hover:text-white transition">
        <ArrowLeft className="h-4 w-4" /> Back to form
      </button>
    </form>
  );
}
