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
      setSuccess(t('login_success'));
      navigate(response.data.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, t('invalid_creds')));
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = 'w-full rounded-xl border border-subtle bg-app/80 px-4 py-3.5 text-sm font-medium text-primary outline-none transition placeholder:text-faint focus:border-ink focus:ring-4 focus:ring-ink/10 dark:border-default-dark dark:bg-app-dark/70 dark:text-primary-dark dark:placeholder:text-muted-ink';
  const labelStyles = 'mb-2 block text-sm font-bold text-primary-soft dark:text-primary-dark';

  return (
    <AuthLayout title={t('login')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-medium leading-5 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium leading-5 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{success}</span>
          </div>
        )}

        <div>
          <label htmlFor="identifier" className={labelStyles}>{t('email')} / {t('username')}</label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={t('login_identifier_hint')}
              className={`${inputStyles} pl-11`}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="password" className={`${labelStyles} mb-0`}>{t('password')}</label>
            <Link to="/forgot-password" className="text-xs font-bold text-ink transition hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:text-ink-dark dark:hover:text-ink-dark">
              {t('forgot_password')}
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${inputStyles} pl-11 pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-faint transition hover:bg-muted hover:text-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:hover:bg-elevated dark:hover:text-primary-soft"
              aria-label={showPassword ? t('hide_password') : t('show_password')}
            >
              {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition duration-150 hover:bg-ink-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/30"
        >
          {isLoading && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
          {isLoading ? t('loading') : t('login')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-ink dark:text-faint">
        {t('no_account')}{' '}
        <Link to="/register" className="font-extrabold text-ink transition hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:text-ink-dark">
          {t('register')}
        </Link>
      </p>
    </AuthLayout>
  );
}
