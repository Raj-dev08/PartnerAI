import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export default function CreatePlanPage() {
  const [form, setForm] = useState({
    name: "",
    price: "",
    duration: "",
    features: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.duration || !form.features) {
      return toast.error("All fields required");
    }

    let parsedFeatures;
    try {
      parsedFeatures = JSON.parse(form.features);
      console.log(parsedFeatures)
    } catch {
      return toast.error("Features must be valid JSON");
    }

    setLoading(true);
    try {
      await axiosInstance.post("/payment/create-plan", {
        name: form.name,
        price: Number(form.price),
        duration: Number(form.duration),
        features: parsedFeatures,
      });

      toast.success("Plan created");

      setForm({
        name: "",
        price: "",
        duration: "",
        features: "",
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-xl font-semibold">Create Plan</h1>
          <p className="text-sm text-neutral-500">
            Add a new subscription plan
          </p>
        </div>

        {/* FORM */}
        <div className="space-y-4 p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60">

          {/* NAME */}
          <input
            type="text"
            placeholder="Plan name (e.g. Pro)"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full px-4 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          />

          {/* PRICE */}
          <input
            type="number"
            placeholder="Price (₹)"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: e.target.value })
            }
            className="w-full px-4 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          />

          {/* DURATION */}
          <input
            type="number"
            placeholder="Duration (days)"
            value={form.duration}
            onChange={(e) =>
              setForm({ ...form, duration: e.target.value })
            }
            className="w-full px-4 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          />

          {/* FEATURES */}
          <textarea
            placeholder={`Features (JSON)\nExample:\n["Unlimited chats", "Priority AI", "Faster responses"]`}
            value={form.features}
            onChange={(e) =>
              setForm({ ...form, features: e.target.value })
            }
            rows={5}
            className="w-full px-4 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-500 font-mono text-sm"
          />

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]"
          >
            {loading ? "Creating..." : "Create Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}