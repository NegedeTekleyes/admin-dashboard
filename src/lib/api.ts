// lib/api.ts
import { storage } from './storage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// Enhanced API response type
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

// Your existing apiRequest function (updated version)
export const apiRequest = async <T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  try {
    const ADMIN_ACCESS_KEY = process.env.EXPO_PUBLIC_ADMIN_ACCESS_KEY || 'your-very-secret-admin-key-12345';

    let headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-admin-api-key': ADMIN_ACCESS_KEY, 
      ...options.headers,
    };

    // Optional: Still include token if available
    const token = await storage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      headers,
      ...options,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorText = await response.text();
        if (errorText) {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } catch {
        // Ignore JSON parse errors
      }
      
      throw new Error(errorMessage);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};
// Reports API Types
interface ReportConfig {
  title: string;
  type: string;
  filters: {
    startDate: string;
    endDate: string;
    status?: string;
    category?: string;
    urgency?: string;
    technicianId?: number;
  };
}

interface ExportData {
  reportType: string;
  dateRange: { start: string; end: string };
  filters: any;
  data: any;
}

// Reports API
export const reportsAPI = {
  // Generate a new report
  generate: (config: ReportConfig): Promise<any> =>
    apiRequest('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  // Get analytics report
  getAnalytics: (startDate: string, endDate: string): Promise<any> =>
    apiRequest(`/reports/analytics?startDate=${startDate}&endDate=${endDate}`),

  // Get technician performance report
  getTechnicianPerformance: (technicianId: number, startDate: string, endDate: string): Promise<any> =>
    apiRequest(`/reports/technicians/${technicianId}/performance?startDate=${startDate}&endDate=${endDate}`),

  // Get saved reports
  getSaved: (): Promise<any> =>
    apiRequest('/reports/saved'),

  // Get report by ID
  getById: (reportId: number): Promise<any> =>
    apiRequest(`/reports/${reportId}`),

  // Export as CSV
  exportCSV: (data: ExportData): Promise<any> =>
    apiRequest('/reports/export/csv', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Export as PDF
  exportPDF: (data: ExportData): Promise<any> =>
    apiRequest('/reports/export/pdf', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Export as Excel
  exportExcel: (data: ExportData): Promise<any> =>
    apiRequest('/reports/export/excel', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Delete a saved report
  delete: (reportId: number): Promise<void> =>
    apiRequest(`/reports/${reportId}`, {
      method: 'DELETE',
    }),
};



// Technicians API
// export const techniciansAPI = {
//   // Get all technicians with pagination
//   getAll: (page: number = 1, limit: number = 10, status?: string): Promise<any> =>
//     apiRequest(`/technicians?page=${page}&limit=${limit}`),

//   // Get technician by ID
//   getById: (id: number): Promise<any> =>
//     apiRequest(`/technicians/${id}`),

//   // Create technician
//   create: (data: any): Promise<any> =>
//     apiRequest('/technicians', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     }),

//   // Update technician
//   update: (id: number, data: any): Promise<any> =>
//     apiRequest(`/technicians/${id}`, {
//       method: 'PUT',
//       body: JSON.stringify(data),
//     }),

//   // Delete technician
//   delete: (id: number): Promise<void> =>
//     apiRequest(`/technicians/${id}`, {
//       method: 'DELETE',
//     }),

//   // Get technician performance
//   getPerformance: (id: number, startDate?: string, endDate?: string): Promise<any> => {
//     const params = new URLSearchParams();
//     if (startDate) params.append('startDate', startDate);
//     if (endDate) params.append('endDate', endDate);
    
//     return apiRequest(`/technicians/${id}/performance?${params.toString()}`);
//   },
// };

// lib/api.ts - Updated techniciansAPI section
export const techniciansAPI = {
  // Get all technicians with pagination and filtering
  getAll: (page: number = 1, limit: number = 10, status?: string): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });
    return apiRequest(`/technicians?${params.toString()}`);
  },

  // Get technician by ID
  getById: (id: number): Promise<any> =>
    apiRequest(`/technicians/${id}`),

  // Create technician
  create: (data: { userId: number; speciality: string; status?: string }): Promise<any> =>
    apiRequest('/technicians', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update technician
  update: (id: number, data: { speciality?: string; status?: string }): Promise<any> =>
    apiRequest(`/technicians/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete technician
  delete: (id: number): Promise<any> =>
    apiRequest(`/technicians/${id}`, {
      method: 'DELETE',
    }),

  // Get available technicians (for assignment)
  getAvailable: (): Promise<any> =>
    apiRequest('/technicians/available'),

  // Get technician performance stats
  getStats: (): Promise<any> =>
    apiRequest('/technicians/stats'),
};
export const analyticsAPI = {
      getComprehensiveAnalytics: (days: number = 30): Promise<any> => 
        apiRequest(`/analytics/dashboard?days=${days}`),

      getDashboardOverview: (days: number = 30): Promise<any> =>
        apiRequest(`/analytics/stats?days=${days}`),

      // Get complaints by category
      getComplaintsByCategory: (): Promise<any> =>
        apiRequest('/analytics/by-category'),

      // Get complaints by status
      getComplaintsByStatus: (): Promise<any> =>
        apiRequest('/analytics/by-status'),

      // Get top technicians
      getTopTechnicians: (limit: number = 3): Promise<any> =>
        apiRequest(`/analytics/top-technicians?limit=${limit}`),
};



// Type definitions for better TypeScript support
interface Complaint {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

interface CreateComplaintData {
  title: string;
  description: string;
  category?: string;
}

// Complaints API with proper typing
export const complaintsAPI = {
  create: (data: CreateComplaintData): Promise<Complaint> => 
    apiRequest<Complaint>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyComplaints: (): Promise<Complaint[]> => 
    apiRequest<Complaint[]>('/complaints/my-complaints'),

  getById: (id: number): Promise<Complaint> => 
    apiRequest<Complaint>(`/complaints/${id}`),

  update: (id: number, data: Partial<CreateComplaintData>): Promise<Complaint> =>
    apiRequest<Complaint>(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<void> =>
    apiRequest<void>(`/complaints/${id}`, {
      method: 'DELETE',
    }),
};

// Auth API functions
export const authAPI = {
  login: (email: string, password: string): Promise<{ token: string; user: any }> =>
    apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData: any): Promise<{ token: string; user: any }> =>
    apiRequest<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  logout: async (): Promise<void> => {
    await storage.removeItem('token');
  },
};

// Utility function to set auth token
export const setAuthToken = async (token: string): Promise<void> => {
  await storage.setItem('token', token);
};

// Utility function to get auth token
export const getAuthToken = async (): Promise<string | null> => {
  return await storage.getItem('token');
};
