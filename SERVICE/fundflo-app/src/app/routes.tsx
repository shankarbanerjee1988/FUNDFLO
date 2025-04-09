import { Routes, Route } from 'react-router-dom';
import Login from '../features/auth/pages/LoginPage';
import Dashboard from '../features/dashboard/pages/DashboardPage';
import ProtectedRoute from './ProtectedRoute';
import React from 'react';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
}