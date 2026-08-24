import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';

export default function Register() {
  const { t } = useTranslation();

  return (
    <AuthLayout title={t('register')}>
      <form className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('email')}</label>
          <input 
            type="email" 
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('username')}</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('password')}</label>
          <input 
            type="password" 
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <button 
          type="button" 
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          {t('register')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        {t('have_account')} <Link to="/login" className="text-blue-600 hover:underline font-medium">{t('login')}</Link>
      </p>
    </AuthLayout>
  );
}