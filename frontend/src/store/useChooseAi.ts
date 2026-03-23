import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

type AiModel = {
  _id: string;
  maleName: string;
  femaleName: string;
  otherName: string;
  description?: string;
  aiType: string;
  ratings: number;
  totalRated: number;
  isVerified: boolean;
  expressiveness: number;
  talkativeness: number;
  personalityTraits: {
    humour: number;
    kindness: number;
    sarcasm: number;
    coldness: number;
    confidence: number;
    newGen: number;
    sweetness: number;
  };
};

type AiState = {
  aiModels: AiModel[];
  forYouModels: AiModel[];
  searchResults: AiModel[];
  myAiModel: AiModel | null;
  hasMore: boolean;

  loading: boolean;
  searchLoading: boolean;
  loadingForSettingAi: boolean;


  // actions
  getAIModels: (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;

   getAIModelsForMe: (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  searchAIModels: (query: string) => Promise<void>; 

  
  getMyAIModel: () => Promise<void>;

  firstAIModel: () => Promise<boolean>;

  switchAIModel: () => Promise<boolean>;

  setAIModel: (id: string) => Promise<boolean>;

  rateAIModel: (id: string, rating: number) => Promise<boolean>;
};

export const useAiModelStore = create<AiState>((set) => ({
  aiModels: [],
  forYouModels: [],
  myAiModel: null,
  hasMore: true,
  loading: false,
  searchResults: [],
  searchLoading: false,
  loadingForSettingAi: false,

  getAIModels: async (params) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get("/chooseai/get-ai-model", {
        params,
      });

      set((state)=>({
        aiModels: [...state.aiModels, ...res.data.aiModels],
        hasMore: res.data.hasMore
      }))
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch AI models");
    } finally {
      set({ loading: false });
    }
  },

  
  searchAIModels: async (query) => {
    if (!query.trim()) {
        set({ searchResults: [] });
        return;
    }

    set({ searchLoading: true });

    try {
        const res = await axiosInstance.get("/chooseai/get-ai-model", {
        params: { search: query, page: 1, limit: 20 },
        });

        set({ searchResults: res.data.aiModels });
    } catch (error: any) {
        toast.error(error?.response?.data?.message || "Search failed");
    } finally {
        set({ searchLoading: false });
    }
  },


  getAIModelsForMe: async (params) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get("/chooseai/reccomended-ai-model", {
        params,
      });

      console.log(res.data);

      set({
        forYouModels: res.data.models,
        hasMore: res.data.hasMore,
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch AI models");
    } finally {
      set({ loading: false });
    }
  },

  getMyAIModel: async () => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get("/chooseai/get-my-ai-model");
      set({ myAiModel: res.data.aiModel });
    } catch (error: any) {
      set({ myAiModel: null });
      // no toast here → normal if user hasn’t picked one
    } finally {
      set({ loading: false });
    }
  },

  firstAIModel: async () => { //only sets verified models
    set({ loadingForSettingAi: true });
    try {
      const res = await axiosInstance.put("/chooseai/first-ai-model");
      set({ myAiModel: res.data.aiModel });
      toast.success("AI assigned");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed");
      return false;
    } finally {
      set({ loadingForSettingAi: false });
    }
  },

  switchAIModel: async () => {//all models randomly
    set({ loadingForSettingAi: true });
    try {
      const res = await axiosInstance.put("/chooseai/switch-ai-model");
      set({ myAiModel: res.data.aiModel });
      toast.success("Switched AI");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed");
      return false;
    } finally {
      set({ loadingForSettingAi: false });
    }
  },

  setAIModel: async (id) => {//chosen model
    set({ loadingForSettingAi: true });
    try {
      const res = await axiosInstance.put(`/chooseai/set-ai-model/${id}`);
      set({ myAiModel: res.data.aiModel });
      toast.success("AI selected");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed");
      return false;
    } finally {
      set({ loadingForSettingAi: false });
    }
  },

  rateAIModel: async (id, rating) => {
    try {
      const res = await axiosInstance.post(`/chooseai/rate-ai-model/${id}`, {
        rating,
      });

      // optional: update local state
      set((state) => ({
        aiModels: state.aiModels.map((m) =>
          m._id === id ? res.data.aiModel : m
        ),
        myAiModel:
          state.myAiModel?._id === id ? res.data.aiModel : state.myAiModel,
      }));

      toast.success("Rated successfully");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed");
      return false;
    }
  },
}));