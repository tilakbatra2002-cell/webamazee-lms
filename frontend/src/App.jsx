import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import Login from './pages/Login';
import RegisterCompany from './pages/RegisterCompany';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Scraper from './pages/Scraper';
import Pipeline from './pages/Pipeline';
import FollowUps from './pages/FollowUps';
import Meetings from './pages/Meetings';
import Proposals from './pages/Proposals';
import Analytics from './pages/Analytics';
import UsersPage from './pages/Users';
import SettingsPage from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterCompany />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/scraper" element={<Scraper />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/followups" element={<FollowUps />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
