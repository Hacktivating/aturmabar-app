import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import api from '../api/axios';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage({ type: 'error', text: 'Invalid token' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      setMessage({ type: 'success', text: response.data.message });
      setTimeout(() => navigate('/login'), 3000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Connection failed' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return <AuthLayout title="Error"><p className="text-center text-red-500">No reset token provided in URL.</p></AuthLayout>;

  return (
    <AuthLayout title={t('reset_pwd')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {message && (
          <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
            {message.text}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">{t('new_pwd')}</label>
          <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
        </div>
        <button type="submit" disabled={isLoading} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors">
          {isLoading ? '...' : t('reset_pwd')}
        </button>
      </form>
    </AuthLayout>
  );
}