import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SessionData {
  user?: SessionUser;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SESSION_SECRET environment variable is not set. ' +
        'A strong secret is required in production. '+ 'Set SESSION_SECRET to a random string of at least 32 characters.'
      );
    }
    // Development-only fallback — never used in production
    console.warn(
      '[SECURITY WARNING] SESSION_SECRET is not set. ' +
      'Using a development-only fallback. Set SESSION_SECRET before deploying to production.'
    );
    return 'dev-only-fallback-secret-DO-NOT-USE-IN-PRODUCTION!!';
  }
  if (secret.length < 32) {
    console.warn(
      '[SECURITY WARNING] SESSION_SECRET is shorter than 32 characters. ' +
      'Use a longer, randomly generated secret for production.'
    );
  }
  return secret;
}

export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: 'gsms_session',
  ttl: 60 * 60 * 24 * 7, // 7 days
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
