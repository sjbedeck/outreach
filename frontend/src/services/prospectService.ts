import axios from 'axios';
import { Prospect } from '@/types/prospect';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const prospectService = {
  async getProspects(): Promise<Prospect[]> {
    const response = await api.get('/prospects');
    return response.data;
  },

  async importCompanies(csvData: string): Promise<Prospect[]> {
    const response = await api.post('/prospects/import', { csvData });
    return response.data;
  },

  async generateEmail(prospectId: string, type: 'company' | 'individual', contactId?: string): Promise<Prospect> {
    const response = await api.post(`/prospects/${prospectId}/generate-email`, {
      type,
      contactId
    });
    return response.data;
  },

  async sendEmail(prospectId: string, type: 'company' | 'individual', contactId?: string): Promise<void> {
    await api.post(`/prospects/${prospectId}/send-email`, {
      type,
      contactId
    });
  },

  async updateProspectStatus(prospectId: string, status: string): Promise<void> {
    await api.patch(`/prospects/${prospectId}/status`, { status });
  },

  async getProspectDetails(prospectId: string): Promise<Prospect> {
    const response = await api.get(`/prospects/${prospectId}`);
    return response.data;
  }
};