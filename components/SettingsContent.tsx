"use client";
import React from 'react';
import { useTheme } from '../context/ThemeContext';

const SettingsContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 dark:text-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      
      {/* New Theme Setting */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="theme-toggle">
          App Theme
        </label>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="theme-toggle"
            className="sr-only peer"
            checked={theme === 'dark'}
            onChange={toggleTheme}
          />
          <label
            htmlFor="theme-toggle"
            className="relative flex items-center cursor-pointer w-12 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:bg-gray-600 dark:peer-checked:bg-blue-700"
          ></label>
          <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-200">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>
      </div>

      <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
        Save Settings
      </button>
    </div>
  );
};

export default SettingsContent;