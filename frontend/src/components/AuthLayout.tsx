import React, { useEffect, useState } from 'react';
import { Globe, Moon, Sun, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  const { i18n, t } = useTranslation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-20 text-slate-950 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-full max-w-3xl -translate-x-1/2 bg-blue-100/40 blur-3xl dark:bg-blue-950/20" />

      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Zap size={18} fill="currentColor" aria-hidden="true" />
          </div>
          <span className="text-base font-extrabold tracking-tight sm:text-lg">AturMabar</span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
            aria-label={t('switch_language')}
          >
            <Globe size={14} aria-hidden="true" />
            {i18n.language.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={() => setIsDark((current) => !current)}
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
            aria-label={isDark ? t('use_light_mode') : t('use_dark_mode')}
          >
            {isDark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main className="relative z-[1] w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">{t('auth_form_label')}</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-[1.75rem]">{title}</h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.4)] sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          {children}
        </div>
      </main>
    </div>
  );
}
