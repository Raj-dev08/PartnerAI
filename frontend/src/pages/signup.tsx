import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";



export default function SignupPage() {
  const { sendOtp, verifyOtp, loading } = useAuthStore();

  const [step, setStep] = useState<"form" | "otp">("form");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    birthday: "",
    gender: "male",
    expoPushToken: "",
  });

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState<any>({});

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors: any = {};

    if (form.name.length < 1) {
      newErrors.name = "Name is required";
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (form.password.length < 4) {
      newErrors.password = "Password must be at least 4 characters";
    }

    const today = new Date();
    const selected = new Date(form.birthday);

    if (!form.birthday) {
      newErrors.birthday = "Birthday required";
    } else if (selected >= today) {
      newErrors.birthday = "Invalid birthday";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validate()) return;

    const success = await sendOtp(form);
    if (success) setStep("otp");
  };

  const handleVerifyOtp = async () => {
    const finalOtp = otp.join("");
    await verifyOtp({ email: form.email, otp: finalOtp });
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (e: any, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleOtpPaste = (e: any) => {
    const paste = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(paste)) return;

    const newOtp = paste.split("").slice(0, 6);
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill("")]);
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

        <div className="absolute inset-0 rounded-2xl bg-linear-to-tr from-transparent via-white/20 to-white/40 opacity-60 blur-md" />

        <div className="relative p-6 sm:p-8 rounded-2xl bg-neutral-900/70 backdrop-blur-xl border border-neutral-800 shadow-2xl">

          {/* Heading */}
          <div className="mb-6 text-center">
            <h1 className="text-xl sm:text-2xl font-heading font-semibold tracking-tight">
              Create your account
            </h1>
            <p className="text-xs sm:text-sm font-body text-neutral-400 mt-1">
              to get started
            </p>
          </div>

          {step === "form" && (
            <div className="space-y-3 sm:space-y-4 font-body">

              {/* NAME */}
              <div>
                <input
                  name="name"
                  placeholder="Name"
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg bg-neutral-800 border ${
                    errors.name ? "border-red-500" : "border-neutral-700"
                  } focus:outline-none focus:ring-1 ${
                    errors.name ? "focus:ring-red-500" : "focus:ring-neutral-500"
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

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

              {/* BIRTHDAY */}
              <div>
                <input
                  name="birthday"
                  type="date"
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg bg-neutral-800 border ${
                    errors.birthday ? "border-red-500" : "border-neutral-700"
                  } focus:outline-none`}
                />
                {errors.birthday && (
                  <p className="text-red-500 text-xs mt-1">{errors.birthday}</p>
                )}
              </div>

              <select
                name="gender"
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition"
              >
                {loading ? "Sending..." : "Continue"}
              </button>

              <div className="text-center m-1 font-body">
                <p className="text-base-content/60">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-500 hover:underline">
                    Log In
                  </Link>
                </p>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-5">

              {/* OTP BOXES */}
              <div
                onPaste={handleOtpPaste}
                className="flex justify-center gap-2 sm:gap-3"
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-semibold rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.join("").length !== 6}
                className="w-full py-2.5 rounded-lg bg-white text-black font-medium hover:bg-neutral-200 transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Create"}
              </button>

              <p className="text-xs text-neutral-500 text-center">
                Code sent to {form.email} • expires in 5 minutes
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}