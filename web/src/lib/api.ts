import axios, { AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import {
  ActivityLog,
  ActivityFilters,
  PaginatedActivities,
  ActivityStats,
  User,
  Vendor,
  Organization,
  LoginRequest,
  LoginResponse,
  ApiResponse
} from '@/types';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Auth token management
const AUTH_TOKEN_KEY = 'admin_portal_token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message) {
      toast.error(error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  verify: async (): Promise<{ user: any }> => {
    const response = await api.get<{ user: any }>('/auth/verify');
    return response.data;
  },
};

// Activities API
export const activitiesApi = {
  getActivities: async (filters: ActivityFilters): Promise<PaginatedActivities> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<{ success: boolean; data: PaginatedActivities }>(`/activities?${params}`);
    return response.data.data;
  },

  getActivity: async (id: string): Promise<ActivityLog> => {
    const response = await api.get<{ success: boolean; data: ActivityLog }>(`/activities/${id}`);
    return response.data.data;
  },

  exportToCsv: async (filters: ActivityFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/activities/export/csv?${params}`, {
      responseType: 'blob',
    });
    
    return response.data;
  },
};

// Stats API
export const statsApi = {
  getOverview: async (filters?: Partial<ActivityFilters>): Promise<ActivityStats> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get<{ success: boolean; data: ActivityStats }>(`/stats/overview?${params}`);
    return response.data.data;
  },

  getSummary: async (): Promise<{
    activities_today: number;
    activities_this_week: number;
    activities_this_month: number;
    total_activities: number;
    active_users_today: number;
    most_common_action: string;
    most_active_entity_type: string;
  }> => {
    const response = await api.get<{ success: boolean; data: any }>('/stats/summary');
    return response.data.data;
  },

  getDashboardKPIs: async (filters?: { from?: string; to?: string; orgId?: string }): Promise<any> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get<{ success: boolean; data: any }>(`/stats/dashboard?${params}`);
    return response.data.data;
  },

  getTimeSeries: async (filters: { 
    from: string; 
    to: string; 
    source: string; 
    granularity?: 'hour' | 'day'; 
    orgId?: string; 
  }): Promise<any[]> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<{ success: boolean; data: any[] }>(`/stats/timeseries?${params}`);
    return response.data.data;
  },

  getTopLists: async (filters?: { from?: string; to?: string; orgId?: string }): Promise<any> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get<{ success: boolean; data: any }>(`/stats/toplists?${params}`);
    return response.data.data;
  },
};

// Detailed Activities API
export const detailedActivitiesApi = {
  getLogins: async (filters: { 
    from: string; 
    to: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
    success?: boolean 
  }): Promise<any> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<{ success: boolean; data: any }>(`/activities-detailed/logins?${params}`);
    return response.data.data;
  },

  getTasks: async (filters: { 
    from: string; 
    to: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string; 
    framework?: string 
  }): Promise<any> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<{ success: boolean; data: any }>(`/activities-detailed/tasks?${params}`);
    return response.data.data;
  },

  getDocuments: async (filters: { 
    from: string; 
    to: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string; 
    type?: string 
  }): Promise<any> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<{ success: boolean; data: any }>(`/activities-detailed/documents?${params}`);
    return response.data.data;
  },

  getVendorScans: async (filters: { 
    from: string; 
    to: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
    grade?: string; 
    minScore?: number 
  }): Promise<any> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<{ success: boolean; data: any }>(`/activities-detailed/vendor-scans?${params}`);
    return response.data.data;
  },

  getSecurityTests: async (filters: { 
    from: string; 
    to: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
    result?: string 
  }): Promise<any> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<{ success: boolean; data: any }>(`/activities-detailed/security-tests?${params}`);
    return response.data.data;
  },

  getAudits: async (filters: { 
    from: string; 
    to: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
    grade?: string; 
    minScore?: number 
  }): Promise<any> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<{ success: boolean; data: any }>(`/activities-detailed/audits?${params}`);
    return response.data.data;
  },
};

// Users API
export const usersApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<{ success: boolean; data: User[] }>('/users');
    return response.data.data;
  },

  getOrganizations: async (): Promise<Organization[]> => {
    const response = await api.get<{ success: boolean; data: Organization[] }>('/users/organizations');
    return response.data.data;
  },
};

// Vendors API
export const vendorsApi = {
  getVendors: async (): Promise<Vendor[]> => {
    const response = await api.get<{ success: boolean; data: Vendor[] }>('/vendors');
    return response.data.data;
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<any> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// User Journey API
export const userJourneyApi = {
  searchUsers: async (search?: string, limit: number = 20): Promise<any> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit.toString());

    const response = await api.get<{ success: boolean; data: any }>(`/user-journey/search/users?${params}`);
    return response.data.data;
  },

  getUserJourney: async (userEmail: string, dateRange?: { from: string; to: string }): Promise<any> => {
    const params = new URLSearchParams();
    if (dateRange?.from) params.append('from', dateRange.from);
    if (dateRange?.to) params.append('to', dateRange.to);

    const response = await api.get<{ success: boolean; data: any }>(`/user-journey/${encodeURIComponent(userEmail)}?${params}`);
    return response.data.data;
  }
};

// Vendor Management API
export const vendorManagementApi = {
  getOverview: async (filters?: { from?: string; to?: string; orgId?: string }): Promise<any> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get<{ success: boolean; data: any }>(`/vendor-management/overview?${params}`);
    return response.data.data;
  },

  searchVendors: async (filters: {
    search?: string;
    risk_level?: string;
    organization_id?: string;
    review_status?: string;
    has_contract?: boolean;
    min_score?: number;
    max_score?: number;
    added_by?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<any> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<{ success: boolean; data: any }>(`/vendor-management/search?${params}`);
    return response.data.data;
  },

  getVendorDetails: async (vendorId: string): Promise<any> => {
    const response = await api.get<{ success: boolean; data: any }>(`/vendor-management/${vendorId}/details`);
    return response.data.data;
  },

  getTopRiskVendors: async (limit: number = 10): Promise<any> => {
    const response = await api.get<{ success: boolean; data: any }>(`/vendor-management/top-risk?limit=${limit}`);
    return response.data.data;
  },

  getVendorsByOrganization: async (): Promise<any> => {
    const response = await api.get<{ success: boolean; data: any }>('/vendor-management/by-organization');
    return response.data.data;
  },

  getContractSummary: async (): Promise<any> => {
    const response = await api.get<{ success: boolean; data: any }>('/vendor-management/contracts/summary');
    return response.data.data;
  },

  getSecurityTrends: async (from: string, to: string): Promise<any> => {
    const response = await api.get<{ success: boolean; data: any }>(`/vendor-management/security-trends?from=${from}&to=${to}`);
    return response.data.data;
  },

  getRecentActivities: async (from: string, to: string, limit: number = 50): Promise<any> => {
    const response = await api.get<{ success: boolean; data: any }>(`/vendor-management/activities/recent?from=${from}&to=${to}&limit=${limit}`);
    return response.data.data;
  },

  getRecentVendors: async (limit: number = 20): Promise<any> => {
    const response = await api.get<{ success: boolean; data: any }>(`/vendor-management/recent?limit=${limit}`);
    return response.data.data;
  },

  getStats: async (from: string, to: string, orgId?: string): Promise<any> => {
    const params = new URLSearchParams();
    params.append('from', from);
    params.append('to', to);
    if (orgId) params.append('orgId', orgId);

    const response = await api.get<{ success: boolean; data: any }>(`/vendor-management/stats?${params}`);
    return response.data.data;
  }
};

export default api;
