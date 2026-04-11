import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function AccountPage() {
  const {
    user,
    disableAccount,
    enableAccount,
    deleteAccount,
    logout,
    changePassword,
    loading,
  } = useAuthStore();

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [serverErrorField, setServerErrorField] = useState<"currentPassword" | "newPassword" | null>(null);
  const [serverErrorMessage, setServerErrorMessage] = useState("");

  // ---------------- HANDLERS ----------------

  const handleDelete = async () => {
    if (!window.confirm("Delete your account permanently?")) return;
    const success = await deleteAccount();
    if (success) navigate("/signup");
  };

  const handleDisable = async () => {
    if (!window.confirm("Disable your account?")) return;
    const success = await disableAccount();
    if (success) navigate("/login");
  };

  const handleEnable = async () => {
    const success = await enableAccount();
    if (success) navigate("/");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const validatePassword = () => {
    const newErrors: any = {};

    if (!form.currentPassword) {
      newErrors.currentPassword = "Current password required";
    }

    if (form.newPassword.length < 4) {
      newErrors.newPassword = "Minimum 4 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    setServerErrorField(null);
    setServerErrorMessage("");

    if (!validatePassword()) return;

    const success = await changePassword(form);

    if (success) {
      setForm({ currentPassword: "", newPassword: "" });
      setShowPassword(false);
    } else {
      // default → assume wrong current password
      setServerErrorField("currentPassword");
      setServerErrorMessage("Current password is incorrect");
    }
  };

  // ---------------- UI ----------------

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-10 font-body">
      <div className="max-w-xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Account</h1>
          <p className="text-sm text-neutral-500">
            Manage your settings
          </p>
        </div>

        {/* USER CARD */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
          <div>
            <p className="text-xs text-neutral-500">Name</p>
            <p className="text-base font-medium">{user?.name}</p>
          </div>

          <div>
            <p className="text-xs text-neutral-500">Email</p>
            <p className="text-base font-medium">{user?.email}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">Subscription</p>
              <p className="text-base font-medium">
                {user?.isPaid ? "Active Plan" : "Free Plan"}
              </p>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-full border ${
                user?.isPaid
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
              }`}
            >
              {user?.isPaid ? "Active" : "Free"}
            </span>
          </div>

          {/* ACTION BUTTON */}
          {user?.isPaid ? (
            <button
              onClick={() => navigate("/subscription-plans")}
              className="w-full py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-sm hover:bg-neutral-700 transition active:scale-[0.98]"
            >
              Manage / Renew Subscription
            </button>
          ) : (
            <button
              onClick={() => navigate("/subscription-plans")}
              className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]"
            >
              Upgrade to Pro
            </button>
          )}
        </div>

        {/* CHANGE PASSWORD */}
        <div className="space-y-3">
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="w-full text-sm text-neutral-400 hover:text-white transition bg-neutral-900 p-4 rounded-xl border border-neutral-800 text-left"
          >
            {showPassword ? "Hide password settings" : "Change password"}
          </button>

          {showPassword && (
            <div className="space-y-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">

              {/* CURRENT PASSWORD */}
              <div>
                <input
                  type="password"
                  placeholder="Current password"
                  value={form.currentPassword}
                  onChange={(e) =>
                    setForm({ ...form, currentPassword: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg bg-neutral-800 border ${
                    errors.currentPassword || serverErrorField === "currentPassword"
                      ? "border-red-500"
                      : "border-neutral-700"
                  } focus:outline-none focus:ring-1 ${
                    errors.currentPassword || serverErrorField === "currentPassword"
                      ? "focus:ring-red-500"
                      : "focus:ring-neutral-500"
                  }`}
                />
                {(errors.currentPassword || serverErrorField === "currentPassword") && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.currentPassword || serverErrorMessage}
                  </p>
                )}
              </div>

              {/* NEW PASSWORD */}
              <div>
                <input
                  type="password"
                  placeholder="New password"
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm({ ...form, newPassword: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 rounded-lg bg-neutral-800 border ${
                    errors.newPassword || serverErrorField === "newPassword"
                      ? "border-red-500"
                      : "border-neutral-700"
                  } focus:outline-none focus:ring-1 ${
                    errors.newPassword || serverErrorField === "newPassword"
                      ? "focus:ring-red-500"
                      : "focus:ring-neutral-500"
                  }`}
                />
                {(errors.newPassword || serverErrorField === "newPassword") && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.newPassword || serverErrorMessage}
                  </p>
                )}
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          )}
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="space-y-3">

          {user?.isDisabled ? (
            <button
              onClick={handleEnable}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]"
            >
              Enable Account
            </button>
          ) : (
            <button
              onClick={handleDisable}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-sm hover:bg-neutral-700 transition active:scale-[0.98]"
            >
              Disable Account
            </button>
          )}

          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-sm hover:bg-neutral-800 transition active:scale-[0.98]"
          >
            Logout
          </button>
        </div>

        {/* DANGER ZONE */}
        <div className="pt-6 border-t border-neutral-900 space-y-3">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            Danger Zone
          </p>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full py-2.5 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition active:scale-[0.98]"
          >
            Delete Account
          </button>
        </div>

      </div>
    </div>
  );
}