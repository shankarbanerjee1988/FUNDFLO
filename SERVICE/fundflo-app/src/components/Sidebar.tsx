import { Home, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import React from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: Props) {
  return (
    <aside className={`fixed md:static z-40 top-0 left-0 h-full w-64 bg-gray-100 dark:bg-gray-900 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="md:hidden p-4 text-right">
        <button onClick={onClose} className="text-sm text-gray-500">Close</button>
      </div>
      <nav className="p-4 flex flex-col gap-2">
        <NavLink to="/dashboard" className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">
          <Home size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/settings" className="flex items-center gap-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">
          <Settings size={20} />
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}