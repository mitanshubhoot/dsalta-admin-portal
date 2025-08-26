import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '@/lib/api';
import ActivityTabs from '@/components/ActivityTabs';

export default function ActivityDetailsPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('7d');
  const [customDates, setCustomDates] = useState({
    from: '',
    to: ''
  });

  useEffect(() => {
    // Check authentication
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const getDateRangeFilter = (range: typeof dateRange) => {
    const now = new Date();
    const from = new Date();
    
    switch (range) {
      case '7d':
        from.setDate(now.getDate() - 7);
        break;
      case '30d':
        from.setDate(now.getDate() - 30);
        break;
      case '90d':
        from.setDate(now.getDate() - 90);
        break;
      case 'custom':
        return {
          from: customDates.from || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          to: customDates.to || now.toISOString()
        };
      default:
        from.setDate(now.getDate() - 7);
    }
    
    return {
      from: from.toISOString(),
      to: now.toISOString()
    };
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 text-gray-400 hover:text-gray-600"
              >
                ← Back to Dashboard
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Activity Details</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Comprehensive view of all system activities with detailed filtering
                </p>
              </div>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-200 rounded-lg p-1">
                {(['7d', '30d', '90d', 'custom'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      dateRange === range
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range === '7d' ? 'Last 7 days' :
                     range === '30d' ? 'Last 30 days' :
                     range === '90d' ? 'Last 90 days' :
                     'Custom'}
                  </button>
                ))}
              </div>
              
              {dateRange === 'custom' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="datetime-local"
                    value={customDates.from}
                    onChange={(e) => setCustomDates({ ...customDates, from: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="datetime-local"
                    value={customDates.to}
                    onChange={(e) => setCustomDates({ ...customDates, to: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <button
                onClick={() => navigate('/logout')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActivityTabs 
          dateRange={getDateRangeFilter(dateRange)}
          className="w-full"
        />
      </div>
    </div>
  );
}
