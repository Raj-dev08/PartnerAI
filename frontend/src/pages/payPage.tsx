import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePaymentStore } from "../store/usePayment";

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    currentPayment,
    getPaymentById,
    payForSubscription,
    loading,
  } = usePaymentStore();

  useEffect(() => {
    if (id) {
      getPaymentById(id);
    }
  }, [id]);

  const handlePay = async () => {
    if (!id) return;

    const success = await payForSubscription(id);
    if (success) {
      navigate("/account");
    }
  };

  if (loading && !currentPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400">
        Loading payment...
      </div>
    );
  }

  if (!currentPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400">
        Payment not found
      </div>
    );
  }

  const payment = currentPayment;

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-md mx-auto space-y-8">

        {/* HEADER */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">Complete Payment</h1>
          <p className="text-sm text-neutral-500">
            Secure checkout (demo)
          </p>
        </div>

        {/* CARD */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5">

          {/* AMOUNT */}
          <div>
            <p className="text-xs text-neutral-500">Amount</p>
            <p className="text-2xl font-bold">₹{payment.amount}</p>
          </div>

          {/* STATUS */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500">Status</p>
            <span
              className={`text-xs px-2.5 py-1 rounded-full border ${
                payment.status === "completed"
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : payment.status === "pending"
                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                  : "bg-red-500/10 text-red-400 border-red-500/30"
              }`}
            >
              {payment.status}
            </span>
          </div>

          {/* PAYMENT ID */}
          <div>
            <p className="text-xs text-neutral-500">Payment ID</p>
            <p className="text-xs font-mono text-neutral-400 break-all">
              {payment.id}
            </p>
          </div>

          {/* CTA */}
          {payment.status === "pending" && (
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition active:scale-[0.98]"
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
          )}

          {payment.status === "completed" && (
            <div className="text-center text-green-400 text-sm">
              Payment already completed
            </div>
          )}
        </div>

        {/* BACK */}
        <button
          onClick={() => navigate("/account")}
          className="w-full py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-sm hover:bg-neutral-800 transition"
        >
          Back to Account
        </button>
      </div>
    </div>
  );
}