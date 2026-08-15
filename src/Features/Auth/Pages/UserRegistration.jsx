import React, { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiArrowUpRight, FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiPhone } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import bg from "../../../assets/LoginAndSignupPageBG.png";
import CatMovement from "../../../assets/LoginSignUpPage/Cat Movement.svg";
import GlassCard from "../Components/GlassCard";
import { registerRegularUser } from "../../../Store/Slices/AuthSlice";

const UserRegistration = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectAttemptedRef = useRef(false);
  const { loading, isAuthenticated, userType } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstMiddleName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });

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
      const payload = {
        firstMiddleName: form.firstMiddleName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        contact: {
          phone: form.phone,
          email: form.email,
        },
      };

      const response = await dispatch(registerRegularUser(payload)).unwrap();
      if (response?.status === false) {
        toast.error(response?.message || "We could not create your account. Please try again.");
        return;
      }
      toast.success(response?.message || "Your account is ready. Please sign in.");
      navigate("/user/auth/login", { replace: true });
    } catch (error) {
      toast.error(typeof error === "string" ? error : "We could not create your account. Please try again.");
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

      <GlassCard className="w-full max-w-5xl border-white/20 p-0 text-white overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          {/* Left Side - Image/Animation */}
          <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center bg-black/40 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-black/60 pointer-events-none"></div>
            <div className="relative z-10 text-center flex flex-col items-center justify-center">
              <h2 className="font-serif text-3xl font-bold text-amber-400 mb-4 tracking-wide">
                Join ComfyStay
              </h2>
              <p className="text-stone-300 text-sm max-w-sm mb-8 leading-relaxed">
                Experience unparalleled luxury and personalized hospitality. Register today to unlock exclusive reservations and premium services.
              </p>
              <img 
                src={CatMovement} 
                alt="Cat Animation" 
                className="w-64 h-64 object-contain filter drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-1/2 p-8 sm:p-10 lg:p-12">
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-amber-200/80 transition-colors hover:text-white"
            >
              <FiArrowLeft className="h-4 w-4" /> Back to home
            </Link>

            <div className="mb-8">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-400 uppercase">
                Guest Registration
              </p>
              <h1 className="mt-1 font-serif text-3xl font-semibold text-white">
                Create Your Account
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <div className="relative mt-2">
                    <FiUser className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      required
                      value={form.firstMiddleName}
                      onChange={(e) => setForm((c) => ({ ...c, firstMiddleName: e.target.value }))}
                      placeholder="First Name"
                      className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pr-4 pl-10 text-sm text-white placeholder:text-stone-500 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div>

                  <div className="relative mt-2">
                    <FiUser className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      required
                      value={form.lastName}
                      onChange={(e) => setForm((c) => ({ ...c, lastName: e.target.value }))}
                      placeholder="Last Name"
                      className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pr-4 pl-10 text-sm text-white placeholder:text-stone-500 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="relative mt-2">
                  <FiMail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                    placeholder="yourmail@example.com"
                    className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pr-4 pl-10 text-sm text-white placeholder:text-stone-500 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <div className="relative mt-2">
                  <FiPhone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="Phone Number"
                    className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pr-4 pl-10 text-sm text-white placeholder:text-stone-500 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                  Password (Min 8 chars)
                </label>
                <div className="relative mt-2">
                  <FiLock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    required
                    minLength={8}
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/15 bg-black/40 py-3 pr-10 pl-10 text-sm text-white placeholder:text-stone-500 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((c) => !c)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-400 hover:text-white"
                  >
                    {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="group mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3.5 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-amber-500 hover:to-amber-600 hover:shadow-amber-500/25 disabled:opacity-60"
              >
                {loading ? "Creating your account..." : "Create Account"}
                {!loading && <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-stone-300">
              Already have an account?{" "}
              <Link
                to="/user/auth/login"
                className="font-semibold text-amber-400 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default UserRegistration;
