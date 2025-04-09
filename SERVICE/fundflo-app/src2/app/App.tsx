import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import OrdersPage from '../features/orders/pages/OrdersPage';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/orders" element={<MainLayout><OrdersPage /></MainLayout>} />
      </Route>
    </Routes>
  );
};

export default App;