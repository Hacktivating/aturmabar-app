import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, TriangleAlert } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setMessage({ type: 'error', text: t('invalid_reset_token') });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      setMessage({ type: 'success', text: response.data.message });
      window.setTimeout(() => navigate('/login'), 2200);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: getApiErrorMessage(error, t('server_error')) });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = 'w-full rounded-xl border border-subtle bg-app/80 px-4 py-3.5 pl-11 pr-12 text-sm font-medium text-primary outline-none transition placeholder:text-faint focus:border-ink focus:ring-4 focus:ring-ink/10 dark:border-default-dark dark:bg-app-dark/70 dark:text-primary-dark dark:placeholder:text-muted-ink';

  return (
    <AuthLayout title={t('reset_password_title')}>
      <p className="mb-6 text-sm leading-6 text-muted-ink dark:text-faint">
        {t('reset_password_description')}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {!token && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-medium leading-5 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{t('invalid_reset_token')}</span>
          </div>
        )}
        {message && (
          <div
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm font-medium leading-5 ${message.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300'}`}
          >
            {message.type === 'error' ? <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />}
            <span>{message.text}</span>
          </div>
        )}

        <div>
          <label htmlFor="new-password" className="mb-2 block text-sm font-bold text-primary-soft dark:text-primary-dark">
            {t('new_password_label')}
          </label>
          <div className="relative">
            <KeyRound size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
            <input
              id="new-password"
              name="newPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={inputStyles}
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
          disabled={isLoading || !token}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition duration-150 hover:bg-ink-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/30"
        >
          {isLoading && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
          {isLoading ? t('processing') : t('reset_password')}
        </button>
      </form>
    </AuthLayout>
  );
}
