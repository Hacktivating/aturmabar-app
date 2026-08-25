import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

export default function Login() {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/login', { identifier, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setSuccess(t('login_success'));
      
      setTimeout(() => {
        if (response.data.user.role === 'admin') navigate('/admin');
        else navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || t('invalid_creds'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all";
  const labelStyles = "block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300";

  return (
    <AuthLayout title={t('login')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:border-red-900/50 rounded-lg text-sm font-medium">{error}</div>}
        {success && <div className="p-3 bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:border-green-900/50 rounded-lg text-sm font-medium">{success}</div>}
        
        <div>
          <label className={labelStyles}>{t('email')} / {t('username')}</label>
          <input type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={inputStyles} />
        </div>
        
        <div>
          <label className={labelStyles}>{t('password')}</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputStyles} pr-10`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-lg shadow-sm transition-colors">
          {isLoading ? t('loading') : t('login')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
        {t('no_account')} <Link to="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">{t('register')}</Link>
      </p>
    </AuthLayout>
  );
}