import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Mail } from 'lucide-react';

export default function VerifyRequest() {
  const t = useTranslations('auth');

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 space-y-8 text-center">
        <Mail className="mx-auto h-12 w-12 text-music-primary" />
        <h2 className="text-2xl font-bold text-white">
          {t('checkYourEmail')}
        </h2>
        <p className="text-gray-400">
          {t('emailSent')}
        </p>
        <Link 
          href="/auth/signin"
          className="text-music-primary hover:text-music-primary/80"
        >
          {t('backToSignIn')}
        </Link>
      </div>
    </div>
  );
}