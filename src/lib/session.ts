import { getIronSession, IronSession, IronSessionOptions } from 'iron-session';
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

export const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_SECRET ?? 'gsms-secret-key-change-in-production-32chars',
  cookieName: 'gsms_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
