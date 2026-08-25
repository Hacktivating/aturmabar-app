import React, { useEffect, useState } from 'react';
import { Zap, Sun, Moon, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  const { i18n } = useTranslation();
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
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A] p-4 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Global Setting Toggles */}
      <div className="absolute top-4 right-4 flex items-center gap-2 sm:gap-4">
        <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
          <Globe size={16} />
          {i18n.language.toUpperCase()}
        </button>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-700"></div>
        <button onClick={() => setIsDark(!isDark)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="mb-6 sm:mb-8 flex items-center gap-2">
        <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg flex items-center justify-center text-white">
          <Zap size={20} className="sm:w-6 sm:h-6" fill="currentColor" />
        </div>
        <span className="text-xl sm:text-2xl font-bold tracking-tight">AturMabar</span>
      </div>
      
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-in zoom-in-95 duration-300">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">{title}</h2>
        {children}
      </div>
    </div>
  );
}