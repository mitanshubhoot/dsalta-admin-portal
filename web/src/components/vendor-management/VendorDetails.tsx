import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useQuery } from 'react-query';
import { vendorManagementApi } from '@/lib/api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  XMarkIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';

interface VendorDetailsProps {
  vendor: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorDetails({ vendor, isOpen, onClose }: VendorDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'history' | 'contracts'>('overview');

  const { data: vendorDetails, isLoading } = useQuery(
    ['vendor-details', vendor?.id],
    () => vendorManagementApi.getVendorDetails(vendor.id),
    {
      enabled: isOpen && !!vendor?.id,
      refetchOnWindowFocus: false,
    }
  );

  if (!vendor) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'not_started': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Prepare score history chart data
  const scoreHistoryData = vendorDetails?.score_history ? {
    labels: vendorDetails.score_history.map((item: any) => formatDate(item.date)),
    datasets: [
      {
        label: 'Security Score',
        data: vendorDetails.score_history.map((item: any) => item.score),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BuildingOfficeIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'history', name: 'History', icon: ClockIcon },
    { id: 'contracts', name: 'Contracts', icon: DocumentTextIcon },
  ];

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (!vendorDetails) {
      return (
        <div className="text-center py-12 text-gray-500">
          Failed to load vendor details
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company Name</p>
                      <p className="text-sm text-gray-900">{vendorDetails.name}</p>
                    </div>
                  </div>
                  {vendorDetails.domain && (
                    <div className="flex items-center space-x-3">
                      <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Domain</p>
                        <a 
                          href={`https://${vendorDetails.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {vendorDetails.domain}
                        </a>
                      </div>
                    </div>
                  )}
                  {vendorDetails.email && (
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <a 
                          href={`mailto:${vendorDetails.email}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {vendorDetails.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Added Date</p>
                      <p className="text-sm text-gray-900">{formatDate(vendorDetails.added_date)}</p>
                    </div>
                  </div>
                  {vendorDetails.added_by_name && (
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Added By</p>
                        <p className="text-sm text-gray-900">{vendorDetails.added_by_name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Organization</p>
                      <p className="text-sm text-gray-900">{vendorDetails.organization_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            {vendorDetails.description && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Services Provided</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {vendorDetails.description}
                </p>
              </div>
            )}

            {/* Current Status */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Current Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Review Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(vendorDetails.review_status)}`}>
                    {vendorDetails.review_status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Risk Level</p>
                  {vendorDetails.risk_level ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getRiskColor(vendorDetails.risk_level)}`}>
                      {vendorDetails.risk_level}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500 mt-1">Not assessed</span>
                  )}
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Active Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${vendorDetails.is_active ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                    {vendorDetails.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            {/* Security Overview */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Security Assessment</h4>
              {vendorDetails.current_score ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{Math.round(vendorDetails.current_score)}</p>
                    <p className="text-sm font-medium text-blue-600">Security Score</p>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className={`text-3xl font-bold ${getGradeColor(vendorDetails.current_grade).split(' ')[0]}`}>
                      {vendorDetails.current_grade}
                    </p>
                    <p className="text-sm font-medium text-gray-600">Grade</p>
                  </div>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Last Scan</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(vendorDetails.last_security_scan)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No security assessment available</p>
                </div>
              )}
            </div>

            {/* Score History Chart */}
            {scoreHistoryData && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Score History</h4>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="h-64">
                    <Line data={scoreHistoryData} options={chartOptions} />
                  </div>
                </div>
              </div>
            )}

            {/* Security Reviews */}
            {vendorDetails.security_reviews && vendorDetails.security_reviews.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Security Reviews</h4>
                <div className="space-y-3">
                  {vendorDetails.security_reviews.slice(0, 5).map((review: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Security Scan</p>
                        <p className="text-sm text-gray-500">{formatDateTime(review.created_at)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-gray-900">
                          {Math.round(review.score)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(review.grade)}`}>
                          {review.grade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            {/* Activity Timeline */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Activity Timeline</h4>
              {vendorDetails.activity_history && vendorDetails.activity_history.length > 0 ? (
                <div className="space-y-4">
                  {vendorDetails.activity_history.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <ChartBarIcon className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.activity_type}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDateTime(activity.timestamp)}</p>
                      </div>
                      {activity.metadata && (
                        <div className="text-sm text-gray-500">
                          {JSON.stringify(activity.metadata)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No activity history available
                </div>
              )}
            </div>
          </div>
        );

      case 'contracts':
        return (
          <div className="space-y-6">
            {/* Contract Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Contract Information</h4>
              {vendorDetails.contracts && vendorDetails.contracts.length > 0 ? (
                <div className="space-y-4">
                  {vendorDetails.contracts.map((contract: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-medium text-gray-900">{contract.title || 'Contract'}</h5>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                          {contract.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Start Date</p>
                          <p className="text-gray-900">{formatDate(contract.start_date)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">End Date</p>
                          <p className="text-gray-900">{formatDate(contract.end_date)}</p>
                        </div>
                        {contract.value && (
                          <div>
                            <p className="text-gray-500">Contract Value</p>
                            <p className="text-gray-900">${contract.value.toLocaleString()}</p>
                          </div>
                        )}
                        {contract.type && (
                          <div>
                            <p className="text-gray-500">Contract Type</p>
                            <p className="text-gray-900">{contract.type}</p>
                          </div>
                        )}
                      </div>
                      {contract.description && (
                        <div className="mt-3">
                          <p className="text-gray-500 text-sm">Description</p>
                          <p className="text-gray-900 text-sm">{contract.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No contracts on file
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                {/* Header */}
                <div className="bg-white px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                      {vendor.name}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  
                  {/* Quick Info */}
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    {vendor.current_score && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500">Score:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {Math.round(vendor.current_score)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getGradeColor(vendor.current_grade)}`}>
                          {vendor.current_grade}
                        </span>
                      </div>
                    )}
                    {vendor.risk_level && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(vendor.risk_level)}`}>
                        {vendor.risk_level} Risk
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vendor.review_status)}`}>
                      {vendor.review_status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8 px-6">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{tab.name}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-96 overflow-y-auto">
                  {renderTabContent()}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-3 flex justify-end">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
