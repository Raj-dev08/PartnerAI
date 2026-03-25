import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

type Message = {
  _id?: string;
  userId: string;
  aiId: string;
  conversationId: string;
  message: string;
  sentBy: "user" | "ai";
  status: "pending" | "completed" | "failed";
  createdAt:  Date | string;
  replyingTo?: string | null | any;
};

type ChatState = {
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
  sending: boolean;
  typingAi: string | null;

  getMessages: (aiId: string, before?: string | Date) => Promise<void>;
  sendMessage: (content: string, aiId: string, replyingTo?: string) => Promise<void>;

  subscribeToSocket: () => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  hasMore: true,
  loading: false,
  sending: false,
  typingAi: null,


  getMessages: async (aiId, before) => {
    set({ loading: true });

    try {
      const res = await axiosInstance.get(`/convo/get-messages/${aiId}`, {
        params: { before, limit: 20 },
      });

      set((state) => ({
        messages: before
          ? [...res.data.messages, ...state.messages]
          : res.data.messages,
        hasMore: res.data.hasMore,
      }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (content, replyingTo) => {
    if (!content.trim()) return;

    set({ sending: true });

    try {
      const res  = await axiosInstance.post("/convo/user-sends-message", {
        content,
        replyingTo,
      });

      const payload: Message = {
          _id: res.data.tempId,
          userId: res.data.userId,
          aiId: res.data.aiId,
          conversationId: "",
          sentBy: res.data.sentBy,
          replyingTo: res.data.replyingTo,
          message: res.data.content,
          status: "pending",
          createdAt: new Date().toISOString(),
      };

      set({ messages: [ ...get().messages, payload]})
    } catch (err: any) {
      toast.error("Failed to send");
    } finally {
      set({ sending: false });
    }
  },

  subscribeToSocket: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.off("aiMessage");
    socket.off("messageConfirmed");
    socket.off("aiStartedTyping");


    socket.on("aiMessage", (data : any) =>{
        set((state) => ({
        messages: [...state.messages, data.message],
      }));
    
    })

    socket.on("messageConfirmed",({tempId,message} : any) => {
      console.log(message, tempId , get().messages)
      set((state) => ({
        messages: state.messages.map((m) => m._id === tempId ? message : m),
      }))
    })

    socket.on("aiStartedTyping",({aiId} : any) => {
      set({typingAi: aiId})
    })

    socket.on("aiStoppedTyping",({aiId} : any) => {
      if(aiId === get().typingAi){
        set({typingAi: null})
      }
    })

  }
}));