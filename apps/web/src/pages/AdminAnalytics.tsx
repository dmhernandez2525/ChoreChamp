import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useAdvancedReports,
  useAdminDashboard,
  useAdminAlerts,
  useDataExports,
  useAuditLogs,
  useAuditLogSummary,
  usePerformanceMetrics,
  useUsageMetrics,
  useErrorMetrics,
} from '@chorechamp/api-client';
import {
  FileText,
  LayoutDashboard,
  Download,
  Shield,
  Activity,
  ChevronLeft,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
  XCircle,
} from 'lucide-react';

type AnalyticsTab = 'reports' | 'admin' | 'export' | 'audit' | 'performance';

function LoadingState({ label }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
      }}
    >
      <Loader2
        size={32}
        style={{
          color: 'var(--app-accent)',
          animation: 'spin 1s linear infinite',
          marginBottom: '12px',
        }}
      />
      {label && (
        <p style={{ color: 'var(--app-text-muted)', fontSize: '14px', margin: 0 }}>{label}</p>
      )}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        background: 'var(--app-surface)',
        borderRadius: '12px',
        border: '1px solid var(--app-border)',
      }}
    >
      <XCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
      <p style={{ color: '#ef4444', fontSize: '14px', margin: 0, textAlign: 'center' }}>
        {message}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: string | number;
  isLoading?: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--app-surface)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--app-border)',
      }}
    >
      <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: '700' }}>
        {isLoading ? (
          <div
            style={{
              width: '60px',
              height: '28px',
              background: 'var(--app-border)',
              borderRadius: '6px',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function ReportsTab({ householdId }: { householdId: string }) {
  const { data, isLoading, error } = useAdvancedReports(householdId);

  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;

  const reportTypes = [
    'Chore Completion',
    'Member Performance',
    'Household Overview',
    'Gamification',
    'Wellness',
    'Custom',
  ];

  const scheduledCount = reports.filter((r) => r.schedule !== null).length;
  const generatedCount = reports.filter((r) => r.lastGeneratedAt !== null).length;
  const lastGenerated = reports
    .filter((r) => r.lastGeneratedAt)
    .sort((a, b) => new Date(b.lastGeneratedAt!).getTime() - new Date(a.lastGeneratedAt!).getTime())[0];

  const lastGeneratedLabel = lastGenerated?.lastGeneratedAt
    ? new Date(lastGenerated.lastGeneratedAt).toLocaleDateString()
    : 'Never';

  if (error) {
    return <ErrorState message={`Failed to load reports: ${(error as Error).message}`} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Advanced Reports</h2>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--app-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          Create Report
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        <MetricCard label="Total Reports" value={total} isLoading={isLoading} />
        <MetricCard label="Scheduled" value={scheduledCount} isLoading={isLoading} />
        <MetricCard label="Generated" value={generatedCount} isLoading={isLoading} />
        <MetricCard label="Last Generated" value={lastGeneratedLabel} isLoading={isLoading} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {reportTypes.map((type) => (
          <button
            key={type}
            style={{
              padding: '16px',
              background: 'var(--app-surface)',
              border: '1px solid var(--app-border)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textAlign: 'left',
              color: 'var(--app-text)',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState label="Loading reports..." />
      ) : reports.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            background: 'var(--app-surface)',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <FileText size={48} style={{ color: 'var(--app-text-muted)', marginBottom: '16px' }} />
          <p style={{ color: 'var(--app-text-muted)', fontSize: '14px', margin: 0 }}>
            No reports created yet. Click "Create Report" to get started.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {reports.map((report) => (
            <div
              key={report.id}
              style={{
                background: 'var(--app-surface)',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid var(--app-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{report.title}</div>
                <div style={{ color: 'var(--app-text-muted)', fontSize: '12px', marginTop: '4px' }}>
                  {report.reportType} {report.schedule ? `(${report.schedule})` : ''}
                </div>
              </div>
              <div style={{ color: 'var(--app-text-muted)', fontSize: '12px' }}>
                {report.lastGeneratedAt
                  ? `Last: ${new Date(report.lastGeneratedAt).toLocaleDateString()}`
                  : 'Never generated'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminDashboardTab({ householdId }: { householdId: string }) {
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useAdminDashboard(householdId);
  const { data: alertsData, isLoading: alertsLoading } = useAdminAlerts(householdId);

  const isLoading = dashLoading || alertsLoading;
  const topPerformers = dashboard?.topPerformers ?? [];
  const recentActivity = dashboard?.recentActivity ?? [];
  const systemHealth = dashboard?.systemHealth;
  const alerts = alertsData?.alerts ?? [];

  if (dashError) {
    return <ErrorState message={`Failed to load dashboard: ${(dashError as Error).message}`} />;
  }

  const healthStatusIcon = (() => {
    const status = systemHealth?.status ?? 'healthy';
    if (status === 'healthy') return <CheckCircle size={20} style={{ color: '#10b981' }} />;
    if (status === 'degraded') return <AlertTriangle size={20} style={{ color: '#f59e0b' }} />;
    return <XCircle size={20} style={{ color: '#ef4444' }} />;
  })();

  const healthStatusLabel = (() => {
    const status = systemHealth?.status ?? 'healthy';
    return status.charAt(0).toUpperCase() + status.slice(1);
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Admin Dashboard</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        <MetricCard
          label="Total Members"
          value={dashboard?.memberCount ?? 0}
          isLoading={isLoading}
        />
        <MetricCard
          label="Active Today"
          value={dashboard?.activeMembers ?? 0}
          isLoading={isLoading}
        />
        <MetricCard
          label="Completion Rate"
          value={`${Math.round(dashboard?.completionRate ?? 0)}%`}
          isLoading={isLoading}
        />
        <MetricCard
          label="Avg Points"
          value={Math.round(dashboard?.averagePointsPerMember ?? 0)}
          isLoading={isLoading}
        />
      </div>

      {alerts.length > 0 && (
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
              Alerts ({alerts.filter((a) => !a.isRead).length} unread)
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: alert.isRead ? 'transparent' : 'var(--app-bg)',
                  border: `1px solid ${alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#f59e0b' : 'var(--app-border)'}`,
                  fontSize: '13px',
                }}
              >
                <div style={{ fontWeight: '600' }}>{alert.title}</div>
                <div style={{ color: 'var(--app-text-muted)', marginTop: '2px' }}>
                  {alert.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          background: 'var(--app-surface)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--app-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <TrendingUp size={18} style={{ color: 'var(--app-accent)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Top Performers</h3>
        </div>
        {isLoading ? (
          <LoadingState label="Loading performers..." />
        ) : topPerformers.length === 0 ? (
          <p style={{ color: 'var(--app-text-muted)', fontSize: '14px', margin: 0 }}>
            No performance data available yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topPerformers.slice(0, 5).map((member, idx) => (
              <div
                key={member.memberId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom:
                    idx < topPerformers.length - 1 ? '1px solid var(--app-border)' : 'none',
                  fontSize: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--app-text-muted)', width: '20px' }}>
                    #{idx + 1}
                  </span>
                  <span style={{ fontWeight: '500' }}>{member.memberName}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--app-text-muted)', fontSize: '13px' }}>
                  <span>{member.totalPoints} pts</span>
                  <span>{Math.round(member.completionRate)}%</span>
                  <span>{member.streakDays}d streak</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          background: 'var(--app-surface)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--app-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <Clock size={18} style={{ color: 'var(--app-accent)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Recent Activity</h3>
        </div>
        {isLoading ? (
          <LoadingState label="Loading activity..." />
        ) : recentActivity.length === 0 ? (
          <p style={{ color: 'var(--app-text-muted)', fontSize: '14px', margin: 0 }}>
            No recent activity to display.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentActivity.slice(0, 10).map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ fontWeight: '500' }}>{item.memberName ?? 'System'}</span>
                  <span style={{ color: 'var(--app-text-muted)', marginLeft: '8px' }}>
                    {item.description}
                  </span>
                </div>
                <span style={{ color: 'var(--app-text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          background: 'var(--app-surface)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--app-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <Activity size={18} style={{ color: 'var(--app-accent)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>System Health</h3>
        </div>
        {isLoading ? (
          <LoadingState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {healthStatusIcon}
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{healthStatusLabel}</span>
            </div>
            {systemHealth && (
              <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--app-text-muted)' }}>
                <span>Uptime: {String((systemHealth as unknown as Record<string, unknown>).uptimePercentage ?? systemHealth.uptime)}%</span>
                <span>Response: {systemHealth.responseTimeMs}ms</span>
                <span>Error rate: {(systemHealth.errorRate * 100).toFixed(2)}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DataExportTab({ householdId }: { householdId: string }) {
  const { data: exportsData, isLoading, error } = useDataExports(householdId);

  const exports = exportsData?.exports ?? [];

  const exportScopes = [
    'Full Backup',
    'Chores',
    'Members',
    'Gamification',
    'Wellness',
    'Activity',
  ];

  const formats = ['PDF', 'CSV', 'JSON', 'Excel'];

  if (error) {
    return <ErrorState message={`Failed to load exports: ${(error as Error).message}`} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Data Export</h2>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'var(--app-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          New Export
        </button>
      </div>

      <div
        style={{
          background: 'var(--app-surface)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--app-border)',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Export Scope</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {exportScopes.map((scope) => (
            <label
              key={scope}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <input type="checkbox" />
              {scope}
            </label>
          ))}
        </div>
      </div>

      <div
        style={{
          background: 'var(--app-surface)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--app-border)',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Format</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          {formats.map((format) => (
            <button
              key={format}
              style={{
                padding: '10px 20px',
                background: 'var(--app-surface-muted)',
                border: '1px solid var(--app-border)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                color: 'var(--app-text)',
              }}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: 'var(--app-surface)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--app-border)',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          Export History
        </h3>
        {isLoading ? (
          <LoadingState label="Loading export history..." />
        ) : exports.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
            }}
          >
            <Download
              size={48}
              style={{ color: 'var(--app-text-muted)', marginBottom: '16px' }}
            />
            <p style={{ color: 'var(--app-text-muted)', fontSize: '14px', margin: 0 }}>
              No exports created yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {exports.map((exp) => (
              <div
                key={exp.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'var(--app-bg)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ fontWeight: '500' }}>
                    {exp.scope.join(', ')}
                  </span>
                  <span style={{ color: 'var(--app-text-muted)', marginLeft: '8px' }}>
                    ({exp.format.toUpperCase()})
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background:
                        exp.status === 'completed'
                          ? '#dcfce7'
                          : exp.status === 'failed'
                            ? '#fee2e2'
                            : '#fef9c3',
                      color:
                        exp.status === 'completed'
                          ? '#166534'
                          : exp.status === 'failed'
                            ? '#991b1b'
                            : '#854d0e',
                    }}
                  >
                    {exp.status}
                  </span>
                  <span style={{ color: 'var(--app-text-muted)', fontSize: '12px' }}>
                    {new Date(exp.requestedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AuditLogTab({ householdId }: { householdId: string }) {
  const [actorFilter, setActorFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');

  const query: Record<string, string> = {};
  if (actorFilter) query.actorId = actorFilter;
  if (actionFilter) query.action = actionFilter;

  const { data: logsData, isLoading: logsLoading, error: logsError } = useAuditLogs(
    householdId,
    Object.keys(query).length > 0 ? (query as Parameters<typeof useAuditLogs>[1]) : undefined,
  );
  const { data: summary, isLoading: summaryLoading } = useAuditLogSummary(householdId);

  const isLoading = logsLoading || summaryLoading;
  const logs = logsData?.logs ?? [];
  const totalActions = summary?.totalActions ?? 0;
  const topActors = summary?.topActors ?? [];

  if (logsError) {
    return <ErrorState message={`Failed to load audit logs: ${(logsError as Error).message}`} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Audit Log</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: '16px',
        }}
      >
        <MetricCard label="Total Actions" value={totalActions} isLoading={isLoading} />
      </div>

      <div
        style={{
          background: 'var(--app-surface)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--app-border)',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              background: 'var(--app-bg)',
              border: '1px solid var(--app-border)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--app-text)',
            }}
          >
            <option value="">All Actors</option>
            {topActors.map((actor) => (
              <option key={actor.actorId} value={actor.actorId}>
                {actor.actorName} ({actor.actionCount})
              </option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              background: 'var(--app-bg)',
              border: '1px solid var(--app-border)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--app-text)',
            }}
          >
            <option value="">All Actions</option>
            {summary?.actionBreakdown &&
              Object.entries(summary.actionBreakdown).map(([action, count]) => (
                <option key={action} value={action}>
                  {action} ({count})
                </option>
              ))}
          </select>
          <input
            type="text"
            placeholder="Date Range"
            style={{
              flex: 1,
              padding: '10px',
              background: 'var(--app-bg)',
              border: '1px solid var(--app-border)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--app-text)',
            }}
          />
        </div>

        {isLoading ? (
          <LoadingState label="Loading audit logs..." />
        ) : logs.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
            }}
          >
            <Shield size={48} style={{ color: 'var(--app-text-muted)', marginBottom: '16px' }} />
            <p style={{ color: 'var(--app-text-muted)', fontSize: '14px', margin: 0 }}>
              No audit log entries yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'var(--app-bg)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600' }}>{log.actorName}</span>
                  <span
                    style={{
                      padding: '1px 6px',
                      background: 'var(--app-border)',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}
                  >
                    {log.action}
                  </span>
                  <span style={{ color: 'var(--app-text-muted)' }}>{log.description}</span>
                </div>
                <span style={{ color: 'var(--app-text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PerformanceTab({ householdId }: { householdId: string }) {
  const { data: perfData, isLoading: perfLoading, error: perfError } = usePerformanceMetrics(householdId);
  const { data: usageData, isLoading: usageLoading } = useUsageMetrics(householdId);
  const { data: errorData, isLoading: errorsLoading } = useErrorMetrics(householdId);

  const isLoading = perfLoading || usageLoading || errorsLoading;
  const errors = errorData?.errors ?? [];
  const unresolvedErrors = errors.filter((e) => !e.isResolved);

  if (perfError) {
    return <ErrorState message={`Failed to load performance data: ${(perfError as Error).message}`} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Performance Monitoring</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        <MetricCard
          label="Response Time P50"
          value={`${perfData?.apiResponseTimeP50 ?? 0}ms`}
          isLoading={isLoading}
        />
        <MetricCard
          label="Error Rate"
          value={`${((perfData?.errorRate ?? 0) * 100).toFixed(2)}%`}
          isLoading={isLoading}
        />
        <MetricCard
          label="Uptime"
          value={`${perfData?.uptimePercentage ?? 100}%`}
          isLoading={isLoading}
        />
      </div>

      <div
        style={{
          background: 'var(--app-surface)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--app-border)',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Usage</h3>
        {isLoading ? (
          <LoadingState label="Loading usage metrics..." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--app-text-muted)' }}>API Calls</span>
              <span style={{ fontWeight: '500' }}>
                {(usageData?.totalApiCalls ?? 0).toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--app-text-muted)' }}>Active Users</span>
              <span style={{ fontWeight: '500' }}>{perfData?.activeUsers ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--app-text-muted)' }}>Cache Hit Rate</span>
              <span style={{ fontWeight: '500' }}>
                {((perfData?.cacheHitRate ?? 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--app-text-muted)' }}>Requests/min</span>
              <span style={{ fontWeight: '500' }}>
                {perfData?.requestsPerMinute ?? 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--app-text-muted)' }}>Avg Session Duration</span>
              <span style={{ fontWeight: '500' }}>
                {usageData?.averageSessionDuration
                  ? `${Math.round(usageData.averageSessionDuration / 60)}m`
                  : '0m'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          background: 'var(--app-surface)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--app-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--app-accent)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
            Error Tracking{unresolvedErrors.length > 0 ? ` (${unresolvedErrors.length} active)` : ''}
          </h3>
        </div>
        {isLoading ? (
          <LoadingState label="Loading errors..." />
        ) : unresolvedErrors.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
            }}
          >
            <Activity size={48} style={{ color: 'var(--app-text-muted)', marginBottom: '16px' }} />
            <p style={{ color: 'var(--app-text-muted)', fontSize: '14px', margin: 0 }}>
              No errors detected.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unresolvedErrors.map((err) => (
              <div
                key={err.id}
                style={{
                  padding: '10px 12px',
                  background: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#991b1b' }}>{err.errorType}</span>
                  <span style={{ fontSize: '11px', color: '#991b1b' }}>
                    {err.count}x since {new Date(err.firstOccurrence).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ color: '#7f1d1d', marginTop: '4px' }}>{err.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const { householdId } = useParams<{ householdId: string }>();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('reports');

  const tabs: Array<{ id: AnalyticsTab; label: string; icon: React.ReactNode }> = [
    { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
    { id: 'admin', label: 'Admin', icon: <LayoutDashboard size={18} /> },
    { id: 'export', label: 'Export', icon: <Download size={18} /> },
    { id: 'audit', label: 'Audit Log', icon: <Shield size={18} /> },
    { id: 'performance', label: 'Performance', icon: <Activity size={18} /> },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        padding: '40px 20px',
      }}
    >
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link
          to={`/households/${householdId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--app-text-muted)',
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '20px',
          }}
        >
          <ChevronLeft size={16} />
          Back to Household
        </Link>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            Analytics & Administration
          </h1>
          <p style={{ color: 'var(--app-text-muted)', fontSize: '16px', margin: 0 }}>
            Reports, monitoring, audit logs, and data management
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--app-border)',
            marginBottom: '32px',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom:
                  activeTab === tab.id ? '2px solid var(--app-accent)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--app-accent)' : 'var(--app-text-muted)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {householdId && (
          <>
            {activeTab === 'reports' && <ReportsTab householdId={householdId} />}
            {activeTab === 'admin' && <AdminDashboardTab householdId={householdId} />}
            {activeTab === 'export' && <DataExportTab householdId={householdId} />}
            {activeTab === 'audit' && <AuditLogTab householdId={householdId} />}
            {activeTab === 'performance' && <PerformanceTab householdId={householdId} />}
          </>
        )}
      </div>
    </div>
  );
}
