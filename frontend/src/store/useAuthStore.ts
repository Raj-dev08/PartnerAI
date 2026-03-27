import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import {io} from "socket.io-client"

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : import.meta.env.VITE_API_URL;//url of backend

type User = {
  _id: string;
  name: string;
  email: string;
  password?: string;
  expoPushToken?: string;
  refreshTokenVersion?: number;
  gender: "male" | "female" | "other";
  isDisabled?: boolean;
  isPaid?: boolean;
  memories?: string[] | string;
  birthday: string;
  userPictures?: string[] ;
  conversations?: string[] | string;
  AiModel?: string | null;
  AiModelCloseness?: number;
  isOwner?: boolean;
  userReference: string;
  token?: string;
  sessionId?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  isCheckingAuth: boolean;
  socket: any;

  connectSocket: () => void;
  disconnectSocket: () => void;

  sendOtp: (data: {
    email: string;
    name: string;
    password: string;
    birthday: string;
    gender: "male" | "female" | "other" | string;
    expoPushToken?: string;
  }) => Promise<boolean>;

  verifyOtp: (data: { email: string; otp: string }) => Promise<any>;

  login: (data: { email: string; password: string }) => Promise<any>;

  logout: () => Promise<boolean>;

  checkAuth: () => Promise<User | null>;

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<boolean>;

  deleteAccount: () => Promise<boolean>;

  disableAccount: () => Promise<boolean>;

  enableAccount: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  isCheckingAuth: true,
  socket:null,

  sendOtp: async (data) => {
    set({ loading: true });
    try {
      await axiosInstance.post("/auth/send-otp", data);
      toast.success("OTP sent");
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong"
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },

  verifyOtp: async (data) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post("/auth/verify-otp", data);
      set({ user: res.data });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("sessionId", res.data.sessionId);
      toast.success("Account created");
      get().connectSocket();
      return res.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong"
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },

  login: async (data) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ user: res.data });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("sessionId", res.data.sessionId);
      toast.success("Login successful");
      get().connectSocket();
      return res.data;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong"
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await axiosInstance.post("/auth/logout");
      set({ user: null });
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      toast.success("Logout successful");
      get().disconnectSocket();
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong"
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const sessionId = localStorage.getItem("sessionId");
      if (!sessionId) {
        set({ user: null });
        return null;
      }
      const res = await axiosInstance.get("/auth/check");
      set({ user: res.data });
      get().connectSocket();
      return res.data;
    } catch {
      set({ user: null });
      return null;
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // updateExpoPushToken: async (expoPushToken) => {
  //   try {
  //     await axiosInstance.post("/auth/update-expo-push-token", {
  //       expoPushToken,
  //     });
  //     return true;
  //   } catch (error: any) {
  //     toast.error(error?.response?.data?.message || "Failed");
  //     return false;
  //   }
  // },
 //Web doesnt have expo token so commented out
  changePassword: async (data) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post(
        "/auth/change-password",
        data
      );
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("sessionId", res.data.newSessionId);
      toast.success("Password changed");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deleteAccount: async () => {
    set({ loading: true });
    try {
      await axiosInstance.delete("/auth/delete-account");
      set({ user: null });
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      toast.success("Account deleted");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  disableAccount: async () => {
    set({ loading: true });
    try {
      await axiosInstance.put("/auth/disable-account");
      set({ user: null });
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      toast.success("Account disabled");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  enableAccount: async () => {
    set({ loading: true });
    try {
      await axiosInstance.put("/auth/enable-account");
      toast.success("Account enabled");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  connectSocket: () => {
    const { user } = get();
    if (!user || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: user._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));