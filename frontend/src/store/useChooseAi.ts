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
  searchHasMore: boolean;
  forYouHasMore: boolean;

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
  searchAIModels: (params?: {
    query?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>; 

  
  getMyAIModel: () => Promise<void>;

  firstAIModel: () => Promise<boolean>;

  switchAIModel: () => Promise<boolean>;

  setAIModel: (id: string) => Promise<boolean>;

  rateAIModel: (id: string, rating: number) => Promise<boolean>;

  removeAIModel: () => Promise<boolean>;
};

export const useAiModelStore = create<AiState>((set,get) => ({
  aiModels: [],
  forYouModels: [],
  myAiModel: null,
  hasMore: true,
  loading: false,
  searchResults: [],
  searchLoading: false,
  loadingForSettingAi: false,
  searchHasMore: true,
  forYouHasMore: true,


  getAIModels: async (params) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get("/chooseai/get-ai-model", {
        params,
      });

      const existingIds = new Set(get().aiModels.map((m) => m._id));
      const newModels = res.data.aiModels.filter((m:any) => !existingIds.has(m._id));

      set((state) => ({
        aiModels:
          params?.page === 1
            ? res.data.aiModels
            : [...state.aiModels, ...newModels],
        hasMore: res.data.hasMore,
      }));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch AI models");
    } finally {
      set({ loading: false });
    }
  },

  
  searchAIModels: async (params) => {
    if (!params?.query?.trim()) {
        set({ searchResults: [] });
        return;
    }

    set({ searchLoading: true });

    try {
        const res = await axiosInstance.get("/chooseai/get-ai-model", {
        params,
        });

        const existingIds = new Set(get().searchResults.map((m) => m._id));
        const newModels = res.data.aiModels.filter((m:any) => !existingIds.has(m._id));


       set((state) => ({
        searchResults:
          params?.page === 1
            ? res.data.aiModels
            : [...state.searchResults, ...newModels],
        searchHasMore: res.data.hasMore,
      }));
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
;
      const existingIds = new Set(get().forYouModels.map((m) => m._id));
      const newModels = res.data.models.filter((m:any) => !existingIds.has(m._id));

      set((state) => ({
        forYouModels:
          params?.page === 1
            ? res.data.models
            : [...state.forYouModels, ...newModels],
        forYouHasMore: res.data.hasMore,
      }));
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

  removeAIModel: async () => {
    set({ loadingForSettingAi: true });
    try {
      await axiosInstance.put("/chooseai/remove-ai-model");

      // 🔥 Reset everything cleanly (important)
      set({
        myAiModel: null,
      });

      toast.success("AI removed");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed");
      return false;
    } finally {
      set({ loadingForSettingAi: false });
    }
  },
}));