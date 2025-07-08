import { create } from 'zustand';
import { Prospect } from '@/types/prospect';
import { prospectService } from '@/services/prospectService';

interface ProspectStore {
  prospects: Prospect[];
  loading: boolean;
  error: string | null;
  filter: string;
  
  // Actions
  fetchProspects: () => Promise<void>;
  importCompanies: (csvData: string) => Promise<void>;
  generateEmail: (prospectId: string, type: 'company' | 'individual', contactId?: string) => Promise<void>;
  sendEmail: (prospectId: string, type: 'company' | 'individual', contactId?: string) => Promise<void>;
  updateProspectStatus: (prospectId: string, status: string) => void;
  setFilter: (filter: string) => void;
  clearError: () => void;
}

export const useProspectStore = create<ProspectStore>((set, get) => ({
  prospects: [],
  loading: false,
  error: null,
  filter: 'all',

  fetchProspects: async () => {
    set({ loading: true, error: null });
    try {
      const prospects = await prospectService.getProspects();
      set({ prospects, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch prospects', loading: false });
    }
  },

  importCompanies: async (csvData: string) => {
    set({ loading: true, error: null });
    try {
      const newProspects = await prospectService.importCompanies(csvData);
      const currentProspects = get().prospects;
      set({ prospects: [...currentProspects, ...newProspects], loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to import companies', loading: false });
    }
  },

  generateEmail: async (prospectId: string, type: 'company' | 'individual', contactId?: string) => {
    set({ loading: true, error: null });
    try {
      const updatedProspect = await prospectService.generateEmail(prospectId, type, contactId);
      const prospects = get().prospects;
      const index = prospects.findIndex(p => p.id === prospectId);
      if (index !== -1) {
        prospects[index] = updatedProspect;
        set({ prospects: [...prospects], loading: false });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to generate email', loading: false });
    }
  },

  sendEmail: async (prospectId: string, type: 'company' | 'individual', contactId?: string) => {
    set({ loading: true, error: null });
    try {
      await prospectService.sendEmail(prospectId, type, contactId);
      const prospects = get().prospects;
      const index = prospects.findIndex(p => p.id === prospectId);
      if (index !== -1) {
        prospects[index].status = 'contacted';
        set({ prospects: [...prospects], loading: false });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to send email', loading: false });
    }
  },

  updateProspectStatus: (prospectId: string, status: string) => {
    const prospects = get().prospects;
    const index = prospects.findIndex(p => p.id === prospectId);
    if (index !== -1) {
      prospects[index].status = status;
      set({ prospects: [...prospects] });
    }
  },

  setFilter: (filter: string) => {
    set({ filter });
  },

  clearError: () => {
    set({ error: null });
  }
}));