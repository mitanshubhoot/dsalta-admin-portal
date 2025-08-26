export interface ActivityLog {
  id: string;
  user_id?: string;
  tenant_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  ip?: string;
  user_agent?: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  entity_name?: string;
  organization_name?: string;
}

export interface ActivityFilters {
  q?: string;
  user_id?: string;
  tenant_id?: string;
  entity_type?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'action' | 'entity_type';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedActivities {
  data: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ActivityStats {
  total_activities: number;
  actions_by_type: Record<string, number>;
  entities_by_type: Record<string, number>;
  top_users: Array<{
    user_id: string;
    user_email: string;
    count: number;
  }>;
  top_entities: Array<{
    entity_type: string;
    entity_id: string;
    entity_name: string;
    count: number;
  }>;
  time_series: Array<{
    date: string;
    count: number;
  }>;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Vendor {
  id: string;
  name: string;
  domain?: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  details?: any;
}

export enum ActivityAction {
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  VENDOR_CREATE = 'vendor.create',
  VENDOR_UPDATE = 'vendor.update',
  VENDOR_DELETE = 'vendor.delete',
  VENDOR_VIEW = 'vendor.view',
  SCORE_VIEW = 'score.view',
  SCORE_UPDATE = 'score.update',
  INTEGRATION_CONNECT = 'integration.connect',
  INTEGRATION_UPDATE = 'integration.update',
  INTEGRATION_REMOVE = 'integration.remove',
  INTEGRATION_TEST = 'integration.test',
  SETTINGS_UPDATE = 'settings.update',
  REPORT_EXPORT = 'report.export',
  REPORT_GENERATE = 'report.generate',
  GENERAL_VIEW = 'general.view',
  GENERAL_SEARCH = 'general.search',
  SECURITY_LOGIN_FAILED = 'security.login_failed',
  SECURITY_ACCESS_DENIED = 'security.access_denied',
  SECURITY_PASSWORD_RESET = 'security.password_reset'
}

export enum EntityType {
  USER = 'user',
  VENDOR = 'vendor',
  SCORE = 'score',
  INTEGRATION = 'integration',
  ORGANIZATION = 'organization',
  REPORT = 'report',
  SETTINGS = 'settings',
  SECURITY = 'security',
  GENERAL = 'general'
}
