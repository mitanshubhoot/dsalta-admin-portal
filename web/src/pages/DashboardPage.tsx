import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, statsApi, activitiesApi } from '@/lib/api';
import { ActivityLog } from '@/types';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import TopLists from '@/components/TopLists';

interface DashboardKPIs {
  logins: {
    total: number;
    success: number;
    failed: number;
    delta: number;
  };
  activeUsers: {
    count: number;
    delta: number;
  };
  tasks: {
    created: number;
    completed: number;
    completionRate: number;
    createdDelta: number;
    completedDelta: number;
  };
  documents: {
    created: number;
    approved: number;
    createdDelta: number;
    approvedDelta: number;
  };
  vendors: {
    scans: number;
    avgRiskScore: number;
    gradeDistribution: { A: number; B: number; C: number; D: number; F: number };
    scansDelta: number;
  };
  securityTests: {
    executions: number;
    passed: number;
    passRate: number;
    executionsDelta: number;
  };
  audits: {
    audits: number;
    avgScore: number;
    gradeDistribution: { A: number; B: number; C: number; D: number; F: number };
    auditsDelta: number;
  };
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('all');
  const navigate = useNavigate();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDelta = (delta: number): { color: string; text: string; icon: string } => {
    if (delta > 0) {
      return { color: 'text-green-600', text: `+${delta}%`, icon: '↗' };
    } else if (delta < 0) {
      return { color: 'text-red-600', text: `${delta}%`, icon: '↘' };
    } else {
      return { color: 'text-gray-500', text: '0%', icon: '→' };
    }
  };

  const getDateRangeFilter = (range: string) => {
    const now = new Date();
    let from: Date;
    
    switch (range) {
      case '24h':
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        from = new Date('2020-01-01'); // Lifetime data
        break;
      default:
        from = new Date('2020-01-01'); // Default to lifetime
    }
    
    return {
      from: from.toISOString(),
      to: now.toISOString()
    };
  };

  const getActivityDescription = (activity: ActivityLog) => {
    const metadata = activity.metadata || {};
    
    switch (activity.action) {
      case 'user.create':
        return `Account created for ${activity.entity_name || 'user'}`;
      case 'user.login':
        const device = metadata.device ? ` from ${metadata.device}` : '';
        const browser = metadata.browser ? ` using ${metadata.browser}` : '';
        return `${activity.entity_name || 'User'} logged into the system${device}${browser}`;
      case 'vendor.create':
        return `New vendor "${metadata.vendor_name || activity.entity_name}" added to platform`;
      case 'vendor.update':
        return `Vendor "${metadata.vendor_name || activity.entity_name}" updated (Score: ${metadata.score || 'N/A'}, Grade: ${metadata.grade || 'N/A'})`;
      case 'vendor.search':
        const searchTerm = metadata.search_term ? ` for "${metadata.search_term}"` : '';
        const resultCount = metadata.results_count ? ` (${metadata.results_count} results)` : '';
        return `User searched vendors${searchTerm}${resultCount}`;
      case 'dashboard.view':
        const timeSpent = metadata.time_spent ? ` (${metadata.time_spent} seconds)` : '';
        return `User viewed ${activity.entity_name || 'dashboard'}${timeSpent}`;
      case 'integration.connect':
        return `Connected integration: ${activity.entity_name || 'Unknown Integration'}`;
      case 'integration.test':
        return `Tested integration: ${activity.entity_name || 'Unknown Integration'}`;
      case 'task.create':
        return `Created task: ${activity.entity_name || 'New Task'}`;
      case 'test.execute':
        return `Executed test: ${activity.entity_name || 'Security Test'}`;
      default:
        // Format unknown actions nicely
        const actionParts = activity.action.split('.');
        if (actionParts.length === 2) {
          const [entity, action] = actionParts;
          return `${action.charAt(0).toUpperCase() + action.slice(1)} ${entity}: ${activity.entity_name || 'Unknown'}`;
        }
        return activity.action.replace('_', ' ').replace('.', ': ');
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const filters = getDateRangeFilter(dateRange);

        // Fetch comprehensive KPIs
        const kpisData = await statsApi.getDashboardKPIs(filters);
        setKpis(kpisData);

        // Fetch recent activities
        const activitiesData = await activitiesApi.getActivities({
          page: 1,
          limit: 10,
          sort_by: 'created_at',
          sort_order: 'desc'
        });
        setRecentActivities(activitiesData.data);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate, dateRange]);

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring and analytics for Dsalta</p>
        </div>
        <div className="flex space-x-2">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Logins Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Logins</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(kpis.logins.total)}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-green-600 mr-2">{kpis.logins.success} success</span>
                  <span className="text-red-600">{kpis.logins.failed} failed</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center ${formatDelta(kpis.logins.delta).color}`}>
                  <span className="mr-1">{formatDelta(kpis.logins.delta).icon}</span>
                  <span>{formatDelta(kpis.logins.delta).text}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">vs prev period</div>
              </div>
            </div>
          </div>

          {/* Active Users Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(kpis.activeUsers.count)}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center ${formatDelta(kpis.activeUsers.delta).color}`}>
                  <span className="mr-1">{formatDelta(kpis.activeUsers.delta).icon}</span>
                  <span>{formatDelta(kpis.activeUsers.delta).text}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">vs prev period</div>
              </div>
            </div>
          </div>

          {/* Tasks Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(kpis.tasks.created)}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-green-600 mr-2">{kpis.tasks.completed} completed</span>
                  <span className="text-blue-600">{kpis.tasks.completionRate}% rate</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center ${formatDelta(kpis.tasks.createdDelta).color}`}>
                  <span className="mr-1">{formatDelta(kpis.tasks.createdDelta).icon}</span>
                  <span>{formatDelta(kpis.tasks.createdDelta).text}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">created</div>
              </div>
            </div>
          </div>

          {/* Documents Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(kpis.documents.created)}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-green-600">{kpis.documents.approved} approved</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center ${formatDelta(kpis.documents.createdDelta).color}`}>
                  <span className="mr-1">{formatDelta(kpis.documents.createdDelta).icon}</span>
                  <span>{formatDelta(kpis.documents.createdDelta).text}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">created</div>
              </div>
            </div>
          </div>

          {/* Vendor Scans Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendor Scans</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(kpis.vendors.scans)}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-orange-600 mr-2">Avg Score: {kpis.vendors.avgRiskScore}</span>
                </div>
                <div className="flex space-x-1 mt-2">
                  {Object.entries(kpis.vendors.gradeDistribution).map(([grade, count]) => (
                    <span key={grade} className={`px-2 py-1 text-xs rounded ${
                      grade === 'A' ? 'bg-green-100 text-green-800' :
                      grade === 'B' ? 'bg-blue-100 text-blue-800' :
                      grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      grade === 'D' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {grade}: {count}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center ${formatDelta(kpis.vendors.scansDelta).color}`}>
                  <span className="mr-1">{formatDelta(kpis.vendors.scansDelta).icon}</span>
                  <span>{formatDelta(kpis.vendors.scansDelta).text}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">vs prev period</div>
              </div>
            </div>
          </div>

          {/* Security Tests Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Tests</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(kpis.securityTests.executions)}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-green-600 mr-2">{kpis.securityTests.passed} passed</span>
                  <span className="text-blue-600">{kpis.securityTests.passRate}% rate</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center ${formatDelta(kpis.securityTests.executionsDelta).color}`}>
                  <span className="mr-1">{formatDelta(kpis.securityTests.executionsDelta).icon}</span>
                  <span>{formatDelta(kpis.securityTests.executionsDelta).text}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">executions</div>
              </div>
            </div>
          </div>

          {/* Audits Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Audits</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(kpis.audits.audits)}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-purple-600">Avg Score: {kpis.audits.avgScore}</span>
                </div>
                <div className="flex space-x-1 mt-2">
                  {Object.entries(kpis.audits.gradeDistribution).map(([grade, count]) => (
                    <span key={grade} className={`px-2 py-1 text-xs rounded ${
                      grade === 'A' ? 'bg-green-100 text-green-800' :
                      grade === 'B' ? 'bg-blue-100 text-blue-800' :
                      grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      grade === 'D' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {grade}: {count}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center ${formatDelta(kpis.audits.auditsDelta).color}`}>
                  <span className="mr-1">{formatDelta(kpis.audits.auditsDelta).icon}</span>
                  <span>{formatDelta(kpis.audits.auditsDelta).text}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">vs prev period</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time-Series Chart */}
      {kpis && (
        <TimeSeriesChart 
          dateRange={getDateRangeFilter(dateRange)} 
          className="mt-6"
        />
      )}

      {/* Top Lists */}
      {kpis && (
        <div className="mt-6">
          <TopLists dateRange={getDateRangeFilter(dateRange)} />
        </div>
      )}

      {/* Recent Activities */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
          <button
            onClick={() => navigate('/activities')}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            View All →
          </button>
        </div>
        
        {recentActivities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activities</p>
        ) : (
          <div className="space-y-3">
            {recentActivities.slice(0, 8).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{getActivityDescription(activity)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.user_email} • {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activity.action.includes('user') ? 'bg-blue-100 text-blue-800' :
                  activity.action.includes('vendor') ? 'bg-green-100 text-green-800' :
                  activity.action.includes('task') ? 'bg-yellow-100 text-yellow-800' :
                  activity.action.includes('test') ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {activity.action}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Auto-refreshing every 10 seconds • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}