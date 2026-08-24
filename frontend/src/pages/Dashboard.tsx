import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, LogOut, Moon, Sun, Globe } from 'lucide-react';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('language', nextLang);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-md flex items-center justify-center">
            <Zap className="text-white" size={20} fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tight">AturMabar</span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={toggleLanguage} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-2 text-sm font-medium">
            <Globe size={18} />
            <span className="hidden sm:inline">{i18n.language.toUpperCase()}</span>
          </button>
          <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>
          <span className="text-sm font-medium hidden sm:inline">{user?.username}</span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-600 font-medium px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>
      {/* Rest of the dashboard main content remains unchanged */}
    </div>
  );
}