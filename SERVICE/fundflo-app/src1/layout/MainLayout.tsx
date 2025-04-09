import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../features/auth/hooks/useAuth';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Your Company Name
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;