import { useState, useEffect } from 'react';
import { detailedActivitiesApi } from '@/lib/api';

interface ActivityTabsProps {
  dateRange: { from: string; to: string };
  className?: string;
}

export default function ActivityTabs({ dateRange, className = '' }: ActivityTabsProps) {
  const [activeTab, setActiveTab] = useState<'logins' | 'tasks' | 'documents' | 'vendor-scans' | 'security-tests' | 'audits'>('logins');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<any>({});

  const tabs = [
    { id: 'logins', name: 'Logins & Security', icon: '🔐' },
    { id: 'tasks', name: 'Tasks Activity', icon: '📋' },
    { id: 'documents', name: 'Documents Activity', icon: '📄' },
    { id: 'vendor-scans', name: 'Vendor Scans', icon: '🔍' },
    { id: 'security-tests', name: 'Security Tests', icon: '🛡️' },
    { id: 'audits', name: 'Audits', icon: '📊' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseFilters = {
        from: dateRange.from,
        to: dateRange.to,
        page: currentPage,
        limit: 25,
        search: searchTerm,
        ...filters
      };

      let result;
      switch (activeTab) {
        case 'logins':
          result = await detailedActivitiesApi.getLogins(baseFilters);
          break;
        case 'tasks':
          result = await detailedActivitiesApi.getTasks(baseFilters);
          break;
        case 'documents':
          result = await detailedActivitiesApi.getDocuments(baseFilters);
          break;
        case 'vendor-scans':
          result = await detailedActivitiesApi.getVendorScans(baseFilters);
          break;
        case 'security-tests':
          result = await detailedActivitiesApi.getSecurityTests(baseFilters);
          break;
        case 'audits':
          result = await detailedActivitiesApi.getAudits(baseFilters);
          break;
        default:
          throw new Error('Unknown tab');
      }

      setData(result);
    } catch (err) {
      console.error(`Error fetching ${activeTab} data:`, err);
      setError(`Failed to load ${activeTab} data`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset page when tab or filters change
    setCurrentPage(1);
  }, [activeTab, searchTerm, filters, dateRange]);

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage, searchTerm, filters, dateRange]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string, isSuccess?: boolean) => {
    if (isSuccess !== undefined) {
      return isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }
    
    switch (status?.toUpperCase()) {
      case 'PASS':
      case 'SUCCESS':
      case 'COMPLETED':
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'FAIL':
      case 'FAILED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      case 'NOT_RUN':
      case 'CREATED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderFilters = () => {
    switch (activeTab) {
      case 'logins':
        return (
          <div className="flex space-x-4">
            <select
              value={filters.success || ''}
              onChange={(e) => setFilters({ ...filters, success: e.target.value ? e.target.value === 'true' : undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Attempts</option>
              <option value="true">Success Only</option>
              <option value="false">Failed Only</option>
            </select>
          </div>
        );
      case 'tasks':
        return (
          <div className="flex space-x-4">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="NOT_RUN">Created</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PASS">Completed</option>
              <option value="FAIL">Failed</option>
            </select>
          </div>
        );
      case 'documents':
        return (
          <div className="flex space-x-4">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="NOT_RUN">Created</option>
              <option value="IN_PROGRESS">In Review</option>
              <option value="PASS">Approved</option>
              <option value="FAIL">Rejected</option>
            </select>
          </div>
        );
      case 'vendor-scans':
        return (
          <div className="flex space-x-4">
            <select
              value={filters.grade || ''}
              onChange={(e) => setFilters({ ...filters, grade: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="D">Grade D</option>
              <option value="F">Grade F</option>
            </select>
            <input
              type="number"
              placeholder="Min Score"
              value={filters.minScore || ''}
              onChange={(e) => setFilters({ ...filters, minScore: e.target.value ? parseInt(e.target.value) : undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
            />
          </div>
        );
      case 'security-tests':
        return (
          <div className="flex space-x-4">
            <select
              value={filters.result || ''}
              onChange={(e) => setFilters({ ...filters, result: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Results</option>
              <option value="PASS">Pass</option>
              <option value="FAIL">Fail</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="NOT_RUN">Not Run</option>
            </select>
          </div>
        );
      case 'audits':
        return (
          <div className="flex space-x-4">
            <select
              value={filters.grade || ''}
              onChange={(e) => setFilters({ ...filters, grade: e.target.value || undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="D">Grade D</option>
              <option value="F">Grade F</option>
            </select>
            <input
              type="number"
              placeholder="Min Score"
              value={filters.minScore || ''}
              onChange={(e) => setFilters({ ...filters, minScore: e.target.value ? parseInt(e.target.value) : undefined })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderTableHeaders = () => {
    switch (activeTab) {
      case 'logins':
        return (
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
          </tr>
        );
      case 'tasks':
        return (
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
          </tr>
        );
      case 'documents':
        return (
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
          </tr>
        );
      case 'vendor-scans':
        return (
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Scan</th>
          </tr>
        );
      case 'security-tests':
        return (
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Executed By</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Executed At</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
          </tr>
        );
      case 'audits':
        return (
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
          </tr>
        );
      default:
        return null;
    }
  };

  const renderTableRow = (item: any, index: number) => {
    switch (activeTab) {
      case 'logins':
        return (
          <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div>
                <div className="text-sm font-medium text-gray-900">{item.user_name}</div>
                <div className="text-sm text-gray-500">{item.email}</div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor('', item.success)}`}>
                {item.success ? 'Success' : 'Failed'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.ip}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.created_at)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.organization_name}</td>
          </tr>
        );
      case 'tasks':
        return (
          <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-6 py-4">
              <div>
                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status === 'NOT_RUN' ? 'Created' : 
                 item.status === 'IN_PROGRESS' ? 'In Progress' :
                 item.status === 'PASS' ? 'Completed' :
                 item.status === 'FAIL' ? 'Failed' : item.status}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.owner_name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.created_at)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.earned_points || 0}</td>
          </tr>
        );
      case 'documents':
        return (
          <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-6 py-4">
              <div>
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status === 'NOT_RUN' ? 'Created' : 
                 item.status === 'IN_PROGRESS' ? 'In Review' :
                 item.status === 'PASS' ? 'Approved' :
                 item.status === 'FAIL' ? 'Rejected' : item.status}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.type}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.owner_name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.updated_at)}</td>
          </tr>
        );
      case 'vendor-scans':
        return (
          <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.vendor_name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.domain}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Math.round(item.score || 0)}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(item.grade)}`}>
                {item.grade}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.last_scan)}</td>
          </tr>
        );
      case 'security-tests':
        return (
          <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-6 py-4">
              <div>
                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.result)}`}>
                {item.result}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.executed_by}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.executed_at)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.risk}</td>
          </tr>
        );
      case 'audits':
        return (
          <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.organization_name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Math.round(item.score || 0)}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(item.grade)}`}>
                {item.grade}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.audit_type}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.created_at)}</td>
          </tr>
        );
      default:
        return null;
    }
  };

  const renderPagination = () => {
    if (!data || data.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(data.totalPages, currentPage + 1))}
            disabled={currentPage === data.totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">{((currentPage - 1) * data.limit) + 1}</span>
              {' '}to{' '}
              <span className="font-medium">
                {Math.min(currentPage * data.limit, data.total)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{data.total}</span>
              {' '}results
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2);
              if (page > data.totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === page
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(data.totalPages, currentPage + 1))}
              disabled={currentPage === data.totalPages}
              className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters and Search */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
            {renderFilters()}
          </div>
          <div className="text-sm text-gray-500">
            {data ? `${data.total} total items` : ''}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : data && data.data && data.data.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              {renderTableHeaders()}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.data.map((item: any, index: number) => renderTableRow(item, index))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No {activeTab.replace('-', ' ')} found</div>
            <p className="text-gray-400 mt-2">Try adjusting your filters or date range</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
}
