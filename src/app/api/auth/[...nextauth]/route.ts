import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider, { type GoogleProfile } from 'next-auth/providers/google';
import type { JWT } from 'next-auth/jwt';
import type { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const defaultSuperAdmins = ['newhosung@gmail.com', 'tvs5971@psu.edu'];
const envSuperAdmins = (process.env.SUPER_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const superAdminEmailSet = new Set(
  [...defaultSuperAdmins.map((email) => email.toLowerCase()), ...envSuperAdmins],
);

const isSuperAdminEmail = (email?: string | null) =>
  email ? superAdminEmailSet.has(email.toLowerCase()) : false;

type SanitizedGoogleProfile = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
};

const toGoogleProfile = (profile: unknown): SanitizedGoogleProfile | null => {
  if (!profile || typeof profile !== 'object') return null;
  const candidate = profile as Partial<GoogleProfile>;

  const sub = typeof candidate.sub === 'string' ? candidate.sub : undefined;
  const email = typeof candidate.email === 'string' ? candidate.email.toLowerCase() : undefined;
  const name = typeof candidate.name === 'string' ? candidate.name : undefined;
  const picture = typeof candidate.picture === 'string' ? candidate.picture : undefined;

  if (!sub || !email) return null;

  return { sub, email, name: name || undefined, picture: picture || undefined };
};

const applyTokenProfile = (token: JWT, profile: SanitizedGoogleProfile) => {
  if (profile.sub) token.id = profile.sub;
  if (profile.email) token.email = profile.email;
  if (profile.name) token.name = profile.name;
  if (profile.picture) token.picture = profile.picture;
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: { strategy: 'jwt' as const },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const googleProfile = toGoogleProfile(profile);
        if (googleProfile) {
          applyTokenProfile(token, googleProfile);
        }
      }

      const roleAwareToken = token as JWT & { role?: UserRole };
      const googleId = typeof token.id === 'string' ? token.id : undefined;
      if (googleId) {
        try {
          const user = await prisma.user.findUnique({
            where: { googleId },
            select: { role: true },
          });
          roleAwareToken.role =
            user?.role || (isSuperAdminEmail(token.email as string | undefined) ? 'SUPER_ADMIN' : 'USER');
        } catch (error) {
          console.error('JWT role fetch failed:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === 'string' ? token.id : session.user.id;
        session.user.email = typeof token.email === 'string' ? token.email : session.user.email ?? null;
        session.user.name = typeof token.name === 'string' ? token.name : session.user.name ?? null;
        session.user.image = typeof token.picture === 'string' ? token.picture : session.user.image ?? null;

        const roleAwareToken = token as JWT & { role?: UserRole };
        let role = roleAwareToken.role;
        if (!role && session.user.id) {
          try {
            const user = await prisma.user.findUnique({
              where: { googleId: session.user.id },
              select: { role: true },
            });
            role = user?.role || undefined;
          } catch (error) {
            console.error('Session role fetch failed:', error);
          }
        }

        if (!role && session.user.email) {
          role = isSuperAdminEmail(session.user.email) ? 'SUPER_ADMIN' : undefined;
        }

        const sessionUser = session.user as typeof session.user & { role?: UserRole; isAdmin?: boolean };
        sessionUser.role = role || 'USER';
        sessionUser.isAdmin = sessionUser.role === 'ADMIN' || sessionUser.role === 'SUPER_ADMIN';
      }
      return session;
    },
  },
  events: {
    async signIn({ profile }) {
      try {
        const googleProfile = toGoogleProfile(profile);
        if (!googleProfile?.sub) return;

        const { sub: googleId, email, name, picture: image } = googleProfile;
        const normalizedEmail = email?.toLowerCase() ?? null;
        const superAdmin = isSuperAdminEmail(normalizedEmail);

        const baseUpdate = {
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
          ...(name ? { name } : {}),
          ...(image ? { image } : {}),
          isActive: true,
          ...(superAdmin ? { role: 'SUPER_ADMIN' } : {}),
        };

        const existingByGoogleId = await prisma.user.findUnique({
          where: { googleId },
        });

        if (existingByGoogleId) {
          await prisma.user.update({
            where: { googleId },
            data: baseUpdate,
          });
        } else if (normalizedEmail) {
          const existingByEmail = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (existingByEmail) {
            await prisma.user.update({
              where: { email: normalizedEmail },
              data: {
                googleId,
                ...baseUpdate,
              },
            });
          } else {
            await prisma.user.create({
              data: {
                googleId,
                ...(normalizedEmail ? { email: normalizedEmail } : {}),
                ...(name ? { name } : {}),
                ...(image ? { image } : {}),
                role: superAdmin ? 'SUPER_ADMIN' : 'USER',
                isActive: true,
              },
            });
          }
        } else {
          await prisma.user.create({
            data: {
              googleId,
              ...(name ? { name } : {}),
              ...(image ? { image } : {}),
              role: superAdmin ? 'SUPER_ADMIN' : 'USER',
              isActive: true,
            },
          });
        }

        if (superAdmin && normalizedEmail) {
          await prisma.auditLog.create({
            data: {
              action: 'LOGIN_SUPER_ADMIN',
              tableName: 'User',
              newValues: { email: normalizedEmail, googleId },
              ipAddress: 'oauth-signin',
              userAgent: 'google-oauth',
            },
          }).catch(() => {});
        }
      } catch (error) {
        console.error('User upsert failed', error);
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
