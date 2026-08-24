import React from 'react';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const { t } = useTranslation();

  return (
    <AuthLayout title={t('verify_title')}>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-gray-600 dark:text-gray-400">
          {t('verify_desc')}
        </p>
      </div>
    </AuthLayout>
  );
}