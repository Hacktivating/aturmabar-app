import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export function useAppPreferences() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(current => !current), []);
  const setTheme = useCallback((dark: boolean) => setIsDark(dark), []);
  const setLanguageDirectly = useCallback((language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  }, [i18n]);
  const toggleLanguage = useCallback(() => {
    setLanguageDirectly(i18n.language === 'en' ? 'id' : 'en');
  }, [i18n.language, setLanguageDirectly]);
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  return { isDark, toggleTheme, setTheme, toggleLanguage, setLanguageDirectly, handleLogout };
}
