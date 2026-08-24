import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import api from '../api/axios';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/auth/login', {
        identifier,
        password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setMessage({ type: 'success', text: response.data.message });
      
      // Redirect to dashboard (placeholder route)
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to connect to the server' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title={t('login')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {message && (
          <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
            {message.text}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">{t('identifier')}</label>
          <input 
            type="text" 
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('password')}</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          {isLoading ? '...' : t('login')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        {t('no_account')} <Link to="/register" className="text-blue-600 hover:underline font-medium">{t('register')}</Link>
      </p>
    </AuthLayout>
  );
}