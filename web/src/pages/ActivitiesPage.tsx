import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, activitiesApi } from '@/lib/api';
import { ActivityLog, ActivityFilters } from '@/types';

export default function ActivitiesPage() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filters, setFilters] = useState<ActivityFilters>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchActivities = async (currentFilters: ActivityFilters) => {
    try {
      setLoading(true);
      setError(null);
      const response = await activitiesApi.getActivities(currentFilters);
      setActivities(response.data);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    fetchActivities(filters);

    // Auto-refresh every 15 seconds for real-time updates (longer interval for activities page)
    const interval = setInterval(() => {
      fetchActivities(filters);
    }, 15000);

    return () => clearInterval(interval);
  }, [navigate, filters]);

  const handleFilterChange = (newFilters: Partial<ActivityFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
  };

  const handlePageChange = (newPage: number) => {
    const updatedFilters = { ...filters, page: newPage };
    setFilters(updatedFilters);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Activity Log
            </h1>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={filters.q || ''}
                  onChange={(e) => handleFilterChange({ q: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select 
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange({ action: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Actions</option>
                  <option value="user.create">User Registration</option>
                  <option value="user.login">User Login</option>
                  <option value="vendor.create">Vendor Creation</option>
                  <option value="vendor.update">Vendor Update</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange({ date_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange({ date_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Activities Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {error && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                )}
                {!error && activities.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-lg">No activities found</div>
                      <div className="text-sm mt-2">Try adjusting your search filters or check back later</div>
                    </td>
                  </tr>
                )}
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getActivityDescription(activity)}
                      </div>
                      <div className="text-sm text-gray-500">{activity.action}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {activity.user_email || 'System'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.user_name || 'Automated'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {activity.entity_type}
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.entity_name || activity.entity_id || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.ip || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(activity.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button 
                  onClick={() => handlePageChange(filters.page! - 1)}
                  disabled={filters.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button 
                  onClick={() => handlePageChange(filters.page! + 1)}
                  disabled={filters.page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((filters.page! - 1) * filters.limit!) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(filters.page! * filters.limit!, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button 
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (filters.page! <= 3) {
                        pageNum = i + 1;
                      } else if (filters.page! >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = filters.page! - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            filters.page === pageNum
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button 
                      onClick={() => handlePageChange(filters.page! + 1)}
                      disabled={filters.page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
