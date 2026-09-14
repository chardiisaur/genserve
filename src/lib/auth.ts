'use client';

export interface AuthUser {
  email: string;
  role: string;
  name: string;
  initials: string;
}

const AUTH_KEY = 'gsms_auth_user';

export const demoCredentials: AuthUser[] = [
  { email: 'admin@indentrade.com.ph', role: 'Admin', name: 'Ana Reyes', initials: 'AR' },
  { email: 'manager@indentrade.com.ph', role: 'Manager', name: 'Marco Santos', initials: 'MS' },
  { email: 'technician@indentrade.com.ph', role: 'Field Technician', name: 'Rico Dela Cruz', initials: 'RD' },
];

export function saveAuthUser(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearAuthUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
  }
}
