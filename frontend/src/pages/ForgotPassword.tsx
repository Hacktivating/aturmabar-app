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

  const inputStyles = 'w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 pl-11 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950/70 dark:text-white dark:placeholder:text-slate-500';

  return (
    <AuthLayout title={t('forgot_password_title')}>
      <p className="mb-6 text-sm leading-6 text-slate-500 dark:text-slate-400">
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
          <label htmlFor="reset-email" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
            {t('email')}
          </label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition duration-150 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
        >
          {isLoading && <Loader2 size={17} className="animate-spin" aria-hidden="true" />}
          {isLoading ? t('processing') : t('send_reset_link')}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5 text-center dark:border-slate-800">
        <Link to="/login" className="text-sm font-extrabold text-blue-600 transition hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400">
          {t('back_to_login')}
        </Link>
      </div>
    </AuthLayout>
  );
}
