import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiMail, FiLock, FiCheckCircle, FiShield, FiKey } from "react-icons/fi";
import toast from "react-hot-toast";
import GlassCard from "./GlassCard";
import {
  forgotUserPassword,
  verifyUserOtp,
  forgotEmployeePassword,
  verifyEmployeeOtp,
} from "../../../Services/auth.service";

export const ForgotPasswordForm = ({ initialRole = "User" }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState(initialRole);
  const [step, setStep] = useState("email"); // "email" | "otp" | "success"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (role === "User") {
        response = await forgotUserPassword({ email, subject: "Password Reset Request" });
      } else {
        response = await forgotEmployeePassword({ email, subject: "Employee Password Reset Verification" });
      }

      if (response?.error) {
        toast.error(response.error);
      } else if (response?.data?.status) {
        toast.success(response.data.message || "OTP code sent to your email!");
        setStep("otp");
      } else {
        toast.error(response?.data?.message || "Failed to send OTP code.");
      }
    } catch (err) {
      toast.error("Network or server error while sending OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP code.");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (role === "User") {
        response = await verifyUserOtp({ email, otp });
      } else {
        response = await verifyEmployeeOtp({ email, otp });
      }

      if (response?.error) {
        toast.error(response.error);
      } else if (response?.data?.status) {
        toast.success("OTP verified successfully! You can now log in.");
        setStep("success");
      } else {
        toast.error(response?.data?.message || "Invalid or expired OTP.");
      }
    } catch (err) {
      toast.error("OTP verification error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="w-full max-w-md border-amber-500/20 text-white">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-amber-200/80 transition-colors hover:text-white"
        >
          <FiArrowLeft className="h-4 w-4" /> Back Home
        </Link>

        {/* Role Selector */}
        <div className="flex rounded-lg border border-white/10 bg-black/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => { setRole("User"); setStep("email"); }}
            className={`rounded-md px-3 py-1 font-medium transition-all ${
              role === "User" ? "bg-amber-600 text-white" : "text-stone-400 hover:text-white"
            }`}
          >
            Guest
          </button>
          <button
            type="button"
            onClick={() => { setRole("Staff"); setStep("email"); }}
            className={`rounded-md px-3 py-1 font-medium transition-all ${
              role === "Staff" ? "bg-amber-600 text-white" : "text-stone-400 hover:text-white"
            }`}
          >
            Staff
          </button>
        </div>
      </div>

      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <FiKey className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-white">
          Reset Password
        </h2>
        <p className="mt-1 text-xs text-stone-300">
          {step === "email"
            ? `Enter your registered ${role === "User" ? "Guest" : "Staff"} email to receive a verification OTP`
            : step === "otp"
            ? `Enter the 6-digit code sent to ${email}`
            : "Password reset completed!"}
        </p>
      </div>

      {step === "email" && (
        <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
              Email Address
            </label>
            <div className="relative mt-2">
              <FiMail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pr-4 pl-10 text-sm text-white placeholder:text-stone-500 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text.sm font-medium text-white shadow-lg transition-all duration-300 hover:from-amber-500 hover:to-amber-600 hover:shadow-amber-500/25 disabled:opacity-60"
          >
            {loading ? "Sending OTP..." : "Send Verification OTP"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
              6-Digit OTP Code
            </label>
            <div className="relative mt-2">
              <FiLock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                required
                maxLength={6}
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pr-4 pl-10 text-center text-lg tracking-widest text-white placeholder:text-stone-500 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-amber-500 hover:to-amber-600 hover:shadow-amber-500/25 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP Code"}
          </button>

          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full text-center text-xs text-stone-400 hover:text-white"
          >
            Didn't get code? Change email or try again
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="mt-6 text-center">
          <FiCheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
          <p className="mt-3 text-sm text-stone-200">
            Your OTP has been successfully verified!
          </p>
          <button
            type="button"
            onClick={() => navigate(role === "User" ? "/user/auth/login" : "/employee/auth/login")}
            className="mt-5 w-full cursor-pointer rounded-xl bg-amber-600 py-3 text-sm font-medium text-white transition-all hover:bg-amber-500"
          >
            Proceed to Login
          </button>
        </div>
      )}

      <div className="mt-6 text-center text-xs text-stone-400">
        Remember your password?{" "}
        <Link
          to={role === "User" ? "/user/auth/login" : "/employee/auth/login"}
          className="font-semibold text-amber-400 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </GlassCard>
  );
};

export default ForgotPasswordForm;
