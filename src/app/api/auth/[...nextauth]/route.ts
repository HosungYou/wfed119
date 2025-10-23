import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider, { type GoogleProfile } from 'next-auth/providers/google';
import type { JWT } from 'next-auth/jwt';

type SanitizedGoogleProfile = Pick<GoogleProfile, 'sub' | 'email' | 'name' | 'picture'>;

const toGoogleProfile = (profile: unknown): SanitizedGoogleProfile | null => {
  if (!profile || typeof profile !== 'object') return null;
  const candidate = profile as Partial<GoogleProfile>;
  return {
    sub: typeof candidate.sub === 'string' ? candidate.sub : undefined,
    email: typeof candidate.email === 'string' ? candidate.email : undefined,
    name: typeof candidate.name === 'string' ? candidate.name : undefined,
    picture: typeof candidate.picture === 'string' ? candidate.picture : undefined,
  };
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
  // Note: User management is handled by Supabase auth.users table
  // NextAuth is only used for Google OAuth session management
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
