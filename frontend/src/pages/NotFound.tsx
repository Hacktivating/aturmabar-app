import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark flex flex-col items-center justify-center p-4 sm:p-8 text-primary dark:text-primary-dark transition-colors duration-200">
      <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-2xl shadow-sm p-8 sm:p-12 max-w-md w-full text-center flex flex-col items-center">

        <div className="w-20 h-20 bg-accent-soft dark:bg-accent-soft-dark text-ink dark:text-ink-dark rounded-full flex items-center justify-center mb-6">
          <FileQuestion size={40} />
        </div>

        <h1 className="text-4xl font-black tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-bold mb-3">{t('not_found_title', 'Page Not Found')}</h2>

        <p className="text-muted-ink dark:text-faint text-sm sm:text-base mb-8">
          {t('not_found_desc', "The page you are looking for doesn't exist or has been moved.")}
        </p>

        <Link
          to="/"
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-ink hover:bg-ink-soft text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <Home size={18} />
          {t('return_home', 'Return Home')}
        </Link>
      </div>
    </div>
  );
}