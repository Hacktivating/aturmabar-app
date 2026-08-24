import React, { useEffect, useState, useRef } from 'react';
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
      setMessage(t('error_verify'));
      return;
    }

    if (hasCalledAPI.current) return;
    hasCalledAPI.current = true;

    const verifyToken = async () => {
      try {
        const response = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || t('success_verify'));
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || t('error_verify'));
      }
    };

    verifyToken();
  }, [token, navigate, t]);

  return (
    <AuthLayout title={t('verify_title')}>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="text-gray-600 dark:text-gray-400">{t('verify_desc')}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="text-green-500 mb-4" size={48} />
            <p className="text-green-600 dark:text-green-400 font-medium">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="text-red-500 mb-4" size={48} />
            <p className="text-red-600 dark:text-red-400 font-medium">{message}</p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}