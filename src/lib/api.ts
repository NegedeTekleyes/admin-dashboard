// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const analyticsAPI = {
  getDashboardData: async (days: number = 30) => {
    const response = await fetch(`${API_BASE}/analytics/dashboard?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    return response.json();
  },

  getByCategory: async () => {
    const response = await fetch(`${API_BASE}/analytics/by-category`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch category data');
    return response.json();
  },

  getByStatus: async () => {
    const response = await fetch(`${API_BASE}/analytics/by-status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch status data');
    return response.json();
  },

  getTopTechnicians: async (limit: number = 3) => {
    const response = await fetch(`${API_BASE}/analytics/top-technicians?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch technicians data');
    return response.json();
  }
};