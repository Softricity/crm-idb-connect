import { create } from 'zustand';
import api from '@/lib/api';

export interface SupportTicket {
  id: string;
  case_number: number;
  topic: string;
  category: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'AWAITING_REPLY' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  updated_at?: string;
  partner?: {
    id?: string;
    name?: string;
    email?: string;
    agency_name?: string | null;
  } | null;
  requester?: {
    type?: string | null;
    partner_id?: string | null;
    agent_id?: string | null;
    team_member_id?: string | null;
    parent_agent_id?: string | null;
  };
  comments?: Array<{
    id: string;
    sender_id: string;
    sender_type: string;
    sender_name: string;
    message: string;
    created_at: string;
  }>;
}

interface SupportState {
  tickets: SupportTicket[];
  selectedTicket: SupportTicket | null;
  loading: boolean;
  detailsLoading: boolean;
  fetchTickets: (status?: string) => Promise<void>;
  fetchTicketById: (id: string) => Promise<SupportTicket | null>;
  addComment: (ticketId: string, message: string) => Promise<void>;
  updateStatus: (ticketId: string, status: SupportTicket['status']) => Promise<void>;
  clearSelectedTicket: () => void;
  reset: () => void;
}

export const useSupportStore = create<SupportState>((set) => ({
  tickets: [],
  selectedTicket: null,
  loading: false,
  detailsLoading: false,

  fetchTickets: async (status) => {
    set({ loading: true });
    try {
      const tickets = await api.SupportAPI.getAllTickets(status);
      set({ tickets: tickets || [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchTicketById: async (id) => {
    set({ detailsLoading: true });
    try {
      const ticket = await api.SupportAPI.getTicketById(id);
      set({ selectedTicket: ticket });
      return ticket;
    } finally {
      set({ detailsLoading: false });
    }
  },

  addComment: async (ticketId, message) => {
    await api.SupportAPI.addComment(ticketId, message);
    const ticket = await api.SupportAPI.getTicketById(ticketId);
    set((state) => ({
      selectedTicket: ticket,
      tickets: state.tickets.map((item) =>
        item.id === ticketId ? { ...item, status: ticket.status, updated_at: ticket.updated_at } : item,
      ),
    }));
  },

  updateStatus: async (ticketId, status) => {
    await api.SupportAPI.updateStatus(ticketId, status);
    const ticket = await api.SupportAPI.getTicketById(ticketId);
    set((state) => ({
      selectedTicket: ticket,
      tickets: state.tickets.map((item) =>
        item.id === ticketId ? { ...item, status: ticket.status, updated_at: ticket.updated_at } : item,
      ),
    }));
  },

  clearSelectedTicket: () => {
    set({ selectedTicket: null });
  },

  reset: () => {
    set({
      tickets: [],
      selectedTicket: null,
      loading: false,
      detailsLoading: false,
    });
  },
}));
