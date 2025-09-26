import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider, { type GoogleProfile } from 'next-auth/providers/google';
import type { JWT } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

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
  const email = typeof candidate.email === 'string' ? candidate.email : undefined;
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
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === 'string' ? token.id : session.user.id;
        session.user.email = typeof token.email === 'string' ? token.email : session.user.email ?? null;
        session.user.name = typeof token.name === 'string' ? token.name : session.user.name ?? null;
        session.user.image = typeof token.picture === 'string' ? token.picture : session.user.image ?? null;
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

        // Determine user role based on email
        const superAdminEmails = [
          'newhosung@gmail.com',
          'tvs5971@psu.edu',
          // 여기에 추가 SUPER_ADMIN 이메일 추가
          // 'collaborator@example.com',
        ];

        let role = 'USER';
        if (superAdminEmails.includes(email)) {
          role = 'SUPER_ADMIN';
        }

        await prisma.user.upsert({
          where: { googleId },
          update: {
            email,
            name,
            image,
            // Update role if user is SUPER_ADMIN
            ...(role === 'SUPER_ADMIN' ? { role: 'SUPER_ADMIN' } : {})
          },
          create: {
            googleId,
            email,
            name,
            image,
            role: role as any // Cast to handle role enum
          },
        });

        // Log admin access
        if (role === 'SUPER_ADMIN') {
          await prisma.auditLog.create({
            data: {
              action: 'LOGIN_SUPER_ADMIN',
              tableName: 'User',
              newValues: { email, googleId },
              ipAddress: 'oauth-signin',
              userAgent: 'google-oauth'
            }
          }).catch(() => {}); // Ignore if AuditLog table doesn't exist yet
        }

      } catch (e) {
        console.error('User upsert failed', e);
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
