import { Menu } from 'lucide-react';
import { useState } from 'react';
import React from "react";

interface Props {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: Props) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b p-4 flex justify-between items-center shadow-sm">
      <button className="md:hidden" onClick={onToggleSidebar}>
        <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
      </button>
      <h1 className="text-lg font-bold text-gray-800 dark:text-white">My App</h1>
      <div className="flex items-center gap-2">
        <img
          src="/avatar.png"
          alt="User"
          className="w-8 h-8 rounded-full border"
        />
      </div>
    </header>
  );
}