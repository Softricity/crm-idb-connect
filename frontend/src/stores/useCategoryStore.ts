import { create } from "zustand";
import api from "@/lib/api";

export interface Category {
  id: string;
  name: string;
  label?: string;
  description?: string;
  is_active: boolean;
  _count?: {
    agents: number;
  };
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (data: any) => Promise<void>;
  updateCategory: (id: string, data: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  loading: false,

  fetchCategories: async () => {
    set({ loading: true });
    try {
      const data = await api.AgentsAPI.getCategories();
      set({ categories: data as Category[] });
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      set({ loading: false });
    }
  },

  createCategory: async (data) => {
    try {
      await api.AgentsAPI.createCategory(data);
      const updated = await api.AgentsAPI.getCategories();
      set({ categories: updated as Category[] });
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  updateCategory: async (id, data) => {
    try {
      await api.AgentsAPI.updateCategory(id, data);
      const updated = await api.AgentsAPI.getCategories();
      set({ categories: updated as Category[] });
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      await api.AgentsAPI.deleteCategory(id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },
}));
