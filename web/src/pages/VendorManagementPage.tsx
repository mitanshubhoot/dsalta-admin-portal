import { useState } from 'react';
import { useQuery } from 'react-query';
import { vendorManagementApi, usersApi } from '@/lib/api';
import VendorOverview from '@/components/vendor-management/VendorOverview';
import VendorSearch from '@/components/vendor-management/VendorSearch';
import VendorDetails from '@/components/vendor-management/VendorDetails';
import VendorAnalytics from '@/components/vendor-management/VendorAnalytics';
import { 
  ChartBarIcon, 
  MagnifyingGlassIcon, 
  ChartPieIcon,
  ClockIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

type TabType = 'overview' | 'search' | 'analytics' | 'risk-management' | 'recent-activity';

interface VendorManagementPageProps {}

export default function VendorManagementPage({}: VendorManagementPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dateRange, setDateRange] = useState(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    
    return {
      from: from.toISOString(),
      to: to.toISOString()
    };
  });
  
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showVendorDetails, setShowVendorDetails] = useState(false);

  // Get organizations for filtering
  const { data: organizations } = useQuery('organizations', usersApi.getOrganizations);

  // Get vendor management overview
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery(
    ['vendor-overview', dateRange],
    () => vendorManagementApi.getOverview(dateRange),
    {
      enabled: activeTab === 'overview',
      refetchOnWindowFocus: false,
    }
  );

  const tabs = [
    { 
      id: 'overview' as TabType, 
      name: 'Overview', 
      icon: ChartBarIcon,
      description: 'Key metrics and vendor statistics'
    },
    { 
      id: 'search' as TabType, 
      name: 'Vendor Search', 
      icon: MagnifyingGlassIcon,
      description: 'Search and filter vendors'
    },
    { 
      id: 'analytics' as TabType, 
      name: 'Analytics', 
      icon: ChartPieIcon,
      description: 'Security trends and analytics'
    },
    { 
      id: 'risk-management' as TabType, 
      name: 'Risk Management', 
      icon: ExclamationTriangleIcon,
      description: 'High-risk vendors and alerts'
    },
    { 
      id: 'recent-activity' as TabType, 
      name: 'Recent Activity', 
      icon: ClockIcon,
      description: 'Latest vendor activities'
    }
  ];

  const handleVendorSelect = (vendor: any) => {
    setSelectedVendor(vendor);
    setShowVendorDetails(true);
  };

  const handleDateRangeChange = (newDateRange: { from: string; to: string }) => {
    setDateRange(newDateRange);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <VendorOverview 
            overview={overview}
            loading={overviewLoading}
            error={overviewError}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onVendorSelect={handleVendorSelect}
            organizations={organizations}
          />
        );
      case 'search':
        return (
          <VendorSearch 
            onVendorSelect={handleVendorSelect}
            organizations={organizations}
          />
        );
      case 'analytics':
        return (
          <VendorAnalytics 
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            organizations={organizations}
          />
        );
      case 'risk-management':
        return (
          <div className="space-y-6">
            {/* Risk Management Content - Will be implemented */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Management</h3>
              <p className="text-gray-500">Risk management features coming soon...</p>
            </div>
          </div>
        );
      case 'recent-activity':
        return (
          <div className="space-y-6">
            {/* Recent Activity Content - Will be implemented */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <p className="text-gray-500">Recent activity timeline coming soon...</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (overviewError && activeTab === 'overview') {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-medium">Error Loading Vendor Management</h3>
          <p className="mt-1">Failed to load vendor management data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive vendor tracking, security assessments, and risk management
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                <div className="text-left">
                  <div>{tab.name}</div>
                  <div className="text-xs text-gray-400 group-hover:text-gray-500">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>

      {/* Vendor Details Modal */}
      {showVendorDetails && selectedVendor && (
        <VendorDetails
          vendor={selectedVendor}
          isOpen={showVendorDetails}
          onClose={() => {
            setShowVendorDetails(false);
            setSelectedVendor(null);
          }}
        />
      )}
    </div>
  );
}
