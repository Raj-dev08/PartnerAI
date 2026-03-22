import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

type AiModel = {
  _id: string;
  maleName: string;
  femaleName: string;
  otherName: string;
  description?: string;
  age: number;
  aiType: string;
  personalityTraits: {
    humour: number;
    kindness: number;
    sarcasm: number;
    coldness: number;
    confidence: number;
    newGen: number;
    sweetness: number;
  };
  birthDate: number;
  birthMonth: string;
  occupation?: string;
  occupationWeightage?: number;
  speechPatterns: {
    slangUsage: number;
    formalityLevel: number;
    catchPhrases?: string[];
    typingStyle?: "normal" | "emoji-heavy" | "lowercase" | "short-messages";
  };
  academicBackground?: string;
  academicBackgroundWeightage?: number;
  expressiveness: number;
  talkativeness: number;
  trustBuildingRate: number;
  madeBy: string;
};

type AiBuilderState = {
  myCreatedAi: AiModel | null;
  loading: boolean;

  createAiModel: (data: any) => Promise<boolean>;
  updateAiModel: (id: string, data: any) => Promise<boolean>;
  deleteAiModel: (id: string) => Promise<boolean>;
  getMyCreatedAi: () => Promise<void>;
};

export const useAiBuilderStore = create<AiBuilderState>((set) => ({
  myCreatedAi: null,
  loading: false,

  createAiModel: async (data) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post("/ai/generate", data);

      set({ myCreatedAi: res.data.aiModel });

      toast.success("AI model created");
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create AI model"
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updateAiModel: async (id, data) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.put(`/ai-model/${id}`, data);

      set({ myCreatedAi: res.data.aiModel });

      toast.success("AI model updated");
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update AI model"
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deleteAiModel: async (id) => {
    set({ loading: true });
    try {
      await axiosInstance.delete(`/ai-model/${id}`);

      set({ myCreatedAi: null });

      toast.success("AI model deleted");
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete AI model"
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },

  getMyCreatedAi: async () => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get("/ai-model/my");

      set({ myCreatedAi: res.data.aiModel });
    } catch (error: any) {
      set({ myCreatedAi: null });
      // no toast — same reasoning as your other store
    } finally {
      set({ loading: false });
    }
  },
}));