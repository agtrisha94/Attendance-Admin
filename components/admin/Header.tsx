
import React from 'react';
import { Bell, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuToggle }) => (
  <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
    <button className="md:hidden text-gray-800 dark:text-gray-200" onClick={onMenuToggle}>
      <Menu size={24} />
    </button>
    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
    <div className="flex items-center gap-4">
      <Bell size={20} className="text-gray-600 dark:text-gray-400" />
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
        A
      </div>
    </div>
  </header>
);

export default Header;