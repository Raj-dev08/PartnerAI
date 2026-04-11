import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

type Plan = {
  id: string; // UUID
  name: string;
  price: string; // NUMERIC comes as string from postgres
  duration: number;
  features: any; // JSONB (you can strongly type later)
  created_at: string;
  updated_at: string;
};

type Subscription = {
  id: string; // UUID
  u_id: string;
  plan_id: string;
  status: "active" | "inactive" | "cancelled";
  start_date: string;
  end_date: string;
  created_at: string;

  // from JOIN (your API adds these)
  plan_name?: string;
  plan_price?: string;
  plan_duration?: number;
  plan_features?: any;
};

type Payment = {
  id: string; // UUID
  u_id: string;
  subscription_id: string | null;
  amount: string; // NUMERIC → string
  status: "pending" | "completed" | "failed" | string;
  created_at: string;
};

type PaymentState = {
  plans: Plan[];
  subscription: Subscription | null;
  payments: Payment[];
  currentPayment: Payment | null;
  loading: boolean;

  // actions
  fetchPlans: () => Promise<void>;
  subscribeToPlan: (planId: number | string) => Promise<any>;
  payForSubscription: (paymentId: number | string) => Promise<boolean>;
  fetchUserSubscription: () => Promise<void>;
  restartSubscription: () => Promise<boolean>;
  getPaymentById: (id: string) => Promise<Payment | null>;
};

export const usePaymentStore = create<PaymentState>((set, get) => ({
  plans: [],
  subscription: null,
  payments: [],
  loading: false,
  currentPayment: null,


  fetchPlans: async () => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get("/payment/all-plans");

      if (res.data?.plans) {
        set({ plans: res.data.plans });
      } else {
        set({ plans: [] });
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch plans");
    } finally {
      set({ loading: false });
    }
  },


  subscribeToPlan: async (planId) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.put(`/payment/subscribe-plan/${planId}`);

      const { subscription, payment } = res.data;

      set({
        subscription,
        payments: [payment], // overwrite with latest
      });

      toast.success("Subscription created. Complete payment.");
      return payment;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to subscribe");
      return false;
    } finally {
      set({ loading: false });
    }
  },


  payForSubscription: async (paymentId) => {
    set({ loading: true });
    try {
      await axiosInstance.post(`/payment/pay/${paymentId}`);

      // update local state
      const updatedPayments = get().payments.map((p) =>
        p.id === paymentId ? { ...p, status: "completed" } : p
      );

      set({
        payments: updatedPayments,
        subscription: get().subscription
          ? { ...get().subscription!, status: "active" }
          : null,
      });

      toast.success("Payment successful");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Payment failed");
      return false;
    } finally {
      set({ loading: false });
    }
  },


  fetchUserSubscription: async () => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get("/payment/user-subscription");

      set({
        subscription: res.data.subscription,
        payments: res.data.payment,
      });
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        toast.error(
          error?.response?.data?.message || "Failed to fetch subscription"
        );
      }
      set({ subscription: null, payments: [] });
    } finally {
      set({ loading: false });
    }
  },


  restartSubscription: async () => {
    set({ loading: true });
    try {
      await axiosInstance.post("/payment/restart-subscription");

      toast.success("Subscription restarted");

      // refetch fresh state (important)
      await get().fetchUserSubscription();

      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to restart");
      return false;
    } finally {
      set({ loading: false });
    }
  },
  getPaymentById: async (id: string) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get(`/payment/${id}`);

      set({ currentPayment: res.data.payment });

      return res.data.payment;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch payment");
      set({ currentPayment: null });
      return null;
    } finally {
      set({ loading: false });
    }
  },
}));