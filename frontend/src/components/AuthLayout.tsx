import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe, Zap } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title }) => {
  const { i18n } = useTranslation();
  
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative">
      
      {/* Top Controls */}
      <div className="absolute top-4 right-4 flex gap-4">
        <button 
          onClick={toggleLanguage}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition flex items-center gap-2 text-sm font-medium"
        >
          <Globe size={20} />
          {i18n.language.toUpperCase()}
        </button>
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* AturMabar Branding Header */}
      <div className="mb-8 flex items-center gap-2">
        <div className="bg-blue-600 p-2 rounded-lg flex items-center justify-center">
          <Zap className="text-white" size={24} fill="currentColor" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">AturMabar</h1>
      </div>

      {/* Authentication Card */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-2xl p-6 sm:p-10">
        <h2 className="text-2xl font-semibold mb-6 text-center tracking-tight">
          {title}
        </h2>
        {children}
      </div>
      
    </div>
  );
};