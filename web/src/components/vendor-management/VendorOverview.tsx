import { useState } from 'react';
import { 
  BuildingOfficeIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  ArrowTrendingUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface VendorOverviewProps {
  overview: any;
  loading: boolean;
  error: any;
  dateRange: { from: string; to: string };
  onDateRangeChange: (dateRange: { from: string; to: string }) => void;
  onVendorSelect: (vendor: any) => void;
  organizations?: any[];
}

export default function VendorOverview({
  overview,
  loading,
  error,
  dateRange,
  onDateRangeChange,
  onVendorSelect,
  organizations = []
}: VendorOverviewProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Failed to load vendor overview data
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Prepare chart data for grade distribution
  const gradeDistributionData = {
    labels: Object.keys(overview?.stats?.grade_distribution || {}),
    datasets: [
      {
        data: Object.values(overview?.stats?.grade_distribution || {}),
        backgroundColor: [
          '#16A34A', // green - A grade
          '#3B82F6', // blue - B grade  
          '#F59E0B', // yellow - C grade
          '#EF4444', // orange - D grade
          '#DC2626', // red - F grade
          '#9CA3AF', // gray - Not Graded
        ],
        borderWidth: 0,
      },
    ],
  };

  const securityTrendsData = {
    labels: overview?.securityTrends?.map((item: any) => formatDate(item.date)) || [],
    datasets: [
      {
        label: 'Average Security Score',
        data: overview?.securityTrends?.map((item: any) => item.avg_score) || [],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Total Scans',
        data: overview?.securityTrends?.map((item: any) => item.scan_count) || [],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-lg font-medium text-gray-900">Vendor Overview</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.from.split('T')[0]}
                onChange={(e) => onDateRangeChange({
                  ...dateRange,
                  from: new Date(e.target.value).toISOString()
                })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={dateRange.to.split('T')[0]}
                onChange={(e) => onDateRangeChange({
                  ...dateRange,
                  to: new Date(e.target.value).toISOString()
                })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">All Vendors</p>
              <p className="text-2xl font-semibold text-gray-900">
                {overview?.stats?.total_vendors || 0}
              </p>
              <p className="text-xs text-gray-400">Internal + External</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Security Assessed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {overview?.stats?.vendors_assessed || 0}
              </p>
              <p className="text-xs text-gray-400">
                {overview?.stats?.assessment_coverage || 0}% of all vendors
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Security Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(overview?.stats?.avg_security_score || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">High Risk</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(overview?.stats?.risk_distribution?.high || 0) + (overview?.stats?.risk_distribution?.critical || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Grade Distribution</h3>
          <div className="h-64">
            <Doughnut 
              data={gradeDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Security Trends Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security Trends</h3>
          <div className="h-64">
            <Line 
              data={securityTrendsData}
              options={chartOptions}
            />
          </div>
        </div>
      </div>



      {/* Recent Vendors and Top Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Vendors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Vendors</h3>
          <div className="space-y-3">
            {overview?.recentVendors?.slice(0, 5).map((vendor: any) => (
              <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{vendor.name}</p>
                  <p className="text-sm text-gray-500">
                    Added {formatDate(vendor.added_date)} • {vendor.organization_name}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {vendor.current_score && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(vendor.current_grade)}`}>
                      {vendor.current_grade} ({Math.round(vendor.current_score)})
                    </span>
                  )}
                  <button
                    onClick={() => onVendorSelect(vendor)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Risk Vendors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">High Risk Vendors</h3>
          <div className="space-y-3">
            {overview?.topVendorsByRisk?.slice(0, 5).map((vendor: any) => (
              <div key={vendor.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{vendor.name}</p>
                  <p className="text-sm text-gray-500">{vendor.organization_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(vendor.risk_level)}`}>
                    {vendor.risk_level}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(vendor.current_grade)}`}>
                    {vendor.current_grade} ({Math.round(vendor.current_score)})
                  </span>
                  <button
                    onClick={() => onVendorSelect(vendor)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor by Organization */}
      {overview?.vendorsByOrganization && overview.vendorsByOrganization.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Vendors by Organization</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Vendors
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    High Risk
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overview.vendorsByOrganization.map((org: any, index: number) => (
                  <tr key={org.organization_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{org.organization_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">{org.vendor_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{org.assessed_count || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {org.avg_score ? Math.round(org.avg_score) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-red-600 font-medium">{org.high_risk_count || 0}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
