import { useState } from 'react';
import { useQuery } from 'react-query';
import { vendorManagementApi } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface VendorAnalyticsProps {
  dateRange: { from: string; to: string };
  onDateRangeChange: (dateRange: { from: string; to: string }) => void;
  organizations?: any[];
}

export default function VendorAnalytics({ 
  dateRange, 
  onDateRangeChange, 
  organizations = [] 
}: VendorAnalyticsProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  // Get security trends
  const { data: securityTrends, isLoading: trendsLoading } = useQuery(
    ['security-trends', dateRange.from, dateRange.to],
    () => vendorManagementApi.getSecurityTrends(dateRange.from, dateRange.to),
    {
      refetchOnWindowFocus: false,
    }
  );

  // Get vendor stats
  const { data: stats, isLoading: statsLoading } = useQuery(
    ['vendor-stats', dateRange.from, dateRange.to, selectedOrgId],
    () => vendorManagementApi.getStats(dateRange.from, dateRange.to, selectedOrgId),
    {
      refetchOnWindowFocus: false,
    }
  );

  // Get vendors by organization
  const { data: vendorsByOrg, isLoading: orgLoading } = useQuery(
    'vendors-by-organization',
    vendorManagementApi.getVendorsByOrganization,
    {
      refetchOnWindowFocus: false,
    }
  );

  const isLoading = trendsLoading || statsLoading || orgLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Prepare chart data
  const securityTrendsData = securityTrends ? {
    labels: securityTrends.map((item: any) => formatDate(item.date)),
    datasets: [
      {
        label: 'Average Security Score',
        data: securityTrends.map((item: any) => item.avg_score),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Total Scans',
        data: securityTrends.map((item: any) => item.total_scans),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        fill: false,
        yAxisID: 'y1',
      },
    ],
  } : null;

  const riskDistributionData = stats ? {
    labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
    datasets: [
      {
        data: [
          stats.risk_distribution?.low || 0,
          stats.risk_distribution?.medium || 0,
          stats.risk_distribution?.high || 0,
          stats.risk_distribution?.critical || 0,
        ],
        backgroundColor: [
          '#10B981', // green - low
          '#F59E0B', // yellow - medium  
          '#EF4444', // red - high
          '#DC2626', // dark red - critical
        ],
        borderWidth: 0,
      },
    ],
  } : null;

  const gradeDistributionData = stats ? {
    labels: ['Grade A', 'Grade B', 'Grade C', 'Grade D', 'Grade F', 'No Grade'],
    datasets: [
      {
        data: [
          stats.grade_distribution?.A || 0,
          stats.grade_distribution?.B || 0,
          stats.grade_distribution?.C || 0,
          stats.grade_distribution?.D || 0,
          stats.grade_distribution?.F || 0,
          stats.grade_distribution?.null || 0,
        ],
        backgroundColor: [
          '#10B981', // A - green
          '#3B82F6', // B - blue
          '#F59E0B', // C - yellow
          '#EF4444', // D - orange
          '#DC2626', // F - red
          '#6B7280', // No grade - gray
        ],
        borderWidth: 0,
      },
    ],
  } : null;

  const vendorsByOrgData = vendorsByOrg ? {
    labels: vendorsByOrg.slice(0, 10).map((org: any) => org.organization_name),
    datasets: [
      {
        label: 'Number of Vendors',
        data: vendorsByOrg.slice(0, 10).map((org: any) => org.vendor_count),
        backgroundColor: '#3B82F6',
        borderColor: '#1D4ED8',
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const dualAxisOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
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
        title: {
          display: true,
          text: 'Security Score',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Number of Scans',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-lg font-medium text-gray-900">Vendor Analytics</h2>
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
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Total Vendors</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total_vendors || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Avg Security Score</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(stats.avg_security_score || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">High Risk Vendors</p>
                <p className="text-2xl font-semibold text-red-600">
                  {(stats.risk_distribution?.high || 0) + (stats.risk_distribution?.critical || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Assessment Coverage</p>
                <p className="text-2xl font-semibold text-green-600">
                  {Math.round(stats.assessment_coverage || 0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Trends */}
        {securityTrendsData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Trends Over Time</h3>
            <div className="h-80">
              <Line data={securityTrendsData} options={dualAxisOptions} />
            </div>
          </div>
        )}

        {/* Risk Distribution */}
        {riskDistributionData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
            <div className="h-80">
              <Doughnut data={riskDistributionData} options={doughnutOptions} />
            </div>
          </div>
        )}

        {/* Grade Distribution */}
        {gradeDistributionData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Grade Distribution</h3>
            <div className="h-80">
              <Doughnut data={gradeDistributionData} options={doughnutOptions} />
            </div>
          </div>
        )}

        {/* Vendors by Organization */}
        {vendorsByOrgData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vendors by Organization</h3>
            <div className="h-80">
              <Bar data={vendorsByOrgData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>

      {/* Detailed Statistics */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Level Breakdown</h3>
            <div className="space-y-4">
              {[
                { level: 'Low', count: stats.risk_distribution?.low || 0, color: 'bg-green-500' },
                { level: 'Medium', count: stats.risk_distribution?.medium || 0, color: 'bg-yellow-500' },
                { level: 'High', count: stats.risk_distribution?.high || 0, color: 'bg-orange-500' },
                { level: 'Critical', count: stats.risk_distribution?.critical || 0, color: 'bg-red-500' },
              ].map((risk) => (
                <div key={risk.level} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${risk.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">{risk.level} Risk</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">{risk.count}</span>
                    <span className="text-xs text-gray-500">
                      ({stats.total_vendors > 0 ? Math.round((risk.count / stats.total_vendors) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Grade Breakdown</h3>
            <div className="space-y-4">
              {[
                { grade: 'A', count: stats.grade_distribution?.A || 0, color: 'bg-green-500' },
                { grade: 'B', count: stats.grade_distribution?.B || 0, color: 'bg-blue-500' },
                { grade: 'C', count: stats.grade_distribution?.C || 0, color: 'bg-yellow-500' },
                { grade: 'D', count: stats.grade_distribution?.D || 0, color: 'bg-orange-500' },
                { grade: 'F', count: stats.grade_distribution?.F || 0, color: 'bg-red-500' },
                { grade: 'No Grade', count: stats.grade_distribution?.null || 0, color: 'bg-gray-500' },
              ].map((grade) => (
                <div key={grade.grade} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${grade.color}`}></div>
                    <span className="text-sm font-medium text-gray-900">Grade {grade.grade}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">{grade.count}</span>
                    <span className="text-xs text-gray-500">
                      ({stats.total_vendors > 0 ? Math.round((grade.count / stats.total_vendors) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review Status Summary */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Review Status Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-semibold text-green-600">
                {stats.review_status?.completed || 0}
              </p>
              <p className="text-sm text-green-600">Completed Reviews</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.total_vendors > 0 ? Math.round(((stats.review_status?.completed || 0) / stats.total_vendors) * 100) : 0}% of vendors
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-semibold text-blue-600">
                {stats.review_status?.in_progress || 0}
              </p>
              <p className="text-sm text-blue-600">In Progress</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.total_vendors > 0 ? Math.round(((stats.review_status?.in_progress || 0) / stats.total_vendors) * 100) : 0}% of vendors
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-semibold text-gray-600">
                {stats.review_status?.not_started || 0}
              </p>
              <p className="text-sm text-gray-600">Not Started</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.total_vendors > 0 ? Math.round(((stats.review_status?.not_started || 0) / stats.total_vendors) * 100) : 0}% of vendors
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
