import React, { useState } from 'react';
import { CheckCircle2, Loader2, Mail, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
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

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      setMessage({ type: 'success', text: response.data.message });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: getApiErrorMessage(error, t('server_error')) });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = 'w-full rounded-xl border border-subtle bg-app/80 px-4 py-3.5 pl-11 text-sm font-medium text-primary outline-none transition placeholder:text-faint focus:border-ink focus:ring-4 focus:ring-ink/10 dark:border-default-dark dark:bg-app-dark/70 dark:text-primary-dark dark:placeholder:text-muted-ink';

  return (
    <AuthLayout title={t('forgot_password_title')}>
      <p className="mb-6 text-sm leading-6 text-muted-ink dark:text-faint">
        {t('forgot_password_description')}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          <label htmlFor="reset-email" className="mb-2 block text-sm font-bold text-primary-soft dark:text-primary-dark">
            {t('email')}
          </label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('ph_email')}
              className={inputStyles}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition duration-150 hover:bg-ink-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/30"
        >
          {isLoading && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
          {isLoading ? t('processing') : t('send_reset_link')}
        </button>
      </form>

      <div className="mt-6 border-t border-subtle pt-5 text-center dark:border-subtle-dark">
        <Link to="/login" className="text-sm font-extrabold text-ink transition hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:text-ink-dark">
          {t('back_to_login')}
        </Link>
      </div>
    </AuthLayout>
  );
}
