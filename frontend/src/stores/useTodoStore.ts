import { create } from "zustand";
import api from "@/lib/api";

export interface Todo {
  id?: string;
  title: string;
  created_by: string;
  completed: boolean;
  dueDate?: string | null;
  created_at?: string;
  partners?: {
    id: string;
    name: string;
    email: string;
  };
}

interface TodoState {
  todos: Todo[];
  loading: boolean;
  fetchTodos: (params?: { date?: string; completed?: boolean }) => Promise<void>;
  fetchTodoById: (id: string) => Promise<Todo | null>;
  createTodo: (todo: { title: string; dueDate?: string }) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  markComplete: (id: string) => Promise<void>;
  markIncomplete: (id: string) => Promise<void>;
  reset: () => void;
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  loading: false,

  fetchTodos: async (params) => {
    set({ loading: true });
    try {
      const data = await api.TodosAPI.getAll(params);
      set({ todos: data as Todo[] });
    } catch (error: any) {
      console.error("Error fetching todos:", error.message || error);
    }
    set({ loading: false });
  },

  fetchTodoById: async (id) => {
    try {
      const data = await api.TodosAPI.getById(id);
      return data as Todo;
    } catch (error) {
      console.error("Error fetching todo by id:", error);
      throw error;
    }
  },

  createTodo: async (todo) => {
    try {
      const newTodo = await api.TodosAPI.create(todo);
      set((state) => ({ todos: [newTodo, ...state.todos] }));
    } catch (error) {
      console.error("Error creating todo:", error);
      throw error;
    }
  },

  updateTodo: async (id, updates) => {
    try {
      const updatedTodo = await api.TodosAPI.update(id, updates);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, ...updatedTodo } : todo
        ),
      }));
    } catch (error) {
      console.error("Error updating todo:", error);
      throw error;
    }
  },

  deleteTodo: async (id) => {
    try {
      await api.TodosAPI.delete(id);
      set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting todo:", error);
      throw error;
    }
  },

  markComplete: async (id) => {
    try {
      const updatedTodo = await api.TodosAPI.markComplete(id);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, ...updatedTodo } : todo
        ),
      }));
    } catch (error) {
      console.error("Error marking todo as complete:", error);
      throw error;
    }
  },

  markIncomplete: async (id) => {
    try {
      const updatedTodo = await api.TodosAPI.markIncomplete(id);
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, ...updatedTodo } : todo
        ),
      }));
    } catch (error) {
      console.error("Error marking todo as incomplete:", error);
      throw error;
    }
  },
  reset: () => set({ todos: [], loading: false }),
}));
