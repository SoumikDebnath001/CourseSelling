import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiBriefcase, FiMail, FiLock, FiEye, FiEyeOff, FiKey } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import GlassCard from "./GlassCard";
import { loginHotelEmployee, changeEmployeePasswordThunk } from "../../../Store/Slices/AuthSlice";

export const ManagerLoginModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [changePassForm, setChangePassForm] = useState({ oldPassword: "", newPassword: "" });

  const handleSubmit = async (e) => {
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md"
        >
          <GlassCard className="border-amber-500/30 bg-stone-900/90 text-white shadow-2xl">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 rounded-full p-2 text-stone-400 hover:bg-white/10 hover:text-white"
            >
              <FiX className="h-5 w-5" />
            </button>

            {mustChangePassword ? (
              <div>
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
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
                    className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text-sm font-medium text-white shadow-lg transition-all hover:from-amber-500 hover:to-amber-600"
                  >
                    {loading ? "Updating..." : "Update Password & Continue"}
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <FiBriefcase className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-white">
                    Hotel Manager Login
                  </h3>
                  <p className="mt-1 text-xs text-stone-300">
                    Enter your manager credentials to access room & booking management
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                      Manager Email
                    </label>
                    <div className="relative mt-2">
                      <FiMail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, email: e.target.value }))
                        }
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
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="Enter password"
                        className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pr-10 pl-10 text-sm text-white placeholder:text-stone-500 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-white"
                      >
                        {showPassword ? (
                          <FiEyeOff className="h-4 w-4" />
                        ) : (
                          <FiEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-amber-500 hover:to-amber-600 hover:shadow-amber-500/25 disabled:opacity-60"
                  >
                    {loading ? "Signing in..." : "Manager Login"}
                  </button>
                </form>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ManagerLoginModal;
