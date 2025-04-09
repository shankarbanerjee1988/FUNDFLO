import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../features/auth/hooks/useAuth';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex">
        {isAuthenticated && <Sidebar />}
        <div className="flex-1 flex flex-col">
          {isAuthenticated && (
            <Header>
              <button onClick={() => setDarkMode(!darkMode)} className="ml-auto px-4 py-2">
                {darkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
            </Header>
          )}
          <main className="flex-grow p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;