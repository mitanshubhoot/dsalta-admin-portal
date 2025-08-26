import { useState, useEffect } from 'react';
import { statsApi } from '@/lib/api';

interface TopListsProps {
  dateRange: { from: string; to: string };
  className?: string;
}

export default function TopLists({ dateRange, className = '' }: TopListsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopLists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const topListsData = await statsApi.getTopLists({
        from: dateRange.from,
        to: dateRange.to
      });
      
      setData(topListsData);
    } catch (err) {
      console.error('Error fetching top lists:', err);
      setError('Failed to load top lists data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopLists();
  }, [dateRange]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_RUN':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PASS':
        return 'bg-green-100 text-green-800';
      case 'FAIL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-orange-100 text-orange-800';
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-3 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Most Active Users */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Most Active Users</h3>
          <span className="text-sm text-gray-500">Events & Logins</span>
        </div>
        
        {data.mostActiveUsers?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No active users in this period</p>
        ) : (
          <div className="space-y-3">
            {data.mostActiveUsers?.slice(0, 5).map((user: any, index: number) => (
              <div key={user.user_email} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.user_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.user_email}
                  </p>
                  <p className="text-xs text-gray-400">
                    Last: {formatDate(user.last_activity)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.event_count} events
                  </p>
                  <p className="text-xs text-green-600">
                    {user.successful_logins} logins
                  </p>
                  {user.failed_logins > 0 && (
                    <p className="text-xs text-red-600">
                      {user.failed_logins} failed
                    </p>
                  )}
                </div>
                <div className="ml-3 text-lg font-bold text-gray-400">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Most Scanned Vendors */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Most Scanned Vendors</h3>
          <span className="text-sm text-gray-500">Security Assessments</span>
        </div>
        
        {data.mostTouchedVendors?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No vendor scans in this period</p>
        ) : (
          <div className="space-y-3">
            {data.mostTouchedVendors?.slice(0, 5).map((vendor: any, index: number) => (
              <div key={`${vendor.vendor_name}-${vendor.domain}`} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {vendor.vendor_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {vendor.domain}
                  </p>
                  <p className="text-xs text-gray-400">
                    Last: {formatDate(vendor.last_scan)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {vendor.scan_count} scans
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(vendor.grade)}`}>
                      {vendor.grade}
                    </span>
                    <span className="text-xs text-gray-600">
                      {vendor.avg_risk_score}
                    </span>
                  </div>
                </div>
                <div className="ml-3 text-lg font-bold text-gray-400">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Status Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Task Status Breakdown</h3>
          <span className="text-sm text-gray-500">Distribution</span>
        </div>
        
        {data.taskStatusBreakdown?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No tasks in this period</p>
        ) : (
          <div className="space-y-3">
            {data.taskStatusBreakdown?.map((status: any) => (
              <div key={status.status} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status)}`}>
                    {status.status === 'NOT_RUN' ? 'Created' :
                     status.status === 'IN_PROGRESS' ? 'In Progress' :
                     status.status === 'PASS' ? 'Completed' :
                     status.status === 'FAIL' ? 'Failed' : status.status}
                  </span>
                  <span className="text-sm text-gray-900">{status.count} tasks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${status.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {status.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document State Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Document State Breakdown</h3>
          <span className="text-sm text-gray-500">Status Overview</span>
        </div>
        
        {data.documentStateBreakdown?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No documents in this period</p>
        ) : (
          <div className="space-y-3">
            {data.documentStateBreakdown?.map((state: any) => (
              <div key={state.status} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(state.status)}`}>
                    {state.state}
                  </span>
                  <span className="text-sm text-gray-900">{state.count} docs</span>
                  {state.recent_count > 0 && (
                    <span className="text-xs text-blue-600">
                      ({state.recent_count} recent)
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${state.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {state.percentage}%
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
