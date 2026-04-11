import { useEffect } from "react";
import { usePaymentStore } from "../store/usePayment";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

export default function PlansPage() {
  const {
    plans,
    fetchPlans,
    subscribeToPlan,
    restartSubscription,
    fetchUserSubscription,
    subscription,
    loading,
  } = usePaymentStore();

  const { user } = useAuthStore();

  const navigate = useNavigate();


  useEffect(() => {
    fetchPlans();
    fetchUserSubscription();
  }, []);

  const handleBuy = async (planId: string) => {
    const payment = await subscribeToPlan(planId);

    if (payment?.id) {
      navigate(`/pay/${payment.id}`)
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
  };

  console.log(subscription)
  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* HEADER */}
        <div>
          <h1 className="text-xl font-semibold">Plans</h1>
          <p className="text-sm text-neutral-500">
            Choose a plan that fits you
          </p>
        </div>

        {/* CURRENT STATUS */}
        <div className="flex items-center justify-between border border-neutral-800 rounded-xl p-4 bg-neutral-900/50">
          <div>
            <p className="text-xs text-neutral-500">Current Plan</p>
            <p className="text-base font-medium">
              {subscription?.plan_name || "Free"}
            </p>

            {subscription && (
              <p className="text-xs text-neutral-500 mt-1">
                {subscription.status === "active"
                  ? `Valid till ${formatDate(subscription.end_date)}`
                  : `Expired on ${formatDate(subscription.end_date)}`}
              </p>
            )}
          </div>

          <div
            className={`px-3 py-1 text-xs rounded-full border ${
              user?.isPaid
                ? "bg-green-500/10 text-green-400 border-green-500/30"
                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
            }`}
          >
            {subscription?.status === "active"
              ? "Active"
              : subscription?.status === "inactive"
              ? "Expired"
              : "Free"}
          </div>
        </div>

        {/* RENEW BUTTON */}
        {subscription?.status == "inactive" && (
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">
              Expired on {formatDate(subscription?.end_date)}
            </p>

            <button
              onClick={restartSubscription}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition"
            >
              {loading ? "Processing..." : "Renew Subscription"}
            </button>
          </div>
        )}

        {/* PLANS GRID */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan_id === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 space-y-4 ${
                  isCurrent
                    ? "border-white bg-neutral-900"
                    : "border-neutral-800 bg-neutral-900/50"
                }`}
              >
                {/* NAME */}
                <div>
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  <p className="text-sm text-neutral-500">
                    {plan.duration} days
                  </p>
                </div>

                {/* PRICE */}
                <div>
                  <p className="text-2xl font-bold">
                    ₹{Number(plan.price)}
                  </p>
                </div>

                {/* FEATURES */}
                <ul className="text-sm text-neutral-400 space-y-1">
                  {Array.isArray(plan.features) ? (
                    plan.features.map((f: string, i: number) => (
                      <li key={i}>• {f}</li>
                    ))
                  ) : (
                    <li>• Custom features</li>
                  )}
                </ul>

                {/* ACTION BUTTON */}
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg bg-neutral-800 text-sm"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(plan.id)}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition"
                  >
                    {loading ? "Processing..." : "Buy Plan"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}