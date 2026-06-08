import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Recommendations from './pages/Recommendations';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import CampaignMonitoring from './pages/admin/CampaignMonitoring';
import AuditLog from './pages/admin/AuditLog';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root ke login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <PrivateRoute>
              <Recommendations />
            </PrivateRoute>
          }
        />

        {/* Admin Protected routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/campaigns"
          element={
            <AdminRoute>
              <AdminLayout>
                <CampaignMonitoring />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <AdminRoute>
              <AdminLayout>
                <AuditLog />
              </AdminLayout>
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;