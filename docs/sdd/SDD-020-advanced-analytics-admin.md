# SDD-020: Advanced Analytics & Administration (Phase 15)

**Status:** Implemented
**Date:** 2026-02-15
**Phase:** 15
**Features:** F15.1-F15.5

---

## 1. Overview

Phase 15 introduces comprehensive analytics and administrative capabilities to ChoreChamp, enabling household managers to gain deep insights into chore completion patterns, system performance, and operational health. This phase consists of five integrated features:

- **F15.1 Advanced Reporting**: Generate customizable reports on chore completion rates, participation metrics, and historical trends with filtering and visualization capabilities.
- **F15.2 Admin Dashboard**: Centralized real-time dashboard displaying key household metrics, performance indicators, and system health status.
- **F15.3 Data Export**: Export household data in multiple formats (CSV, JSON, PDF) for external analysis and archival purposes.
- **F15.4 Audit Logging**: Comprehensive activity tracking of all administrative actions, data changes, and system events for compliance and troubleshooting.
- **F15.5 Performance Monitoring**: Track application performance metrics including API response times, database query performance, and resource utilization.

These features are tightly integrated through a unified AdminAnalytics page with a tabbed interface, shared API endpoints under the admin-analytics prefix, and coordinated database schema for efficient querying.

---

## 2. Architecture

### 2.1 Database Schema

All advanced analytics and administration data is stored in `packages/database/src/schema/advanced-analytics.ts` with the following tables:

#### advancedReports
```typescript
{
  id: string (primary key)
  householdId: string (foreign key)
  name: string
  description: string | null
  reportType: 'completion' | 'participation' | 'trend' | 'cost' | 'custom'
  filters: JSON
  dateRange: {
    startDate: Date
    endDate: Date
  }
  config: JSON
  createdAt: Date
  updatedAt: Date
  createdBy: string (user ID)
}
```

#### generatedReports
```typescript
{
  id: string (primary key)
  reportId: string (foreign key to advancedReports)
  householdId: string (foreign key)
  generatedAt: Date
  status: 'pending' | 'completed' | 'failed'
  data: JSON
  summary: JSON
  fileUrl: string | null
  downloadCount: number
  expiresAt: Date
}
```

#### dataExports
```typescript
{
  id: string (primary key)
  householdId: string (foreign key)
  exportType: 'full' | 'chores' | 'members' | 'history'
  format: 'csv' | 'json' | 'pdf'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  fileUrl: string | null
  fileSize: number
  recordCount: number
  createdAt: Date
  expiresAt: Date
  createdBy: string (user ID)
}
```

#### auditLogs
```typescript
{
  id: string (primary key)
  householdId: string (foreign key)
  userId: string (foreign key)
  action: 'create' | 'update' | 'delete' | 'export' | 'access'
  resourceType: 'chore' | 'member' | 'household' | 'report' | 'export'
  resourceId: string
  changes: JSON | null
  ipAddress: string
  userAgent: string
  status: 'success' | 'failure'
  errorMessage: string | null
  timestamp: Date
}
```

#### performanceMetrics
```typescript
{
  id: string (primary key)
  householdId: string | null (null for system-wide metrics)
  metricType: 'api_response_time' | 'db_query_time' | 'error_rate' | 'throughput'
  operation: string
  value: number (milliseconds for timing, percentage for rates)
  p50: number | null
  p95: number | null
  p99: number | null
  sampleCount: number
  timestamp: Date
}
```

### 2.2 API Routes

All advanced analytics endpoints are located in `apps/api/src/routes/advanced-analytics.ts` under the `/:householdId/admin-analytics` prefix.

Base route: `POST /api/households/:householdId/admin-analytics`

#### Route Structure
```
/:householdId/admin-analytics/
  POST   /reports
  GET    /reports
  GET    /reports/:reportId
  PATCH  /reports/:reportId
  DELETE /reports/:reportId

  POST   /reports/:reportId/generate
  GET    /reports/:reportId/generated
  GET    /reports/:reportId/generated/:generatedId

  POST   /dashboard/metrics
  GET    /dashboard/health
  GET    /dashboard/summary

  POST   /exports
  GET    /exports
  GET    /exports/:exportId
  DELETE /exports/:exportId

  GET    /audit-logs
  GET    /audit-logs/:logId

  GET    /performance/metrics
  GET    /performance/health
  GET    /performance/:metricType
```

### 2.3 Frontend Architecture

#### AdminAnalytics Page
Location: `apps/web/src/pages/AdminAnalytics.tsx`

The main container manages state and routing across five tabs:

- **ReportsTab**: Advanced report builder and manager
- **AdminDashboardTab**: Real-time metrics and KPI display
- **DataExportTab**: Export configuration and download management
- **AuditLogTab**: Activity log viewer with filtering
- **PerformanceTab**: System performance monitoring

Tab switching preserves state and filters within each tab.

### 2.4 Client SDK

Location: `packages/sdk/src/advanced-analytics/`

#### Key Exports
- `useAdvancedReports()`: Hook for report CRUD operations
- `useGenerateReport()`: Hook for triggering report generation
- `useAdminDashboard()`: Hook for dashboard metrics
- `useDataExports()`: Hook for export operations
- `useAuditLogs()`: Hook for audit log queries
- `usePerformanceMetrics()`: Hook for performance data

All hooks integrate with React Query for caching and synchronization.

---

## 3. API Endpoints

### 3.1 Advanced Reporting Endpoints

#### POST /reports
Create a new report template.

**Request:**
```json
{
  "name": "Monthly Completion Report",
  "reportType": "completion",
  "description": "Track chore completion rates by member",
  "dateRange": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  },
  "filters": {
    "memberIds": ["member-1", "member-2"],
    "choreCategories": ["household", "yard"]
  },
  "config": {
    "groupBy": "member",
    "includeCharts": true,
    "includeComparison": true
  }
}
```

**Response:** 201 Created
```json
{
  "id": "report-123",
  "householdId": "household-1",
  "name": "Monthly Completion Report",
  "reportType": "completion",
  "createdAt": "2026-02-15T10:00:00Z"
}
```

#### GET /reports
List all reports for a household.

**Query Parameters:**
- `sortBy`: 'name' | 'created' | 'updated' (default: 'updated')
- `order`: 'asc' | 'desc'
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response:** 200 OK
```json
{
  "reports": [
    {
      "id": "report-123",
      "name": "Monthly Completion Report",
      "reportType": "completion",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### GET /reports/:reportId
Retrieve a specific report template.

**Response:** 200 OK
```json
{
  "id": "report-123",
  "householdId": "household-1",
  "name": "Monthly Completion Report",
  "reportType": "completion",
  "dateRange": { "startDate": "2026-01-01", "endDate": "2026-01-31" },
  "filters": { "memberIds": ["member-1"], "choreCategories": ["household"] },
  "config": { "groupBy": "member" },
  "createdAt": "2026-02-15T10:00:00Z"
}
```

#### PATCH /reports/:reportId
Update a report template.

**Request:**
```json
{
  "name": "Updated Report Name",
  "config": { "groupBy": "category" }
}
```

**Response:** 200 OK

#### DELETE /reports/:reportId
Delete a report template.

**Response:** 204 No Content

#### POST /reports/:reportId/generate
Trigger report generation with current data.

**Request:**
```json
{
  "format": "pdf"
}
```

**Response:** 202 Accepted
```json
{
  "generatedId": "generated-456",
  "status": "pending"
}
```

#### GET /reports/:reportId/generated
List all generated instances of a report.

**Response:** 200 OK
```json
{
  "generated": [
    {
      "id": "generated-456",
      "generatedAt": "2026-02-15T11:00:00Z",
      "status": "completed",
      "fileUrl": "https://...",
      "downloadCount": 2
    }
  ]
}
```

#### GET /reports/:reportId/generated/:generatedId
Retrieve a specific generated report.

**Response:** 200 OK
```json
{
  "id": "generated-456",
  "status": "completed",
  "data": { "summary": { "totalChores": 45 } },
  "fileUrl": "https://...",
  "expiresAt": "2026-03-17T11:00:00Z"
}
```

### 3.2 Admin Dashboard Endpoints

#### GET /dashboard/summary
Retrieve high-level household statistics.

**Response:** 200 OK
```json
{
  "householdId": "household-1",
  "totalMembers": 4,
  "totalChores": 120,
  "completedChoresThisWeek": 45,
  "completionRate": 0.92,
  "averageCompletionTime": "2.5 days",
  "topPerformer": "Alice",
  "recentAlerts": 3
}
```

#### GET /dashboard/health
Check system health status for a household.

**Response:** 200 OK
```json
{
  "status": "healthy",
  "components": {
    "database": "healthy",
    "api": "healthy",
    "notifications": "healthy"
  },
  "lastUpdate": "2026-02-15T12:00:00Z",
  "alertCount": 0
}
```

#### POST /dashboard/metrics
Retrieve customized dashboard metrics.

**Request:**
```json
{
  "timeRange": "7days",
  "metrics": ["completionRate", "memberParticipation", "choreDistribution"],
  "granularity": "daily"
}
```

**Response:** 200 OK
```json
{
  "timeRange": "7days",
  "data": [
    {
      "date": "2026-02-08",
      "completionRate": 0.88,
      "memberParticipation": 3,
      "choreDistribution": { "household": 20, "yard": 8 }
    }
  ]
}
```

### 3.3 Data Export Endpoints

#### POST /exports
Create a new data export job.

**Request:**
```json
{
  "exportType": "full",
  "format": "csv"
}
```

**Response:** 202 Accepted
```json
{
  "id": "export-789",
  "status": "processing",
  "estimatedCompletionTime": "5 minutes"
}
```

#### GET /exports
List all exports for a household.

**Response:** 200 OK
```json
{
  "exports": [
    {
      "id": "export-789",
      "exportType": "full",
      "format": "csv",
      "status": "completed",
      "fileUrl": "https://...",
      "fileSize": 2048576,
      "recordCount": 1250,
      "createdAt": "2026-02-15T09:00:00Z",
      "expiresAt": "2026-03-17T09:00:00Z"
    }
  ]
}
```

#### GET /exports/:exportId
Retrieve export details and download link.

**Response:** 200 OK
```json
{
  "id": "export-789",
  "exportType": "full",
  "format": "csv",
  "status": "completed",
  "fileUrl": "https://...",
  "recordCount": 1250,
  "expiresAt": "2026-03-17T09:00:00Z"
}
```

#### DELETE /exports/:exportId
Delete an export file.

**Response:** 204 No Content

### 3.4 Audit Logging Endpoints

#### GET /audit-logs
Retrieve audit logs with filtering.

**Query Parameters:**
- `action`: Filter by action type
- `resourceType`: Filter by resource type
- `userId`: Filter by user
- `startDate`: Start of date range
- `endDate`: End of date range
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Response:** 200 OK
```json
{
  "logs": [
    {
      "id": "log-001",
      "userId": "user-123",
      "action": "update",
      "resourceType": "chore",
      "resourceId": "chore-456",
      "changes": {
        "status": { "from": "pending", "to": "completed" }
      },
      "timestamp": "2026-02-15T13:00:00Z",
      "status": "success"
    }
  ],
  "total": 1250
}
```

#### GET /audit-logs/:logId
Retrieve a specific audit log entry.

**Response:** 200 OK
```json
{
  "id": "log-001",
  "householdId": "household-1",
  "userId": "user-123",
  "action": "update",
  "resourceType": "chore",
  "resourceId": "chore-456",
  "changes": { "status": { "from": "pending", "to": "completed" } },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "status": "success",
  "timestamp": "2026-02-15T13:00:00Z"
}
```

### 3.5 Performance Monitoring Endpoints

#### GET /performance/metrics
Retrieve performance metrics for a time period.

**Query Parameters:**
- `timeRange`: '1hour' | '24hours' | '7days' | '30days'
- `metricTypes`: Array of metric types

**Response:** 200 OK
```json
{
  "metrics": [
    {
      "metricType": "api_response_time",
      "operation": "POST /chores",
      "value": 145,
      "p50": 120,
      "p95": 250,
      "p99": 350,
      "sampleCount": 5000
    }
  ],
  "period": "24hours"
}
```

#### GET /performance/health
Check overall system performance health.

**Response:** 200 OK
```json
{
  "status": "healthy",
  "apiResponseTime": 150,
  "errorRate": 0.01,
  "throughput": 1000,
  "databaseHealth": "healthy",
  "cacheHitRate": 0.85,
  "lastUpdate": "2026-02-15T14:00:00Z"
}
```

#### GET /performance/:metricType
Retrieve detailed metrics for a specific type.

**Response:** 200 OK
```json
{
  "metricType": "api_response_time",
  "dataPoints": [
    {
      "timestamp": "2026-02-15T14:00:00Z",
      "value": 145,
      "p95": 250
    }
  ],
  "summary": {
    "average": 142,
    "min": 50,
    "max": 500,
    "trend": "stable"
  }
}
```

---

## 4. Data Models

### 4.1 Report Types

#### Completion Reports
Track which chores have been completed and by whom over a time period.

**Key Metrics:**
- Total chores assigned vs. completed
- Completion rate by member
- Average completion time
- On-time vs. late completions

#### Participation Reports
Analyze member engagement and contribution patterns.

**Key Metrics:**
- Tasks completed per member
- Average tasks per member
- Member engagement trend
- Peak activity times

#### Trend Reports
Show patterns and changes over time.

**Key Metrics:**
- Completion rate trend
- Member participation trend
- Seasonal patterns
- Workload distribution changes

#### Cost Reports
Estimate household costs based on chore data.

**Key Metrics:**
- Estimated labor cost
- Cost per member
- Cost trend over time

#### Custom Reports
User-defined reports with flexible filtering and grouping.

### 4.2 Export Formats

#### CSV Export
Tabular format suitable for spreadsheet analysis. Includes headers and supports multiple tables exported separately or combined.

#### JSON Export
Structured format preserving data relationships and types. Includes nested objects for related data.

#### PDF Export
Human-readable formatted reports with charts, summaries, and professional styling.

### 4.3 Audit Log Categories

| Action | Description |
|--------|-------------|
| create | Resource created |
| update | Resource modified |
| delete | Resource removed |
| export | Data exported |
| access | Resource accessed or queried |

| Resource Type | Description |
|---------------|-------------|
| chore | Chore task |
| member | Household member |
| household | Household settings/config |
| report | Report template or generation |
| export | Data export |

---

## 5. Frontend Components

### 5.1 ReportsTab
Advanced report builder and management interface.

**Key Components:**
- **ReportBuilder**: Form-based interface for creating and editing report templates
- **ReportList**: Table displaying all available reports with actions
- **GeneratedReportViewer**: Display and download generated reports
- **AdvancedFilters**: Multi-field filtering for report data
- **ChartRenderer**: Visualization of report data with multiple chart types

**Features:**
- Template creation and management
- On-demand report generation
- Report scheduling (future enhancement)
- Data visualization
- Export to multiple formats

### 5.2 AdminDashboardTab
Real-time analytics dashboard with KPIs and health metrics.

**Key Components:**
- **KPICards**: Display key metrics (completion rate, member count, etc.)
- **MetricChart**: Time-series visualization of selected metrics
- **HealthStatus**: System and component health indicators
- **RecentActivity**: Quick view of recent events
- **AlertPanel**: Display system alerts and issues

**Features:**
- Customizable time ranges
- Metric selection and filtering
- Real-time updates via WebSocket
- Performance benchmarking

### 5.3 DataExportTab
Export configuration and management interface.

**Key Components:**
- **ExportBuilder**: Form to configure export parameters
- **ExportList**: Table of past and current exports
- **ExportProgress**: Real-time progress indicator for active exports
- **FormatSelector**: Choose export format (CSV, JSON, PDF)
- **ExportTypeSelector**: Select data to export

**Features:**
- Multiple export type options
- Format selection
- Progress tracking
- Download management
- Automatic expiration

### 5.4 AuditLogTab
Activity log viewer with advanced filtering and search.

**Key Components:**
- **AuditLogTable**: Paginated table of audit entries
- **LogFilters**: Filter by action, resource, user, date
- **LogDetails**: Detailed view of a single log entry with change tracking
- **SearchBar**: Full-text search of audit logs
- **ExportLogs**: Export audit trail

**Features:**
- Advanced filtering
- Change history visualization
- User activity tracking
- Compliance reporting
- Search and pagination

### 5.5 PerformanceTab
System performance monitoring and diagnostics.

**Key Components:**
- **HealthStatus**: Overall system health indicator
- **PerformanceChart**: Time-series performance metrics
- **MetricDetail**: Detailed view of specific metrics
- **AlertHistory**: Historical alerts and resolution
- **PerformanceTrends**: Trend analysis and forecasting

**Features:**
- Real-time metric display
- Performance trending
- Alert management
- Diagnostic information
- Performance history

---

## 6. Security

### 6.1 Authentication & Authorization

All endpoints require authentication via Clerk. Additional authorization checks ensure:

- **Report Access**: Only household admins can create/edit/delete reports
- **Export Access**: Only household admins can create exports
- **Audit Logs**: Only household admins can view audit logs
- **Performance Metrics**: Only household admins can access performance data
- **Dashboard**: Only household admins can view admin dashboard

### 6.2 Audit Trail

All administrative actions are automatically logged:

- Who performed the action (user ID)
- What action was performed
- What resource was affected
- When the action occurred
- IP address and user agent
- Result (success/failure)
- Any data changes

Audit logs are immutable and retained for compliance purposes.

### 6.3 Data Privacy

- Exported data includes only household data to which the user has access
- Personally identifiable information is handled according to privacy policy
- Data exports automatically expire after 30 days
- Audit logs do not include sensitive data like passwords

### 6.4 Rate Limiting

- Report generation: 10 per hour per household
- Data exports: 5 per hour per household
- Audit log queries: 100 per minute per user
- Performance metric queries: 100 per minute per user

---

## 7. Integration Points

### 7.1 Chore Module Integration
Reports and analytics reference chore data for completion metrics and historical analysis.

### 7.2 Member/Household Integration
User and household data integrated for participation tracking and member-based filtering.

### 7.3 Notification System Integration
Performance alerts and export completion notifications sent through notification system.

### 7.4 Database Integration
Direct schema queries for report generation and metric aggregation.

---

## 8. Testing

### 8.1 Unit Tests
- Type definitions and schema validation
- Data model transformations
- Filter and aggregation logic
- Date range calculations
- Report configuration validation

### 8.2 Integration Tests
- Complete report creation and generation workflow
- Export job creation and completion
- Audit log recording for all admin actions
- Performance metric collection
- Dashboard metric aggregation

### 8.3 End-to-End Tests
- AdminAnalytics page tab navigation and state management
- Report builder to generation to download workflow
- Export creation and download workflow
- Audit log filtering and searching
- Performance metric real-time updates

### 8.4 Coverage Requirements
- Unit: 80% minimum
- Integration: 80% minimum
- E2E: 80% of critical paths

### 8.5 Test Files

All functionality covered by test suites:
- `packages/database/src/schema/advanced-analytics.test.ts`
- `packages/sdk/src/advanced-analytics/index.test.ts`
- `packages/sdk/src/advanced-analytics/hooks.test.ts`
- `apps/api/src/routes/advanced-analytics.test.ts`
- `apps/web/src/pages/AdminAnalytics.test.tsx`
- `apps/web/src/components/AdminAnalytics/ReportsTab.test.tsx`
- `apps/web/src/components/AdminAnalytics/AdminDashboardTab.test.tsx`
- `apps/web/src/components/AdminAnalytics/DataExportTab.test.tsx`
- `apps/web/src/components/AdminAnalytics/AuditLogTab.test.tsx`
- `apps/web/src/components/AdminAnalytics/PerformanceTab.test.tsx`

---

## 9. Future Enhancements

- Report scheduling and automated generation
- Machine learning based anomaly detection
- Custom metric definitions
- Advanced forecasting and predictive analytics
- Integration with external BI tools
- Role-based dashboard customization
- Real-time alerting system
- Performance optimization recommendations

---

## 10. References

- SDD-001: Authentication
- SDD-002: Household Management
- SDD-003: Chores & Tasks
- SDD-004: Gamification System
- SDD-005: Notifications

---

**Document Version:** 1.0
**Last Updated:** 2026-02-15
**Prepared by:** Daniel Hernandez
