import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { userJourneyApi } from '@/lib/api';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  DocumentTextIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Combobox } from '@headlessui/react';
import LoadingSpinner from '@/components/LoadingSpinner';


interface User {
  id: string;
  email: string;
  name: string;
  organization_name: string;
  role: string;
  created_at: string;
  total_logins: number;
  last_login: string;
  total_tasks: number;
  total_vendors: number;
}

interface UserJourney {
  userProfile: any;
  loginSessions: any[];
  activityTimeline: any[];
  vendorJourney: any;
  taskJourney: any;
  documentJourney: any;
  securityJourney: any;
  featureUsage: any;
  riskProfile: any;
  dateRange: { from: string; to: string };
}

const UserJourneyPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userJourney, setUserJourney] = useState<UserJourney | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
    to: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
  });

  const searchUsers = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setUsers([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await userJourneyApi.searchUsers(searchTerm, 10);
      setUsers(results || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadUserJourney = async (user: User) => {
    setLoading(true);
    setError(null);
    try {
      const journey = await userJourneyApi.getUserJourney(user.email, dateRange);
      setUserJourney(journey);
    } catch (err) {
      console.error('Error loading user journey:', err);
      setError('Failed to load user journey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (selectedUser) {
      loadUserJourney(selectedUser);
    }
  }, [selectedUser, dateRange]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A': return 'text-green-800 bg-green-200';
      case 'B': return 'text-green-600 bg-green-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };





  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Journey Explorer</h1>
        <p className="text-gray-600">Deep dive into individual user behavior and activity patterns</p>
      </div>

      {/* User Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 mb-2">
              Search for a user
            </label>
            <Combobox value={selectedUser} onChange={setSelectedUser}>
              <div className="relative">
                <div className="relative">
                  <Combobox.Input
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    onChange={(event) => setQuery(event.target.value)}
                    displayValue={(user: User | null) => user?.name || user?.email || ''}
                    placeholder="Search by name or email..."
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    {isSearching ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    ) : (
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {users.length > 0 && (
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {users.map((user) => (
                      <Combobox.Option
                        key={user.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-3 pr-9 ${
                            active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                          }`
                        }
                        value={user}
                      >
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm opacity-75">{user.email}</div>
                            {user.organization_name && (
                              <div className="text-xs opacity-60">{user.organization_name}</div>
                            )}
                          </div>
                        </div>
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                )}
              </div>
            </Combobox>
          </div>

          {selectedUser && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Date Range:</label>
              <select
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                onChange={(e) => {
                  const days = parseInt(e.target.value);
                  setDateRange({
                    from: format(subDays(new Date(), days), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
                    to: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
                  });
                }}
              >
                <option value="7">Last 7 days</option>
                <option value="30" selected>Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {selectedUser && userJourney && !loading && (
        <div className="space-y-6">
          {/* User Profile Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {userJourney.userProfile.firstName} {userJourney.userProfile.lastName}
                  </h2>
                  <p className="text-gray-600">{userJourney.userProfile.email}</p>
                  {userJourney.userProfile.organization_name && (
                    <p className="text-sm text-gray-500">{userJourney.userProfile.organization_name}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Member since</div>
                <div className="font-medium">
                  {format(new Date(userJourney.userProfile.joined_date), 'MMM dd, yyyy')}
                </div>
                {userJourney.userProfile.last_login && (
                  <>
                    <div className="text-sm text-gray-500 mt-2">Last seen</div>
                    <div className="font-medium">
                      {format(new Date(userJourney.userProfile.last_login), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Logins</p>
                  <p className="text-2xl font-semibold text-gray-900">{userJourney.userProfile.total_logins}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Documents</p>
                  <p className="text-2xl font-semibold text-gray-900">{userJourney.userProfile.total_documents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BriefcaseIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Vendors</p>
                  <p className="text-2xl font-semibold text-gray-900">{userJourney.vendorJourney?.summary?.total_vendors || 0}</p>
                </div>
              </div>
            </div>


          </div>

          {/* Recent Login Sessions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Login Sessions</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
                {userJourney.loginSessions.slice(0, 10).map((session: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        {session.success ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          {format(new Date(session.login_time), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {session.ip} • {session.estimated_session_minutes}min session
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Enhanced Activity Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Complete Activity Timeline</h3>
              <span className="text-sm text-gray-500">{userJourney.activityTimeline.length} activities</span>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {userJourney.activityTimeline.map((activity: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${
                    activity.category === 'Security' ? 'bg-red-400' :
                    activity.activity_type === 'login' ? 'bg-green-400' :
                    activity.activity_type === 'vendor' ? 'bg-purple-400' :
                    activity.activity_type === 'vendor_scan' ? 'bg-orange-400' :
                    activity.activity_type === 'task' ? 'bg-blue-400' :
                    activity.activity_type === 'document' ? 'bg-indigo-400' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 leading-5">{activity.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            activity.category === 'Security' ? 'bg-red-100 text-red-700' :
                            activity.category === 'Tasks' ? 'bg-blue-100 text-blue-700' :
                            activity.category === 'Documents' ? 'bg-indigo-100 text-indigo-700' :
                            activity.category === 'Vendors' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {activity.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {activity.action.replace(/[_.]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                        </div>
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                            {Object.entries(activity.metadata).slice(0, 4).map(([key, value]: [string, any]) => (
                              <div key={key} className="text-gray-600">
                                <span className="font-medium">{key.replace(/_/g, ' ')}:</span>{' '}
                                <span className="text-gray-900">{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.timestamp), 'MMM dd')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(activity.timestamp), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Vendor List */}
          {userJourney.vendorJourney && userJourney.vendorJourney.vendors && userJourney.vendorJourney.vendors.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">User's Vendors</h3>
                <span className="text-sm text-gray-500">{userJourney.vendorJourney.vendors.length} vendors</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userJourney.vendorJourney.vendors.map((vendor: any, index: number) => (
                  <div key={vendor.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{vendor.name || 'Unknown Vendor'}</h4>
                        {vendor.website && (
                          <a href={vendor.website} target="_blank" rel="noopener noreferrer" 
                             className="text-xs text-blue-600 hover:text-blue-800 break-all">
                            {vendor.website}
                          </a>
                        )}
                      </div>
                      {vendor.current_score && (
                        <div className="flex-shrink-0 text-right">
                          <div className="text-sm font-semibold text-gray-900">{vendor.current_score}</div>
                          {vendor.current_grade && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(vendor.current_grade)}`}>
                              {vendor.current_grade}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      {vendor.country && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Country:</span>
                          <span className="text-gray-900">{vendor.country}</span>
                        </div>
                      )}
                      {vendor.email && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Contact:</span>
                          <span className="text-gray-900 truncate">{vendor.email}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Added:</span>
                        <span className="text-gray-900">{format(new Date(vendor.added_date), 'MMM dd, yyyy')}</span>
                      </div>
                      {vendor.reviewStatus && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <span className={`font-medium ${
                            vendor.reviewStatus === 'APPROVED' ? 'text-green-600' :
                            vendor.reviewStatus === 'PENDING' ? 'text-yellow-600' :
                            vendor.reviewStatus === 'REJECTED' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {vendor.reviewStatus}
                          </span>
                        </div>
                      )}
                      {vendor.risk_level && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Risk:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(vendor.risk_level)}`}>
                            {vendor.risk_level}
                          </span>
                        </div>
                      )}
                      {vendor.description && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-gray-600 text-xs leading-4">{vendor.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendor Journey */}
            {userJourney.vendorJourney.summary.total_vendors > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Management</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Vendors</span>
                    <span className="font-medium">{userJourney.vendorJourney.summary.total_vendors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <span className="font-medium">{Math.round(userJourney.vendorJourney.summary.avg_score)}</span>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Risk Distribution</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>Low Risk:</span>
                        <span>{userJourney.vendorJourney.summary.risk_distribution.low}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medium Risk:</span>
                        <span>{userJourney.vendorJourney.summary.risk_distribution.medium}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>High Risk:</span>
                        <span>{userJourney.vendorJourney.summary.risk_distribution.high}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Critical Risk:</span>
                        <span>{userJourney.vendorJourney.summary.risk_distribution.critical}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Task Journey */}
            {userJourney.taskJourney.summary.total_tasks > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Tasks</span>
                    <span className="font-medium">{userJourney.taskJourney.summary.total_tasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-medium text-green-600">{userJourney.taskJourney.summary.status_distribution.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">In Progress</span>
                    <span className="font-medium text-yellow-600">{userJourney.taskJourney.summary.status_distribution.in_progress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Failed</span>
                    <span className="font-medium text-red-600">{userJourney.taskJourney.summary.status_distribution.failed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Completion</span>
                    <span className="font-medium">{Math.round(userJourney.taskJourney.summary.avg_completion_days || 0)} days</span>
                  </div>
                </div>
              </div>
            )}

            {/* Document Journey */}
            {userJourney.documentJourney.summary.total_documents > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Activity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Documents</span>
                    <span className="font-medium">{userJourney.documentJourney.summary.total_documents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Approved</span>
                    <span className="font-medium text-green-600">{userJourney.documentJourney.summary.status_distribution.approved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">In Review</span>
                    <span className="font-medium text-yellow-600">{userJourney.documentJourney.summary.status_distribution.in_review}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="font-medium text-blue-600">{userJourney.documentJourney.summary.status_distribution.created}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Security Events */}
            {userJourney.securityJourney.summary.total_security_events > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Events</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Events</span>
                    <span className="font-medium">{userJourney.securityJourney.summary.total_security_events}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">High Severity</span>
                    <span className="font-medium text-red-600">{userJourney.securityJourney.summary.severity_distribution.high}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Medium Severity</span>
                    <span className="font-medium text-yellow-600">{userJourney.securityJourney.summary.severity_distribution.medium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Unique IPs</span>
                    <span className="font-medium">{userJourney.securityJourney.summary.unique_ips}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedUser && !loading && (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No user selected</h3>
          <p className="mt-1 text-sm text-gray-500">Search for a user above to explore their journey</p>
        </div>
      )}
    </div>
  );
};

export default UserJourneyPage;
