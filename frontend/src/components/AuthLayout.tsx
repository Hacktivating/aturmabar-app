import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Globe, Moon, ShieldCheck, Sun, Trophy, Users, Zap } from 'lucide-react';
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
    <div className="relative min-h-screen overflow-hidden bg-[#f3f7fb] text-slate-950 transition-colors duration-200 dark:bg-[#08111f] dark:text-slate-100">
      <div className="pointer-events-none absolute -left-28 -top-32 h-80 w-80 rounded-full bg-blue-200/60 blur-3xl dark:bg-blue-900/20" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-lime-200/60 blur-3xl dark:bg-lime-900/10" />

      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Zap size={18} fill="currentColor" aria-hidden="true" />
          </div>
          <span className="text-base font-extrabold tracking-tight sm:text-lg">AturMabar</span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/70 p-1 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
            aria-label={t('switch_language')}
          >
            <Globe size={14} aria-hidden="true" />
            {i18n.language.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={() => setIsDark((current) => !current)}
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-white hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
            aria-label={isDark ? t('use_light_mode') : t('use_dark_mode')}
          >
            {isDark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 pb-10 pt-28 sm:px-8 sm:pt-32 lg:px-10 lg:py-24">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:gap-20">
          <section className="hidden max-w-xl lg:block">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm backdrop-blur dark:border-blue-900/70 dark:bg-slate-900/60 dark:text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
              {t('auth_kicker')}
            </div>
            <h1 className="max-w-lg text-5xl font-black leading-[1.02] tracking-[-0.055em] text-slate-950 dark:text-white xl:text-6xl">
              {t('auth_heading')}
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-600 dark:text-slate-300">
              {t('auth_description')}
            </p>

            <div className="mt-9 grid max-w-lg grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/80 bg-white/65 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
                <Users className="mb-4 text-blue-600 dark:text-blue-400" size={20} aria-hidden="true" />
                <p className="text-xs font-bold leading-5 text-slate-700 dark:text-slate-200">{t('auth_benefit_members')}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/65 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
                <Trophy className="mb-4 text-amber-500" size={20} aria-hidden="true" />
                <p className="text-xs font-bold leading-5 text-slate-700 dark:text-slate-200">{t('auth_benefit_scores')}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/65 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
                <ShieldCheck className="mb-4 text-emerald-600 dark:text-emerald-400" size={20} aria-hidden="true" />
                <p className="text-xs font-bold leading-5 text-slate-700 dark:text-slate-200">{t('auth_benefit_ready')}</p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              <span>{t('auth_footer_note')}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </div>
          </section>

          <section className="w-full max-w-md justify-self-center lg:justify-self-end">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Zap size={19} fill="currentColor" aria-hidden="true" />
              </div>
              <div>
                <p className="text-lg font-extrabold tracking-tight">AturMabar</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('auth_kicker')}</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/90 bg-white/90 p-6 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8 dark:border-slate-800 dark:bg-slate-900/90">
              <div className="mb-7">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">{t('auth_form_label')}</p>
                <h2 className="text-2xl font-black tracking-tight sm:text-[1.75rem]">{title}</h2>
              </div>
              {children}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
