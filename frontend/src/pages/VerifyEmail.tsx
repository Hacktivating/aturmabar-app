import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  // Prevent React StrictMode from firing the API call twice
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('verification_failed'));
      return;
    }

    if (hasCalledAPI.current) return;
    hasCalledAPI.current = true;

    const verifyToken = async () => {
      try {
        const response = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || t('verify_email_title'));

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || t('verification_failed'));
      }
    };

    verifyToken();
  }, [token, navigate, t]);

  return (
    <AuthLayout title={t('verify_email_title')}>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin text-ink mb-4" size={48} />
            <p className="text-muted-ink dark:text-muted-dark">{t('verification_pending')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="text-green-500 mb-4" size={48} />
            <p className="text-primary dark:text-primary-dark font-semibold">{message}</p>
            <p className="mt-2 text-sm text-muted-ink dark:text-muted-dark">{t('verification_success_redirect')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="text-red-500 mb-4" size={48} />
            <p className="font-semibold text-primary dark:text-primary-dark">{message}</p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}