'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthError() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 space-y-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold text-white">
          {t(`errors.${error}`, { fallback: t('errors.default') })}
        </h2>
        <Button asChild className="bg-music-primary hover:bg-music-primary/90">
          <Link href="/auth/signin">
            {t('backToSignIn')}
          </Link>
        </Button>
      </div>
    </div>
  );
}