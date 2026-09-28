import React, { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, TriangleAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import api from '../api/axios';

type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const apiError = error as ApiError;
    return apiError.response?.data?.error || fallback;
  }
  return fallback;
}

export default function Login() {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const userStr = localStorage.getItem('user');
    let isAdmin = false;
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr) as { role?: string };
        isAdmin = parsedUser.role === 'admin';
      } catch {
        // Ignore malformed cached profile data; the token is still handled by the app guard.
      }
    }
    navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/login', { identifier: identifier.trim(), password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setSuccess(t('login_success', 'Login successful!'));
      navigate(response.data.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, t('invalid_creds', 'Invalid credentials')));
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = 'w-full pl-11 pr-4 py-3.5 bg-surface dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-ink text-sm font-bold text-primary dark:text-white transition-all placeholder:text-muted-ink dark:placeholder:text-zinc-600';
  const labelStyles = 'block text-[10px] font-bold mb-2 text-muted-ink dark:text-zinc-400 uppercase tracking-widest';

  return (
    <AuthLayout title={t('login', 'Sign In')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in fade-in duration-300" noValidate>
        
        {/* Error State */}
        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 shadow-sm">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="leading-tight">{error}</span>
          </div>
        )}
        
        {/* Success State */}
        {success && (
          <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-sm">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="leading-tight">{success}</span>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {/* Identifier Input */}
          <div>
            <label htmlFor="identifier" className={labelStyles}>{t('email', 'Email')} / {t('username', 'Username')}</label>
            <div className="relative">
              <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" aria-hidden="true" />
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={t('login_identifier_hint', 'Enter your email or username')}
                className={inputStyles}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className={`${labelStyles} mb-0`}>{t('password', 'Password')}</label>
              <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-ink dark:text-white transition-colors hover:opacity-70 focus-visible:outline-none">
                {t('forgot_password', 'Forgot?')}
              </Link>
            </div>
            <div className="relative">
              <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('login_password_hint', 'Enter your password')}
                className={`${inputStyles} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-ink dark:text-zinc-500 transition-colors hover:bg-muted dark:hover:bg-zinc-800 hover:text-primary dark:hover:text-white focus-visible:outline-none cursor-pointer"
                aria-label={showPassword ? t('hide_password', 'Hide password') : t('show_password', 'Show password')}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-ink dark:bg-white px-4 py-4 text-base font-black text-white dark:text-zinc-900 shadow-sm transition-all hover:bg-ink-soft dark:hover:bg-zinc-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {isLoading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          {isLoading ? t('loading', 'Signing in...') : t('login', 'Sign In')}
        </button>
      </form>
      
      {/* Footer Link */}
      <p className="mt-8 text-center text-sm font-medium text-muted-ink dark:text-zinc-500">
        {t('no_account', "Don't have an account?")}{' '}
        <Link to="/register" className="font-black text-ink dark:text-white transition-colors hover:opacity-70 focus-visible:outline-none">
          {t('register', 'Create one')}
        </Link>
      </p>
    </AuthLayout>
  );
}