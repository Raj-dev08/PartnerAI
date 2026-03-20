import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";

export default function LoginPage() {
  const { login, loading } = useAuthStore();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [serverError, setServerError] = useState("");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setServerError(""); // clear backend error on change
  };

  const validate = () => {
    const newErrors: any = {};

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email";
    }

    if (form.password.length < 4) {
      newErrors.password = "Password must be at least 4 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    const res = await login(form);

    if (!res) {
      setServerError("Invalid credentials");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-neutral-950 text-white overflow-hidden px-4">

      {/* GRID */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-20">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border border-white/10" />
          ))}
        </div>
      </div>

      {/* LIGHT */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[120vw] h-[120vh] bg-linear-to-bl from-white/35 via-purple-500/15 to-transparent blur-[120px] opacity-60" />
      </div>

      {/* CARD */}
      <div className="relative w-full max-w-md sm:max-w-lg mx-2">

        {/* glow border */}
        <div className="absolute inset-0 rounded-2xl bg-linear-to-tr from-transparent via-white/20 to-white/40 opacity-60 blur-md" />

        <div className="relative p-6 sm:p-8 rounded-2xl bg-neutral-900/70 backdrop-blur-xl border border-neutral-800 shadow-2xl">

          {/* Heading */}
          <div className="mb-6 text-center">
            <h1 className="text-xl sm:text-2xl font-heading font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm font-body text-neutral-400 mt-1">
              continue your connection
            </p>
          </div>

          {/* 🔴 SERVER ERROR */}
          {serverError && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg text-center">
              {serverError}
            </div>
          )}

          <div className="space-y-3 sm:space-y-4 font-body">

            {/* EMAIL */}
            <div>
              <input
                name="email"
                placeholder="Email"
                type="email"
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg bg-neutral-800 border ${
                  errors.email ? "border-red-500" : "border-neutral-700"
                } focus:outline-none focus:ring-1 ${
                  errors.email ? "focus:ring-red-500" : "focus:ring-neutral-500"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <input
                name="password"
                placeholder="Password"
                type="password"
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg bg-neutral-800 border ${
                  errors.password ? "border-red-500" : "border-neutral-700"
                } focus:outline-none focus:ring-1 ${
                  errors.password ? "focus:ring-red-500" : "focus:ring-neutral-500"
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>


            <div className="text-center m-1 font-body">
                <p className="text-base-content/60">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-blue-500 hover:underline">
                    Sign Up
                  </Link>
                </p>
              </div>

          </div>
        </div>
      </div>
    </div>
  );
}