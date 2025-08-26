import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAuthToken } from '@/lib/api';

export default function ActivityDetailPage() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading activity details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <button
              onClick={() => navigate('/activities')}
              className="text-indigo-600 hover:text-indigo-900 mb-4 inline-flex items-center"
            >
              ← Back to Activities
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Activity Details
            </h1>
            <p className="text-gray-600 mt-2">Activity ID: {id}</p>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Activity Information</h2>
            </div>
            
            <div className="px-6 py-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Action</dt>
                  <dd className="mt-1 text-sm text-gray-900">User Login</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Entity Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">User</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">admin@dsalta.com</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">Admin User</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">IP Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">192.168.1.100</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User Agent</dt>
                  <dd className="mt-1 text-sm text-gray-900">Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                  <dd className="mt-1 text-sm text-gray-900">2025-08-25 23:14:46 UTC</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Organization</dt>
                  <dd className="mt-1 text-sm text-gray-900">Dsalta</dd>
                </div>
              </dl>
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify({
                    login_method: "password",
                    browser: "Chrome",
                    os: "macOS",
                    success: true
                  }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Related Activities</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Previous Login</div>
                    <div className="text-sm text-gray-500">2 hours ago</div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm">
                    View Details
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Profile Update</div>
                    <div className="text-sm text-gray-500">1 day ago</div>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
