import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiMail, FiLock, FiEye, FiEyeOff, FiBriefcase, FiKey } from "react-icons/fi";
import toast from "react-hot-toast";
import GlassCard from "./GlassCard";
import { loginHotelEmployee, changeEmployeePasswordThunk } from "../../../Store/Slices/AuthSlice";

export const ManagerLoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectAttemptedRef = useRef(false);
  const dispatch = useDispatch();
  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [changePassForm, setChangePassForm] = useState({ oldPassword: "", newPassword: "" });

  useEffect(() => {
    if (redirectAttemptedRef.current) return;

    if (isAuthenticated && location.pathname !== "/") {
      redirectAttemptedRef.current = true;
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await dispatch(loginHotelEmployee(form)).unwrap();
      if (response?.status === false) {
        toast.error(response?.message || "Invalid credentials.");
        return;
      }
      if (response?.mustChangePassword) {
        toast.success("Logged in with default password. Please set a new password.");
        setMustChangePassword(true);
        setChangePassForm({ oldPassword: form.password, newPassword: "" });
      } else {
        toast.success(response?.message || "Welcome back to Hotel Staff Portal.");
        navigate("/");
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Employee login failed.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const response = await dispatch(changeEmployeePasswordThunk(changePassForm)).unwrap();
      if (response?.status) {
        toast.success("Password changed successfully! Please sign in again.");
        setMustChangePassword(false);
        setForm({ email: "", password: "" });
      } else {
        toast.error(response?.message || "Failed to change password.");
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to change password.");
    }
  };

  if (mustChangePassword) {
    return (
      <GlassCard className="w-full max-w-md border-amber-500/20 text-white">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <FiKey className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-white">Change Default Password</h2>
          <p className="mt-1 text-xs text-stone-300">
            For security, please update your account password before proceeding.
          </p>
        </div>

        <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
              Current / Default Password
            </label>
            <input
              required
              type="password"
              value={changePassForm.oldPassword}
              onChange={(e) => setChangePassForm((prev) => ({ ...prev, oldPassword: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 py-3 px-4 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
              New Password (Min 6 characters)
            </label>
            <input
              required
              minLength={6}
              type="password"
              value={changePassForm.newPassword}
              onChange={(e) => setChangePassForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Enter new strong password"
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 py-3 px-4 text-sm text-white outline-none focus:border-amber-500"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text-sm font-medium text-white shadow-lg transition-all hover:from-amber-500 hover:to-amber-600"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full max-w-md border-amber-500/20 text-white">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-amber-200/80 transition-colors hover:text-white"
      >
        <FiArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <FiBriefcase className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-white">
          Hotel Manager & Staff Portal
        </h2>
        <p className="mt-1 text-xs text-stone-300">
          Sign in to access property management, rooms, and bookings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
            Employee Email
          </label>
          <div className="relative mt-2">
            <FiMail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="manager@hotel.com"
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
              to="/employee/auth/forgot-password"
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
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
              className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pr-10 pl-10 text-sm text-white placeholder:text-stone-500 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-white"
            >
              {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-amber-500 hover:to-amber-600 hover:shadow-amber-500/25 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Staff Portal Login"}
        </button>
      </form>
    </GlassCard>
  );
};

export default ManagerLoginForm;
