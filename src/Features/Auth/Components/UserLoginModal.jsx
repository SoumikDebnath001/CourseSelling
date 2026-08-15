import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiX,
  FiShield,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiKey,
  FiUserCheck,
} from "react-icons/fi";

import {
  loginAdmin,
  verifyAdminOtp,
  loginHotelAdminThunk,
  changeAdminPasswordThunk,
} from "../../../Store/Slices/AuthSlice";

const RESEND_COOLDOWN_SECONDS = 60;

const UserLoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectAttemptedRef = useRef(false);
  const dispatch = useDispatch();

  const {
    loginLoading,
    otpLoading,
    loading,
    isAuthenticated,
  } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("superadmin");
  const [step, setStep] = useState("credentials");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [changePassForm, setChangePassForm] = useState({
    oldPassword: "",
    newPassword: "",
  });

  /* =====================================================
     CLOSE ON AUTHENTICATION
  ===================================================== */

  useEffect(() => {
    if (redirectAttemptedRef.current) return;

    if (isAuthenticated && location.pathname !== "/") {
      redirectAttemptedRef.current = true;
      onClose?.();
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate, onClose]);

  /* =====================================================
     OTP TIMER
  ===================================================== */

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  /* =====================================================
     ESCAPE KEY
  ===================================================== */

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  /* =====================================================
     BODY SCROLL LOCK
  ===================================================== */

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  /* =====================================================
     RESET MODAL
  ===================================================== */

  const resetModal = () => {
    setStep("credentials");
    setActiveTab("superadmin");
    setLoginForm({
      email: "",
      password: "",
    });
    setOtp("");
    setShowPassword(false);
    setResendCooldown(0);
    setChangePassForm({
      oldPassword: "",
      newPassword: "",
    });
  };

  const handleClose = () => {
    resetModal();
    onClose?.();
  };

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     LOGIN
  ===================================================== */

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === "superadmin") {
      try {
        const data = await dispatch(
          loginAdmin(loginForm)
        ).unwrap();

        if (data?.status) {
          toast.success(
            data?.message || "2FA OTP sent to your email"
          );

          setResendCooldown(
            RESEND_COOLDOWN_SECONDS
          );

          setStep("otp");
        } else {
          toast.error(
            data?.message || "Unable to send OTP"
          );
        }
      } catch (error) {
        toast.error(
          typeof error === "string"
            ? error
            : error?.message || "Super Admin login failed"
        );
      }

      return;
    }

    /* HOTEL ADMIN */

    try {
      const data = await dispatch(
        loginHotelAdminThunk(loginForm)
      ).unwrap();

      if (data?.status) {
        if (data?.mustChangePassword) {
          toast.success(
            "Logged in with default password. Please update your password."
          );

          setChangePassForm({
            oldPassword: loginForm.password,
            newPassword: "",
          });

          setStep("mustChangePassword");
        } else {
          toast.success(
            data?.message ||
              "Hotel Admin logged in successfully!"
          );

          handleClose();
          navigate("/");
        }
      } else {
        toast.error(
          data?.message || "Hotel Admin login failed"
        );
      }
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Hotel Admin login failed"
      );
    }
  };

  /* =====================================================
     RESEND OTP
  ===================================================== */

  const handleResendOtp = async () => {
    if (
      resendCooldown > 0 ||
      loginLoading ||
      otpLoading
    ) {
      return;
    }

    try {
      const data = await dispatch(
        loginAdmin(loginForm)
      ).unwrap();

      if (data?.status) {
        toast.success(
          data?.message || "OTP resent successfully"
        );

        setResendCooldown(
          RESEND_COOLDOWN_SECONDS
        );
      } else {
        toast.error(
          data?.message || "Unable to resend OTP"
        );
      }
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : "Unable to resend OTP"
      );
    }
  };

  /* =====================================================
     VERIFY OTP
  ===================================================== */

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error(
        "Please enter a valid 6-digit OTP code"
      );
      return;
    }

    try {
      const data = await dispatch(
        verifyAdminOtp({
          email: loginForm.email,
          otp,
        })
      ).unwrap();

      if (data?.status) {
        toast.success(
          data?.message ||
            "Super Admin authenticated successfully!"
        );

        handleClose();
        navigate("/");
      } else {
        toast.error(
          data?.message || "Invalid OTP code"
        );
      }
    } catch (error) {
      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "OTP verification failed"
      );
    }
  };

  /* =====================================================
     CHANGE PASSWORD
  ===================================================== */

  const handleChangePassword = async (e) => {
    e.preventDefault();

    try {
      const response = await dispatch(
        changeAdminPasswordThunk(changePassForm)
      ).unwrap();

      if (response?.status) {
        toast.success(
          "Password changed successfully! Please log in again."
        );

        setStep("credentials");

        setLoginForm({
          email: "",
          password: "",
        });
      } else {
        toast.error(
          response?.message ||
            "Failed to update password."
        );
      }
    } catch (err) {
      toast.error(
        typeof err === "string"
          ? err
          : "Failed to update password."
      );
    }
  };

  /* =====================================================
     MODAL CLOSED
  ===================================================== */

  if (!isOpen) {
    return null;
  }

  /* =====================================================
     MODAL
  ===================================================== */

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        bg-black/60
        px-4
        py-8
        backdrop-blur-md
      "
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* =================================================
          MODAL CONTAINER
      ================================================= */}

      <div
        className="
          relative
          w-full
          max-w-md
          overflow-hidden
          rounded-3xl
          border
          border-white/15
          bg-black/45
          shadow-[0_30px_100px_rgba(0,0,0,0.55)]
          backdrop-blur-2xl
          backdrop-saturate-150
        "
      >

        {/* GOLD GLOW */}

        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-48
            w-48
            rounded-full
            bg-amber-500/10
            blur-[70px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-24
            -left-24
            h-48
            w-48
            rounded-full
            bg-teal-500/10
            blur-[70px]
          "
        />

        {/* =================================================
            CLOSE BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={handleClose}
          className="
            absolute
            right-4
            top-4
            z-20
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            border
            border-white/10
            bg-white/5
            text-white/60
            backdrop-blur-md
            transition-all
            hover:border-white/20
            hover:bg-white/10
            hover:text-white
          "
        >
          <FiX className="h-4 w-4" />
        </button>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="relative z-10 p-6 sm:p-8">

          {/* =================================================
              CHANGE PASSWORD
          ================================================= */}

          {step === "mustChangePassword" && (
            <>
              <div className="text-center">

                <div
                  className="
                    mx-auto
                    mb-4
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-amber-500/30
                    bg-amber-500/10
                    text-amber-400
                  "
                >
                  <FiKey className="h-6 w-6" />
                </div>

                <h2 className="font-serif text-2xl font-semibold text-white">
                  Change Admin Password
                </h2>

                <p className="mt-2 text-xs leading-5 text-stone-300">
                  You are logged in with a default password.
                  Set a new password to secure your account.
                </p>

              </div>

              <form
                onSubmit={handleChangePassword}
                className="mt-6 space-y-4"
              >

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                    Current Default Password
                  </label>

                  <input
                    required
                    type="password"
                    value={changePassForm.oldPassword}
                    onChange={(e) =>
                      setChangePassForm((prev) => ({
                        ...prev,
                        oldPassword: e.target.value,
                      }))
                    }
                    className="
                      mt-2
                      w-full
                      rounded-xl
                      border
                      border-white/15
                      bg-black/40
                      px-4
                      py-3
                      text-sm
                      text-white
                      outline-none
                      focus:border-amber-500
                    "
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                    New Password
                  </label>

                  <input
                    required
                    minLength={6}
                    type="password"
                    value={changePassForm.newPassword}
                    onChange={(e) =>
                      setChangePassForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter new strong password"
                    className="
                      mt-2
                      w-full
                      rounded-xl
                      border
                      border-white/15
                      bg-black/40
                      px-4
                      py-3
                      text-sm
                      text-white
                      outline-none
                      focus:border-amber-500
                    "
                  />
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className="
                    w-full
                    rounded-xl
                    bg-gradient-to-r
                    from-amber-600
                    to-amber-700
                    py-3
                    text-sm
                    font-medium
                    text-white
                    shadow-lg
                    transition-all
                    hover:from-amber-500
                    hover:to-amber-600
                    disabled:opacity-50
                  "
                >
                  {loading
                    ? "Updating..."
                    : "Update & Continue"}
                </button>

              </form>
            </>
          )}

          {/* =================================================
              OTP
          ================================================= */}

          {step === "otp" && (
            <>
              <div className="text-center">

                <div
                  className="
                    mx-auto
                    mb-4
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-amber-500/30
                    bg-amber-500/10
                    text-amber-400
                  "
                >
                  <FiShield className="h-6 w-6" />
                </div>

                <h2 className="font-serif text-2xl font-semibold text-white">
                  Verify Your Identity
                </h2>

                <p className="mt-2 text-xs leading-5 text-stone-300">
                  Enter the 6-digit authentication code
                  sent to{" "}
                  <span className="font-semibold text-amber-300">
                    {loginForm.email}
                  </span>
                </p>

              </div>

              <form
                onSubmit={handleOtpSubmit}
                className="mt-6 space-y-4"
              >

                <div>

                  <label className="block text-center text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                    One-Time Password
                  </label>

                  <input
                    autoFocus
                    maxLength={6}
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    placeholder="••••••"
                    className="
                      mt-3
                      w-full
                      rounded-xl
                      border
                      border-white/20
                      bg-black/50
                      py-4
                      text-center
                      font-mono
                      text-2xl
                      tracking-[0.5em]
                      text-amber-300
                      outline-none
                      focus:border-amber-500
                      focus:ring-2
                      focus:ring-amber-500/20
                    "
                  />

                </div>

                <button
                  disabled={
                    otpLoading || otp.length !== 6
                  }
                  type="submit"
                  className="
                    w-full
                    rounded-xl
                    bg-gradient-to-r
                    from-amber-600
                    to-amber-700
                    py-3
                    text-sm
                    font-medium
                    text-white
                    shadow-lg
                    transition-all
                    hover:from-amber-500
                    hover:to-amber-600
                    disabled:opacity-50
                  "
                >
                  {otpLoading
                    ? "Verifying..."
                    : "Verify & Continue"}
                </button>

              </form>

              <div className="mt-5 flex items-center justify-between text-xs text-stone-400">

                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setOtp("");
                  }}
                  className="transition-colors hover:text-white"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  disabled={
                    resendCooldown > 0 ||
                    loginLoading
                  }
                  onClick={handleResendOtp}
                  className="
                    font-medium
                    text-amber-400
                    hover:underline
                    disabled:opacity-50
                  "
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend Code"}
                </button>

              </div>
            </>
          )}

          {/* =================================================
              CREDENTIALS
          ================================================= */}

          {step === "credentials" && (
            <>
              <div className="mb-6 text-center">

                <div
                  className="
                    mx-auto
                    mb-4
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-amber-500/30
                    bg-amber-500/10
                    text-amber-400
                  "
                >
                  {activeTab === "superadmin" ? (
                    <FiShield className="h-6 w-6" />
                  ) : (
                    <FiUserCheck className="h-6 w-6" />
                  )}
                </div>

                <h2 className="font-serif text-2xl font-semibold text-white">
                  {activeTab === "superadmin"
                    ? "Super Admin Portal"
                    : "Hotel Admin Portal"}
                </h2>

                <p className="mt-1 text-xs text-stone-300">
                  {activeTab === "superadmin"
                    ? "Secure access with 2FA verification"
                    : "Sign in with your property credentials"}
                </p>

              </div>

              {/* ROLE TABS */}

              <div
                className="
                  mb-6
                  flex
                  rounded-xl
                  border
                  border-white/10
                  bg-black/40
                  p-1
                "
              >

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab("superadmin")
                  }
                  className={`
                    flex-1
                    rounded-lg
                    py-2
                    text-xs
                    font-semibold
                    transition-all
                    ${
                      activeTab === "superadmin"
                        ? "bg-amber-600 text-white shadow-md"
                        : "text-stone-400 hover:text-white"
                    }
                  `}
                >
                  Super Admin
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab("admin")
                  }
                  className={`
                    flex-1
                    rounded-lg
                    py-2
                    text-xs
                    font-semibold
                    transition-all
                    ${
                      activeTab === "admin"
                        ? "bg-amber-600 text-white shadow-md"
                        : "text-stone-400 hover:text-white"
                    }
                  `}
                >
                  Hotel Admin
                </button>

              </div>

              {/* LOGIN FORM */}

              <form
                onSubmit={handleCredentialsSubmit}
                className="space-y-4"
              >

                {/* EMAIL */}

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                    Email Address
                  </label>

                  <div className="relative mt-2">

                    <FiMail
                      className="
                        absolute
                        left-3.5
                        top-1/2
                        h-4
                        w-4
                        -translate-y-1/2
                        text-stone-400
                      "
                    />

                    <input
                      required
                      type="email"
                      name="email"
                      value={loginForm.email}
                      onChange={handleChange}
                      placeholder={
                        activeTab === "superadmin"
                          ? "superadmin@comfystay.com"
                          : "admin@hotel.com"
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-white/15
                        bg-black/40
                        py-3
                        pr-4
                        pl-10
                        text-sm
                        text-white
                        placeholder:text-stone-500
                        outline-none
                        transition-all
                        focus:border-amber-500
                        focus:ring-2
                        focus:ring-amber-500/20
                      "
                    />

                  </div>
                </div>

                {/* PASSWORD */}

                <div>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/90">
                    Password
                  </label>

                  <div className="relative mt-2">

                    <FiLock
                      className="
                        absolute
                        left-3.5
                        top-1/2
                        h-4
                        w-4
                        -translate-y-1/2
                        text-stone-400
                      "
                    />

                    <input
                      required
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={loginForm.password}
                      onChange={handleChange}
                      placeholder="Enter admin password"
                      className="
                        w-full
                        rounded-xl
                        border
                        border-white/15
                        bg-black/40
                        py-3
                        pr-10
                        pl-10
                        text-sm
                        text-white
                        placeholder:text-stone-500
                        outline-none
                        transition-all
                        focus:border-amber-500
                        focus:ring-2
                        focus:ring-amber-500/20
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      className="
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        text-stone-400
                        hover:text-white
                      "
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-4 w-4" />
                      ) : (
                        <FiEye className="h-4 w-4" />
                      )}
                    </button>

                  </div>
                </div>

                {/* SUBMIT */}

                <button
                  disabled={
                    loginLoading || loading
                  }
                  type="submit"
                  className="
                    w-full
                    rounded-xl
                    bg-gradient-to-r
                    from-amber-600
                    to-amber-700
                    py-3
                    text-sm
                    font-medium
                    text-white
                    shadow-lg
                    transition-all
                    duration-300
                    hover:from-amber-500
                    hover:to-amber-600
                    hover:shadow-amber-500/25
                    disabled:opacity-60
                  "
                >
                  {loginLoading || loading
                    ? "Authenticating..."
                    : activeTab === "superadmin"
                    ? "Send 2FA Code"
                    : "Login as Hotel Admin"}
                </button>

              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserLoginModal;