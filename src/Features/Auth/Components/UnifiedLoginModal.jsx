import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiUser, FiBriefcase, FiMail, FiLock, FiEye, FiEyeOff, FiKey } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import GlassCard from "./GlassCard";
import { loginRegularUser, loginHotelEmployee, changeEmployeePasswordThunk } from "../../../Store/Slices/AuthSlice";

const UnifiedLoginModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectAttemptedRef = useRef(false);
  const { loading, isAuthenticated } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("user"); // 'user' or 'manager'
  
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  
  // Manager-specific states
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [changePassForm, setChangePassForm] = useState({ oldPassword: "", newPassword: "" });

  useEffect(() => {
    if (redirectAttemptedRef.current) return;

    if (isAuthenticated && location.pathname !== "/") {
      redirectAttemptedRef.current = true;
      onClose();
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setForm({ email: "", password: "" });
      setMustChangePassword(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setForm({ email: "", password: "" });
    setMustChangePassword(false);
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await dispatch(loginRegularUser(form)).unwrap();
      if (response?.status === false || !response?.data?.token) {
        toast.error(response?.message || "We could not sign you in. Please try again.");
        return;
      }
      toast.success(response.message || "Welcome back to ComfyStay.");
      onClose();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "We could not sign you in. Please try again.");
    }
  };

  const handleManagerLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await dispatch(loginHotelEmployee(form)).unwrap();
      if (response?.status === false) {
        toast.error(response?.message || "Invalid manager credentials.");
        return;
      }
      if (response?.mustChangePassword) {
        toast.success("Logged in with default password. Please update your password.");
        setMustChangePassword(true);
        setChangePassForm({ oldPassword: form.password, newPassword: "" });
      } else {
        toast.success(response?.message || "Welcome back to Manager Portal.");
        onClose();
        navigate("/");
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Hotel Manager login failed.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const response = await dispatch(changeEmployeePasswordThunk(changePassForm)).unwrap();
      if (response?.status) {
        toast.success("Password updated successfully! Please log in.");
        setMustChangePassword(false);
        setForm({ email: "", password: "" });
      } else {
        toast.error(response?.message || "Failed to update password.");
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Failed to update password.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-black/45 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150"
        >
          {/* Decorative Glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-amber-500/10 blur-[70px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-teal-500/10 blur-[70px]" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <FiX className="h-4 w-4" />
          </button>

          <div className="relative z-10 p-6 sm:p-8">
            {/* Tabs */}
            {!mustChangePassword && (
              <div className="mb-6 flex space-x-2 rounded-xl bg-black/40 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleTabSwitch("user")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                    activeTab === "user"
                      ? "bg-amber-500/20 text-amber-400 shadow-sm border border-amber-500/30"
                      : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
                  }`}
                >
                  <FiUser className="h-4 w-4" /> Guest
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch("manager")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                    activeTab === "manager"
                      ? "bg-amber-500/20 text-amber-400 shadow-sm border border-amber-500/30"
                      : "text-stone-400 hover:text-stone-200 hover:bg-white/5"
                  }`}
                >
                  <FiBriefcase className="h-4 w-4" /> Manager
                </button>
              </div>
            )}

            {/* Content */}
            {mustChangePassword ? (
              <div className="animate-in fade-in zoom-in duration-300">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <FiKey className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-white">
                    Update Default Password
                  </h3>
                  <p className="mt-1 text-xs text-stone-300">
                    First-time manager login requires setting a custom password.
                  </p>
                </div>

                <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                      Default Password
                    </label>
                    <input
                      required
                      type="password"
                      value={changePassForm.oldPassword}
                      onChange={(e) =>
                        setChangePassForm((prev) => ({ ...prev, oldPassword: e.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 py-3 px-4 text-sm text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                      New Password (Min 6 chars)
                    </label>
                    <input
                      required
                      minLength={6}
                      type="password"
                      value={changePassForm.newPassword}
                      onChange={(e) =>
                        setChangePassForm((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      placeholder="Enter new password"
                      className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 py-3 px-4 text-sm text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text-sm font-medium text-white shadow-lg transition-all hover:from-amber-500 hover:to-amber-600 disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update Password & Continue"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="text-center mb-6">
                  <h3 className="font-serif text-2xl font-semibold text-white">
                    {activeTab === "user" ? "Guest Portal" : "Manager Portal"}
                  </h3>
                  <p className="mt-1 text-xs text-stone-300">
                    {activeTab === "user" 
                      ? "Sign in to manage your luxury stay and reservations"
                      : "Enter your credentials to access management tools"}
                  </p>
                </div>

                <form onSubmit={activeTab === "user" ? handleUserLogin : handleManagerLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                      Email Address
                    </label>
                    <div className="relative mt-2">
                      <FiMail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder={activeTab === "user" ? "you@example.com" : "manager@hotel.com"}
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
                        to={activeTab === "user" ? "/user/auth/forgot-password" : "/employee/auth/forgot-password"}
                        onClick={onClose}
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
                    className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 mt-2 text-sm font-medium text-white shadow-lg transition-all hover:from-amber-500 hover:to-amber-600 disabled:opacity-60"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </form>

                {activeTab === "user" && (
                  <p className="mt-6 text-center text-xs text-stone-300">
                    New to ComfyStay?{" "}
                    <Link
                      to="/user/auth/register"
                      onClick={onClose}
                      className="font-semibold text-amber-400 hover:underline"
                    >
                      Create an account
                    </Link>
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UnifiedLoginModal;
