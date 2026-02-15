import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
} from 'lucide-react';

type AnalyticsTab = 'reports' | 'admin' | 'export' | 'audit' | 'performance';

function ReportsTab() {
  const reportTypes = [
    'Chore Completion',
    'Member Performance',
    'Household Overview',
    'Gamification',
    'Wellness',
    'Custom',
  ];

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
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Total Reports
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>0</div>
        </div>
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Scheduled
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>0</div>
        </div>
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Generated
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>0</div>
        </div>
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Last Generated
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>Never</div>
        </div>
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
    </div>
  );
}

function AdminDashboardTab() {
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
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Total Members
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>0</div>
        </div>
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Active Today
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>0</div>
        </div>
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Completion Rate
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>0%</div>
        </div>
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Avg Points
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>0</div>
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
        <p style={{ color: 'var(--app-text-muted)', fontSize: '14px', margin: 0 }}>
          No performance data available yet.
        </p>
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
        <p style={{ color: 'var(--app-text-muted)', fontSize: '14px', margin: 0 }}>
          No recent activity to display.
        </p>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={20} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Healthy</span>
        </div>
      </div>
    </div>
  );
}

function DataExportTab() {
  const exportScopes = [
    'Full Backup',
    'Chores',
    'Members',
    'Gamification',
    'Wellness',
    'Activity',
  ];

  const formats = ['PDF', 'CSV', 'JSON', 'Excel'];

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
      </div>
    </div>
  );
}

function AuditLogTab() {
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
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Total Actions
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>0</div>
        </div>
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
            <option>All Actors</option>
          </select>
          <select
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
            <option>All Actions</option>
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
      </div>
    </div>
  );
}

function PerformanceTab() {
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
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Response Time P50
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>0ms</div>
        </div>
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Error Rate
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>0%</div>
        </div>
        <div
          style={{
            background: 'var(--app-surface)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--app-border)',
          }}
        >
          <div style={{ color: 'var(--app-text-muted)', fontSize: '13px', marginBottom: '8px' }}>
            Uptime
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>100%</div>
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
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Usage</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--app-text-muted)' }}>API Calls</span>
            <span style={{ fontWeight: '500' }}>0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--app-text-muted)' }}>Active Users</span>
            <span style={{ fontWeight: '500' }}>0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--app-text-muted)' }}>Cache Hit Rate</span>
            <span style={{ fontWeight: '500' }}>0%</span>
          </div>
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--app-accent)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Error Tracking</h3>
        </div>
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

        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'admin' && <AdminDashboardTab />}
        {activeTab === 'export' && <DataExportTab />}
        {activeTab === 'audit' && <AuditLogTab />}
        {activeTab === 'performance' && <PerformanceTab />}
      </div>
    </div>
  );
}
