// lib/api.ts
import { io } from 'socket.io-client';
import { storage } from './storage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.5:3000";
const ADMIN_ACCESS_KEY = process.env.NEXT_PUBLIC_ADMIN_ACCESS_KEY || 'your-very-secret-admin-key-12345';

// Enhanced API response type
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

interface CreateNotificationData {
  title: string;
  message: string;
  type?: string;
  targetUserType: 'all' | 'resident' | 'technician' | 'specific';
  specificUsers?: string[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  targetUserType?: string;
  specificUsers?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// FIXED: Correct AdminProfile interface to match your backend
interface AdminProfile {
  id: number;
  name: string;
  userId: number;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    lastLogin: string;
    createdAt: string;
  };
}

// FIXED: Correct AdminStats interface to match your backend service
interface AdminStats {
  adminCount: number;
  userCount: number;
  technicians: number;
  complaintsCount: number;
}

interface UpdateAdminProfileData {
  name?: string;
  email?: string;
  phone?: string;
}

// Admin API
export const adminAPI = {
  // Get admin profile
  getProfile: () : Promise<AdminProfile> => 
  apiRequest('/admin/profile'),
  // Update admin profile
  updateProfile: (data: UpdateAdminProfileData): Promise<AdminProfile> =>
    apiRequest('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Get admin statistics
  getStats: (): Promise<AdminStats> =>
      apiRequest('/admin/stats'),

  // Change password
  changePassword: (newPassword: string): Promise<{ message: string }> =>
    apiRequest('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  // Get dashboard overview
  getDashboardOverview: (): Promise<any> =>
    apiRequest('/admin/dashboard'),

  // Get activity log
  getActivityLog: (page: number = 1, limit: number = 20): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiRequest(`/admin/activity-log?${params.toString()}`);
  },
};

// Fixed Notifications API
export const notificationsAPI = {
  getAll: (page: number = 1, limit: number = 50): Promise<{ notifications: Notification[]; total: number }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiRequest(`/notifications?${params.toString()}`);
  },

  create: (data: CreateNotificationData): Promise<Notification> =>
    apiRequest('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string): Promise<Notification> =>
    apiRequest(`/notifications/${id}`),

  updateStatus: (id: string, status: string): Promise<Notification> =>
    apiRequest(`/notifications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  delete: (id: string): Promise<void> =>
    apiRequest(`/notifications/${id}`, {
      method: 'DELETE',
    }),

  getStats: (): Promise<{
    total: number;
    unread: number;
    read: number;
    sentToday: number;
    byType: Record<string, number>;
  }> => apiRequest('/notifications/stats'),

  getUsers: (type?: 'resident' | 'technician'): Promise<Array<{
    id: string;
    name: string;
    email: string;
    type: 'resident' | 'technician';
  }>> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    return apiRequest(`/notifications/users?${params.toString()}`);
  },

  // New method to mark multiple notifications as read
  markAsRead: (ids: string[]): Promise<void> =>
    apiRequest('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  // Get user's personal notifications
  getMyNotifications: (page: number = 1, limit: number = 50): Promise<{ notifications: Notification[]; total: number }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiRequest(`/notifications/my-notifications?${params.toString()}`);
  },
};

// Enhanced Socket Service for real-time notifications
class SocketService {
  private socket: any = null;
  private isConnected = false;

  // Connect as admin (for web dashboard)
  connectAsAdmin() {
    if (this.socket) return this.socket;

    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/notifications', {
      extraHeaders: {
        'x-admin-api-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'your-very-secret-admin-key-12345'
      },
      transports: ['websocket'],
    });

    this.setupEventListeners();
    return this.socket;
  }

  // Connect as user (for mobile app)
  connectAsUser(userId: string, userType: 'resident' | 'technician') {
    if (this.socket) return this.socket;

    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      query: {
        userId: userId,
        userType: userType
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventListeners();
    
    // Register user with the server
    setTimeout(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('register-user', { userId, userType });
      }
    }, 1000);
    
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to notifications server');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log(' Disconnected from notifications server');
    });

    this.socket.on('registration-success', (data: any) => {
      console.log('User registered successfully:', data);
    });

    this.socket.on('new-notification', (notification: any) => {
      console.log('New notification received:', notification);
      this.handleNewNotification(notification);
    });

    this.socket.on('admin-notification', (data: any) => {
      console.log(' Admin notification:', data);
      this.handleAdminNotification(data);
    });

    this.socket.on('notification-sent', (data: any) => {
      console.log('Notification sent successfully:', data);
    });

    this.socket.on('notification-error', (error: any) => {
      console.error('Notification error:', error);
    });
  }

  private handleNewNotification(notification: any) {
    // Show browser notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }

    // Dispatch custom event for components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('new-notification', { 
        detail: notification 
      }));
    }
  }

  private handleAdminNotification(data: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-notification', { 
        detail: data 
      }));
    }
  }

  // Send notification (admin only)
  sendNotification(data: {
    targetUserIds: number[];
    title: string;
    message: string;
    audience: 'ALL' | 'RESIDENT' | 'TECHNICIAN';
  }) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('send-notification', data);
  }

  // Listen for specific events
  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const socketService = new SocketService();

// FIXED: Enhanced apiRequest function with better error handling
export const apiRequest = async <T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  try {
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-admin-api-key': ADMIN_ACCESS_KEY, 
      ...options.headers,
    };

    const config: RequestInit = {
      headers,
      ...options,
    };

    console.log(`Making API request to: ${API_BASE}${endpoint}`);

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // Handle HTTP errors
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorText = await response.text();
        console.error(`API error response for ${endpoint}:`, errorText);
        
        if (errorText) {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
          
          // Handle specific validation errors
          if (errorData.statusCode === 400 && errorData.message?.includes('numeric string')) {
            errorMessage = 'Validation error: Invalid parameter format. Please check your request.';
          }
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`API success response for ${endpoint}:`, data);
    return data as T;

  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`API call to ${endpoint} failed: ${error.message}`);
    } else {
      throw new Error(`API call to ${endpoint} failed with unknown error`);
    }
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

// Reports API
export const reportsAPI = {
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

  export: (reportId: number, format: 'csv'| 'pdf'| 'excel'): Promise<any> => {
    if(!reportId || isNaN(reportId) || reportId <=0) {
      throw new Error('Invalid report ID')
    }
    if(!['csv', 'pdf', 'excel'].includes(format)){
      throw new Error('Invalid fromat')
    }
    return apiRequest(`/reports/export/${reportId}?format=${format}`,{
      method: 'GET',
    })
  },

  // Delete a saved report
  delete: (reportId: number): Promise<void> =>
    apiRequest(`/reports/${reportId}`, {
      method: 'DELETE',
    }),
};

// Technicians API
export const techniciansAPI = {
  // Get all technicians with pagination and filtering
  getAll: (page: number = 1, limit: number = 100, status?: string): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });
    return apiRequest(`/technicians?${params.toString()}`,{
    });
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
}

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
  // Create new complaint
  create: (data: {
    title: string;
    description: string;
    category: string;
    urgency?: string;
    photos?: string[];
    locationData?: {
      latitude: number;
      longitude: number;
      address?: string;
      accuracy?: number;
    };
  }): Promise<any> =>
    apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get all complaints (admin)
  getAll: (
    page: number = 1,
    limit: number = 10,
    status?: string,
    urgency?: string,
    category?: string
  ): Promise<any> => {
    const params = new URLSearchParams();

    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    if (urgency) params.append('urgency', urgency);
    if (category) params.append('category', category);

    return apiRequest(`/complaints?${params.toString()}`);
  },

  // Get complaint by ID
  getById: (id: number): Promise<any> =>
    apiRequest(`/complaints/${id}`),

  // Get user's complaints
  getMyComplaints: (page: number = 1, limit: number = 10): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiRequest(`/complaints/my-complaints?${params.toString()}`);
  },

  // Get assigned complaints (technician)
  getAssignedComplaints: (page: number = 1, limit: number = 10): Promise<any> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return apiRequest(`/complaints/assigned?${params.toString()}`);
  },

  // Update complaint status
  updateStatus: (id: number, status: string, adminNotes?: string): Promise<any> =>
    apiRequest(`/complaints/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes }),
    }),

  // Assign technician
  assignTechnician: (complaintId: number, technicianId: number): Promise<any> =>
    apiRequest(`/complaints/${complaintId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ technicianId }),
    }),

  // Delete complaint
  delete: (id: number): Promise<any> =>
    apiRequest(`/complaints/${id}`, {
      method: 'DELETE',
    }),

  // Get complaint stats
  getStats: (): Promise<any> =>
    apiRequest('/complaints/stats'),
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