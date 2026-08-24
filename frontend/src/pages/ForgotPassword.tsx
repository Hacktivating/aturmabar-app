import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import api from '../api/axios';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage({ type: 'success', text: response.data.message });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Connection failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title={t('forgot_pwd')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {message && (
          <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
            {message.text}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">{t('email')}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
        </div>
        <button type="submit" disabled={isLoading} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors">
          {isLoading ? '...' : t('send_reset')}
        </button>
      </form>
      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm text-blue-600 hover:underline font-medium">{t('back_login')}</Link>
      </div>
    </AuthLayout>
  );
}