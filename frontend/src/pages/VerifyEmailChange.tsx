import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';

export default function VerifyEmailChange() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('missing_token'));
      return;
    }

    if (hasCalledAPI.current) return;
    hasCalledAPI.current = true;

    const verifyEmailChange = async () => {
      try {
        const response = await api.post('/auth/verify-email-change', { token });
        setStatus('success');
        setMessage(response.data.message || t('verify_email_success'));

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setTimeout(() => navigate('/login'), 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || t('op_failed'));
      }
    };

    verifyEmailChange();
  }, [token, navigate, t]);

  return (
    <AuthLayout title={t('verify_email_change_title')}>
      <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in-95 duration-300">
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin text-ink mb-4" size={48} />
            <p className="text-muted-ink dark:text-muted-dark">{t('verification_pending')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="text-emerald-500 mb-4" size={48} />
            <p className="font-semibold text-primary dark:text-primary-dark">{message}</p>
            <p className="mt-2 text-sm text-muted-ink dark:text-muted-dark">{t('verification_success_redirect')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="text-rose-500 mb-4" size={48} />
            <p className="font-semibold text-primary dark:text-primary-dark">{message}</p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}