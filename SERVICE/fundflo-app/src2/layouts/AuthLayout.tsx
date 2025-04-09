import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

const AuthLayout: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Header />
    <main className="flex-grow container mx-auto px-4 py-6">
      <Outlet />
    </main>
  </div>
);

export default AuthLayout;