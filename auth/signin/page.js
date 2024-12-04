'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/AuthLayout';
import { motion } from 'framer-motion';
import { authenticate } from './actions';
import { useSharedSession } from '@/contexts/SessionContext';
import { useLocale } from 'next-intl';

// 内联 SVG 组件
const GoogleIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const MicrosoftIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 23 23"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path fill="#f35325" d="M1 1h10v10H1z" />
    <path fill="#81bc06" d="M12 1h10v10H12z" />
    <path fill="#05a6f0" d="M1 12h10v10H1z" />
    <path fill="#ffba08" d="M12 12h10v10H12z" />
  </svg>
);

export default function SignIn() {
  const locale = useLocale();
  const { data: session, status } = useSharedSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(`/${locale}/`);
    }
  }, [status, router, locale]);
  
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get('callbackUrl') || '/';
  const callbackUrl = rawCallbackUrl.startsWith(`/${locale}`) 
    ? rawCallbackUrl 
    : `/${locale}${rawCallbackUrl}`;
  const error = searchParams.get('error');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authenticate(email, password);

      if (result.success) {
        toast({
          title: t('signInSuccess'),
        });
        window.location.href = callbackUrl;
        return;
      }

      if (result.error) {
        switch (result.error) {
          case 'AccountNotLinked':
            toast({
              variant: "destructive",
              title: t('errors.AccountNotLinked'),
            });
            break;
          case 'CredentialsSignin':
            toast({
              variant: "destructive",
              title: t('errors.invalidCredentials'),
            });
            break;
          default:
            toast({
              variant: "destructive",
              title: t('errors.default'),
            });
        }
      }
    } catch (error) {
      console.error('Client error:', error);
      toast({
        variant: "destructive",
        title: t('errors.default')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (provider) => {
    signIn(provider, { callbackUrl });
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t('signInToAccount')}
          </h1>
          <p className="text-sm text-gray-400">
            {t('welcomeBack')}
          </p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
            {t(`errors.${error}`, { fallback: t('errors.default') })}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            required
          />
          <div className="space-y-1">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              required
            />
            <div className="flex justify-end">
              <Link
                href="/auth/reset-password"
                className="text-sm text-music-primary hover:text-music-primary/80"
              >
                {t('forgotPassword')}
              </Link>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-music-primary hover:bg-music-primary/90"
          >
            {isLoading ? t('loading') : t('signIn')}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-2 text-gray-500">
              {t('orContinueWith')}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => handleOAuthSignIn('google')}
            variant="outline"
            className="w-full h-11 bg-white/5 hover:bg-white/10 border-white/10 text-white"
          >
            <GoogleIcon />
            <span className="ml-2">{t('continueWith', { provider: 'Google' })}</span>
          </Button>

          <Button
            onClick={() => handleOAuthSignIn('microsoft-entra-id')}
            variant="outline"
            className="w-full h-11 bg-white/5 hover:bg-white/10 border-white/10 text-white"
          >
            <MicrosoftIcon />
            <span className="ml-2">{t('continueWith', { provider: 'Microsoft' })}</span>
          </Button>
        </div>

        <p className="text-sm text-center text-gray-400">
          {t('noAccount')}{' '}
          <Link
            href="/auth/register"
            className="text-music-primary hover:text-music-primary/80 font-medium"
          >
            {t('signUp')}
          </Link>
        </p>

        <p className="text-xs text-center text-gray-500">
          {t('termsNotice')}{' '}
          <Link href="/tos" className="underline hover:text-white">
            {t('termsOfService')}
          </Link>{' '}
          {t('and')}{' '}
          <Link href="/privacy-policy" className="underline hover:text-white">
            {t('privacyPolicy')}
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}