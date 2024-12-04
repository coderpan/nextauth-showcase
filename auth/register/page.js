'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Link, useRouter } from '@/i18n/routing';
import AuthLayout from '@/components/AuthLayout';
import { motion } from 'framer-motion';

export default function Register() {
  const { toast } = useToast();
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        variant: "destructive",
        title: t('errors.invalidEmail')
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/email/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'register' }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage = data.code ? t(`errors.${data.code.toLowerCase()}`) : data.error;
        throw new Error(errorMessage);
      }

      toast({
        title: t('codeSent'),
        description: t('checkEmail')
      });
      setStep('code');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast({
        variant: "destructive",
        title: t('errors.invalidCode')
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, type: 'register' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStep('password');
    } catch (error) {
      toast({
        variant: "destructive",
        title: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      toast({
        variant: "destructive",
        title: t('errors.passwordTooShort')
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t('errors.passwordMismatch')
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/email/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: t('registerSuccess'),
        description: t('backToSignIn')
      });
      router.push('/auth/signin');
    } catch (error) {
      toast({
        variant: "destructive",
        title: error.message
      });
    } finally {
      setIsLoading(false);
    }
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
            {t('createAccount')}
          </h1>
          <p className="text-sm text-gray-400">
            {t('alreadyHaveAccount')}{' '}
            <Link
              href="/auth/signin"
              className="text-music-primary hover:text-music-primary/80 font-medium"
            >
              {t('signIn')}
            </Link>
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">
                {t('emailAddress')}
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-music-primary hover:bg-music-primary/90"
            >
              {isLoading ? t('sending') : t('sendCode')}
            </Button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="code" className="text-sm font-medium text-gray-300">
                {t('verificationCode')}
              </label>
              <div className="relative">
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t('codePlaceholder')}
                  maxLength={6}
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  required
                />
                {countdown > 0 ? (
                  <span className="absolute right-3 top-3 text-sm text-gray-400">
                    {countdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="absolute right-3 top-3 text-sm text-music-primary hover:text-music-primary/80"
                    disabled={isLoading}
                  >
                    {t('resend')}
                  </button>
                )}
              </div>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-music-primary hover:bg-music-primary/90"
            >
              {isLoading ? t('verifying') : t('verify')}
            </Button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                {t('password')}
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                {t('confirmPassword')}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-music-primary hover:bg-music-primary/90"
            >
              {isLoading ? t('creating') : t('createAccount')}
            </Button>
          </form>
        )}

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