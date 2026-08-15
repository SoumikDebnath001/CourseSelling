import React, { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiArrowUpRight, FiEye, FiEyeOff, FiMail, FiLock, FiUser } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import bg from "../../../assets/LoginAndSignupPageBG.png";
import GlassCard from "../Components/GlassCard";
import { loginRegularUser } from "../../../Store/Slices/AuthSlice";

const UserLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectAttemptedRef = useRef(false);
  const { loading, isAuthenticated, userType } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    if (redirectAttemptedRef.current) return;

    if (isAuthenticated && userType === "User" && location.pathname !== "/") {
      redirectAttemptedRef.current = true;
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate, userType]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await dispatch(loginRegularUser(form)).unwrap();
      if (response?.status === false || !response?.data?.token) {
        toast.error(response?.message || "We could not sign you in. Please try again.");
        return;
      }
      toast.success(response.message || "Welcome back to ComfyStay.");
    } catch (error) {
      toast.error(typeof error === "string" ? error : "We could not sign you in. Please try again.");
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-950 px-6 py-10"
      style={{
        backgroundImage: `radial-gradient(circle at center, rgba(139, 107, 67, 0.2) 0%, rgba(17, 17, 17, 0.95) 100%), url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-700/15 blur-[120px]" />

      <GlassCard className="w-full max-w-md border-white/20 text-white">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-amber-200/80 transition-colors hover:text-white"
        >
          <FiArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <FiUser className="h-6 w-6" />
          </div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-400 uppercase">
            Guest Portal
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-white">
            Welcome back
          </h1>
          <p className="mt-1 text-xs text-stone-300">
            Sign in to manage your luxury stay and reservations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
              Email Address
            </label>
            <div className="relative mt-2">
              <FiMail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pr-4 pl-10 text-sm text-white placeholder:text-stone-500 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                Password
              </label>
              <Link
                to="/user/auth/forgot-password"
                className="text-xs text-amber-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-2">
              <FiLock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pr-10 pl-10 text-sm text-white placeholder:text-stone-500 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-white"
              >
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="group mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3.5 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-amber-500 hover:to-amber-600 hover:shadow-amber-500/25 disabled:opacity-60"
          >
            {loading ? "Signing you in..." : "Sign in"}
            {!loading && <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-stone-300">
          New to ComfyStay?{" "}
          <Link
            to="/user/auth/register"
            className="font-semibold text-amber-400 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </GlassCard>
    </div>
  );
};

export default UserLogin;
