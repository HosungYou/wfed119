import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

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
      // On first sign in, attach Google sub/email to JWT
      if (account && profile) {
        const googleSub = (profile as any).sub as string | undefined;
        const email = (profile as any).email as string | undefined;
        if (googleSub) token.id = googleSub;
        if (email) token.email = email;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose Google sub as session.user.id
      if (session.user) {
        (session.user as any).id = (token as any).id;
        session.user.email = token.email as string | undefined;
      }
      return session;
    },
  },
  events: {
    async signIn({ profile }) {
      try {
        const googleId = (profile as any)?.sub as string | undefined;
        const email = (profile as any)?.email as string | undefined;
        const name = (profile as any)?.name as string | undefined;
        const image = (profile as any)?.picture as string | undefined;
        if (!googleId) return;
        await prisma.user.upsert({
          where: { googleId },
          update: { email, name, image },
          create: { googleId, email, name, image },
        });
      } catch (e) {
        console.error('User upsert failed', e);
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
