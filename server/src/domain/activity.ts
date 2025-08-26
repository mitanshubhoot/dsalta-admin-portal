export enum ActivityAction {
  // User actions
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  
  // Vendor actions
  VENDOR_CREATE = 'vendor.create',
  VENDOR_UPDATE = 'vendor.update',
  VENDOR_DELETE = 'vendor.delete',
  VENDOR_VIEW = 'vendor.view',
  
  // Score actions
  SCORE_VIEW = 'score.view',
  SCORE_UPDATE = 'score.update',
  
  // Integration actions
  INTEGRATION_CONNECT = 'integration.connect',
  INTEGRATION_UPDATE = 'integration.update',
  INTEGRATION_REMOVE = 'integration.remove',
  INTEGRATION_TEST = 'integration.test',
  
  // Task actions
  TASK_CREATE = 'task.create',
  TASK_UPDATE = 'task.update',
  TASK_DELETE = 'task.delete',
  
  // Test actions
  TEST_CREATE = 'test.create',
  TEST_UPDATE = 'test.update',
  TEST_DELETE = 'test.delete',
  TEST_EXECUTE = 'test.execute',
  
  // Settings actions
  SETTINGS_UPDATE = 'settings.update',
  
  // Report actions
  REPORT_EXPORT = 'report.export',
  REPORT_GENERATE = 'report.generate',
  
  // General actions
  GENERAL_VIEW = 'general.view',
  GENERAL_SEARCH = 'general.search',
  
  // Security actions
  SECURITY_LOGIN_FAILED = 'security.login_failed',
  SECURITY_ACCESS_DENIED = 'security.access_denied',
  SECURITY_PASSWORD_RESET = 'security.password_reset'
}

export enum EntityType {
  USER = 'user',
  VENDOR = 'vendor',
  SCORE = 'score',
  INTEGRATION = 'integration',
  TASK = 'task',
  TEST = 'test',
  ORGANIZATION = 'organization',
  REPORT = 'report',
  SETTINGS = 'settings',
  SECURITY = 'security',
  GENERAL = 'general'
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  tenant_id?: string;
  action: ActivityAction;
  entity_type: EntityType;
  entity_id?: string;
  entity_name?: string;
  metadata?: Record<string, any>;
  ip?: string;
  user_agent?: string;
  created_at: Date;
}

export interface ActivityLogWithDetails extends ActivityLog {
  user_email?: string;
  user_name?: string;
  entity_name?: string;
  organization_name?: string;
}

export interface ActivityFilters {
  q?: string;
  user_id?: string;
  tenant_id?: string;
  entity_type?: EntityType;
  action?: ActivityAction;
  date_from?: Date;
  date_to?: Date;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'action' | 'entity_type';
  sort_order?: 'asc' | 'desc';
}

export interface ActivityStats {
  total_activities: number;
  actions_by_type: Record<string, number>;
  entities_by_type: Record<string, number>;
  top_users: Array<{ user_id: string; user_email: string; count: number }>;
  top_entities: Array<{ entity_type: string; entity_id: string; entity_name: string; count: number }>;
  time_series: Array<{ date: string; count: number }>;
}

export interface PaginatedActivities {
  data: ActivityLogWithDetails[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
