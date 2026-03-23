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
  ratings: number;
  totalRated: number;
  isVerified: boolean;
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

type InterestPayload = {
  aiId: string;
  interest: string;
  description: string;
  reasonForInterest: string;
  ageWhileInterest: number;
  acheivements?: string[];
};

type ExperiencePayload = {
  aiId: string;
  event: string;
  description: string;
  ageDuringEvent: number;
};

type AiBuilderState = {
  myCreatedAi: AiModel[]| [];
  updatingModel: AiModel | null;
  loading: boolean;

  createAiModel: (data: any) => Promise<boolean>;
  updateAiModel: (id: string, data: any) => Promise<boolean>;
  deleteAiModel: (id: string) => Promise<boolean>;
  getMyAiModels: () => Promise<void>;
  getAiModelByID: (id: string) => Promise<void>;
  createInterest: (data: InterestPayload) => Promise<boolean>;
  createPastExperience: (data: ExperiencePayload) => Promise<boolean>;
};

export const useAiBuilderStore = create<AiBuilderState>((set) => ({
  myCreatedAi: [],
  loading: false,
  updatingModel: null,


  createAiModel: async (data) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post("/ai/generate", data);

      set((state)=> ({
        myCreatedAi: [...state?.myCreatedAi || null, res.data.aiModel]
      }));

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
      const res = await axiosInstance.put(`/ai/update/${id}`, data);

      set((state)=>({
        myCreatedAi: state.myCreatedAi.map(ai => ai._id === id ? res.data.aiModel : ai)
      }))

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
      await axiosInstance.delete(`/ai/delete/${id}`);

      set((state)=>({
        myCreatedAi: state.myCreatedAi.filter(ai => ai._id !== id)
      }))

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

  getMyAiModels: async() =>{
    set({ loading: true })
    try {
      const res = await axiosInstance.get("/ai/get-my-ai-models");
      set({ myCreatedAi: res.data.aiModels });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete AI model"
      );
    } finally {
      set({ loading: false });
    }
  },
  getAiModelByID: async (id) => {
    set({ loading: true });
    try {
       const res = await axiosInstance.get(`/ai/get-ai-model-by-id/${id}`)

       set({ updatingModel: res.data.aiModel })
    } catch (error: any) {
       toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete AI model"
      );
    } finally {
      set({ loading: false });
    }
  },

  createInterest: async (data: InterestPayload) => {
    set({ loading: true });
    try {
      await axiosInstance.post("/interest/create", data);

      toast.success("Interest added");
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create interest"
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },

  createPastExperience: async (data: ExperiencePayload) => {
    set({ loading: true });
    try {
      await axiosInstance.post("/experience/create", data);

      toast.success("Past experience added");
      return true;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create past experience"
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },
  
}));