import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { authApi, getAuthToken } from '@/lib/api';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ActivitiesPage from '@/pages/ActivitiesPage';
import ActivityDetailPage from '@/pages/ActivityDetailPage';
import ActivityDetailsPage from '@/pages/ActivityDetailsPage';
import UserJourneyPage from '@/pages/UserJourneyPage';
import VendorManagementPage from '@/pages/VendorManagementPage';
import LoadingSpinner from '@/components/LoadingSpinner';

function App() {
  const token = getAuthToken();
  
  const { data: authData, isLoading, error } = useQuery(
    'auth-verify',
    authApi.verify,
    {
      enabled: !!token,
      retry: false,
    }
  );

  // Show loading spinner while checking authentication
  if (token && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If no token or auth failed, show login
  if (!token || error) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // If authenticated, show the app
  return (
    <Layout user={authData?.user}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/activities/:id" element={<ActivityDetailPage />} />
        <Route path="/activity-details" element={<ActivityDetailsPage />} />
        <Route path="/user-journey" element={<UserJourneyPage />} />
        <Route path="/vendor-management" element={<VendorManagementPage />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
