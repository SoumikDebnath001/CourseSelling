import { useState } from "react";
import toast from "react-hot-toast";
import { registerSuperAdmin } from "../../../Services/auth.service";

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
    <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5">
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c7 0 10.5 7 10.5 7a13.4 13.4 0 0 1-3.1 4.05M6.5 6.6C3.4 8.5 1.5 12 1.5 12s3.5 7 10.5 7c1.36 0 2.6-.26 3.71-.7" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

const SigninForm = ({ onSwitchToLogin }) => {
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
//=======================================================================  Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
//=======================================================================  Handle Submit Function
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { data, error } = await registerSuperAdmin(registerForm);

      if (error) {
        toast.error(error);
        setLoading(false);
        return;
      }

      if (data?.status) {
        toast.success(data.message);
        setLoading(false);
        setRegisterForm({
          name: "",
          email: "",
          password: "",
        });

        onSwitchToLogin();
      } else {
        toast.error(data?.message);
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      setLoading(false);
    }
  };
//=======================================================================  Render
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-stone-800">Create your account</h2>
        <p className="text-sm text-stone-500">Start managing your hotel in minutes.</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-stone-700">Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            required
            value={registerForm.name}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/40 bg-white/20 px-3.5 py-3 text-[14.5px] text-stone-800 placeholder:text-stone-500 outline-none transition-all duration-300 focus:border-amber-700 focus:bg-white/40 focus:ring-4 focus:ring-amber-700/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-stone-700">Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            value={registerForm.email}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/40 bg-white/20 px-3.5 py-3 text-[14.5px] text-stone-800 placeholder:text-stone-500 outline-none transition-all duration-300 focus:border-amber-700 focus:bg-white/40 focus:ring-4 focus:ring-amber-700/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-stone-700">Password</label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              required
              value={registerForm.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/40 bg-white/20 py-3 pr-11 pl-3.5 text-[14.5px] text-stone-800 placeholder:text-stone-500 outline-none transition-all duration-300 focus:border-amber-700 focus:bg-white/40 focus:ring-4 focus:ring-amber-700/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2.5 flex cursor-pointer items-center justify-center rounded-md border-none bg-transparent p-1 text-stone-600 transition-colors duration-200 hover:text-stone-900"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full cursor-pointer rounded-xl border-none bg-amber-800 py-3 text-[15px] font-semibold text-amber-50 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p className="text-center text-[13.5px] text-stone-500">
        Already have an account?
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="ml-1 cursor-pointer border-none bg-transparent font-semibold text-amber-800 transition-colors duration-200 hover:text-amber-950 hover:underline"
        >
          Login
        </button>
      </p>
    </div>
  );
};

export default SigninForm;
