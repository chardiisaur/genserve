'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import AppLogo from '@/components/ui/AppLogo';
import { saveAuthUser, getInitials } from '@/lib/auth';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const demoHints = [
  {
    id: 'demo-admin',
    role: 'Admin',
    email: 'admin@indentrade.com.ph',
    password: 'GSMSadmin@2026',
    description: 'Default admin — created on first run',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    id: 'demo-manager',
    role: 'Manager',
    email: 'manager@indentrade.com.ph',
    password: 'GSMSmgr@2026',
    description: 'Create this account in User Management first',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  {
    id: 'demo-tech',
    role: 'Field Technician',
    email: 'technician@indentrade.com.ph',
    password: 'GSMStech@2026',
    description: 'Create this account in User Management first',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
];

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setAuthError(json.error ?? 'Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      const user = json.user;
      saveAuthUser({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        initials: getInitials(user.name),
      });

      router.push('/');
    } catch {
      setAuthError('Unable to connect. Please try again.');
      setIsLoading(false);
    }
  };

  const autofill = (hint: (typeof demoHints)[0]) => {
    setValue('email', hint.email);
    setValue('password', hint.password);
    setAuthError('');
  };

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-10 bg-background">
      <div className="w-full max-w-md">
        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <AppLogo size={32} />
          <div>
            <span className="font-700 text-base text-foreground">GenServe GSMS</span>
            <span className="text-2xs text-muted-foreground block">Indentrade Systems Corp.</span>
          </div>
        </div>

        <div className="mb-7">
          <h1 className="text-2xl font-700 text-foreground mb-1">Sign in to GSMS</h1>
          <p className="text-sm text-muted-foreground">Generator Service Management System — Internal Portal</p>
        </div>

        {/* Auth error */}
        {authError && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
            <Icon name="ExclamationCircleIcon" size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 font-500">{authError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-500 text-foreground mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@indentrade.com.ph"
              className={`
                w-full h-10 px-3 rounded-lg border text-sm text-foreground bg-card
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                placeholder:text-muted-foreground transition-colors
                ${errors.email ? 'border-red-400 bg-red-50/30' : 'border-input hover:border-muted-foreground'}
              `}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-2xs text-red-600 font-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-500 text-foreground">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`
                  w-full h-10 px-3 pr-10 rounded-lg border text-sm text-foreground bg-card
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  placeholder:text-muted-foreground transition-colors
                  ${errors.password ? 'border-red-400 bg-red-50/30' : 'border-input hover:border-muted-foreground'}
                `}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-2xs text-red-600 font-500">{errors.password.message}</p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              className="w-3.5 h-3.5 rounded border-input text-primary focus:ring-primary/30 cursor-pointer"
              {...register('rememberMe')}
            />
            <label htmlFor="rememberMe" className="text-xs text-muted-foreground cursor-pointer">
              Keep me signed in for 30 days
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-600
              hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
              disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {isLoading ? (
              <>
                <Icon name="ArrowPathIcon" size={15} className="animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in to GSMS'
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-7 pt-6 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="InformationCircleIcon" size={14} className="text-muted-foreground flex-shrink-0" />
            <p className="text-2xs text-muted-foreground font-500">Default accounts — click to autofill credentials</p>
          </div>
          <div className="space-y-2">
            {demoHints.map((hint) => (
              <button
                key={hint.id}
                type="button"
                onClick={() => autofill(hint)}
                className="
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border
                  hover:border-primary/40 hover:bg-muted/60 transition-all duration-150 text-left
                  active:scale-[0.99]
                "
              >
                <span className={`text-2xs font-700 px-2 py-0.5 rounded-md border flex-shrink-0 ${hint.color}`}>
                  {hint.role}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-500 text-foreground truncate">{hint.email}</p>
                  <p className="text-2xs text-muted-foreground">{hint.description}</p>
                </div>
                <Icon name="ArrowRightIcon" size={12} className="text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-2xs text-muted-foreground mt-6">
          Internal use only · Unauthorized access is prohibited
        </p>
      </div>
    </div>
  );
}