// F15.1 Advanced Reporting
export type ReportType = 'chore_completion' | 'member_performance' | 'household_overview' | 'gamification' | 'wellness' | 'custom';
export type ReportFormat = 'pdf' | 'csv' | 'json' | 'excel';
export type ReportSchedule = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface AdvancedReport {
  id: string;
  householdId: string;
  createdById: string;
  reportType: ReportType;
  title: string;
  description: string | null;
  config: ReportConfig;
  schedule: ReportSchedule | null;
  lastGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportConfig {
  dateRange: { start: string; end: string } | null;
  memberIds: string[];
  metrics: string[];
  groupBy: 'day' | 'week' | 'month' | null;
  includeCharts: boolean;
  format: ReportFormat;
}

export interface GeneratedReport {
  id: string;
  reportId: string;
  format: ReportFormat;
  fileUrl: string | null;
  fileSize: number;
  generatedAt: string;
  expiresAt: string;
}

export interface CreateAdvancedReportRequest {
  reportType: ReportType;
  title: string;
  description?: string | null;
  config: ReportConfig;
  schedule?: ReportSchedule | null;
}

export interface UpdateAdvancedReportRequest {
  title?: string;
  description?: string | null;
  config?: Partial<ReportConfig>;
  schedule?: ReportSchedule | null;
}

// F15.2 Admin Dashboard
export interface AdminDashboard {
  householdId: string;
  memberCount: number;
  activeMembers: number;
  totalChoresCreated: number;
  totalCompletions: number;
  completionRate: number;
  averagePointsPerMember: number;
  topPerformers: AdminMemberSummary[];
  recentActivity: AdminActivityItem[];
  systemHealth: SystemHealthStatus;
  alerts: AdminAlert[];
}

export interface AdminMemberSummary {
  memberId: string;
  memberName: string;
  role: string;
  completionRate: number;
  totalPoints: number;
  streakDays: number;
  lastActiveAt: string | null;
}

export interface AdminActivityItem {
  id: string;
  type: string;
  description: string;
  memberId: string | null;
  memberName: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  responseTimeMs: number;
  errorRate: number;
  activeConnections: number;
  lastCheckedAt: string;
}

export interface AdminAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// F15.3 Data Export
export type DataExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
export type DataExportScope = 'full' | 'chores' | 'members' | 'gamification' | 'wellness' | 'activity';

export interface DataExportRequest {
  scope: DataExportScope[];
  format: ReportFormat;
  includeAttachments: boolean;
  dateRange?: { start: string; end: string };
}

export interface DataExport {
  id: string;
  householdId: string;
  requestedById: string;
  scope: DataExportScope[];
  format: ReportFormat;
  status: DataExportStatus;
  fileUrl: string | null;
  fileSize: number | null;
  includeAttachments: boolean;
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  error: string | null;
}

// F15.4 Audit Logging
export type AuditAction =
  | 'member.added' | 'member.removed' | 'member.role_changed'
  | 'chore.created' | 'chore.updated' | 'chore.deleted' | 'chore.completed' | 'chore.approved'
  | 'reward.created' | 'reward.redeemed' | 'reward.approved'
  | 'household.settings_changed' | 'household.theme_changed'
  | 'report.generated' | 'data.exported'
  | 'admin.login' | 'admin.settings_changed';

export interface AuditLogEntry {
  id: string;
  householdId: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  description: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

export interface AuditLogQuery {
  actorId?: string;
  action?: AuditAction;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// F15.5 Performance Monitoring
export interface PerformanceMetrics {
  householdId: string;
  period: string;
  apiResponseTimeP50: number;
  apiResponseTimeP95: number;
  apiResponseTimeP99: number;
  errorRate: number;
  requestsPerMinute: number;
  activeUsers: number;
  peakConcurrentUsers: number;
  databaseQueryTimeAvg: number;
  cacheHitRate: number;
  uptimePercentage: number;
  measuredAt: string;
}

export interface UsageMetrics {
  householdId: string;
  period: string;
  totalApiCalls: number;
  uniqueUsers: number;
  featureUsage: Record<string, number>;
  peakHour: number;
  averageSessionDuration: number;
  mostUsedEndpoints: { endpoint: string; count: number }[];
  measuredAt: string;
}

export interface ErrorMetric {
  id: string;
  errorType: string;
  message: string;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
  isResolved: boolean;
}

// Audit log summary types
export interface AuditLogActor {
  actorId: string;
  actorName: string;
  actionCount: number;
}

export interface AuditLogSummary {
  totalActions: number;
  actionBreakdown: Record<string, number>;
  topActors: AuditLogActor[];
  recentActions: AuditLogEntry[];
}
