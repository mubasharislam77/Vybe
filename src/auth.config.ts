import type { NextAuthConfig } from 'next-auth';
import type {} from 'next-auth/jwt';

export type SessionRole = 'customer' | 'admin' | 'staff';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: SessionRole;
      name: string;
      email?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: SessionRole;
  }
}

/**
 * Edge-safe half of the Auth.js config: everything EXCEPT the Credentials
 * providers, whose `authorize` functions pull in bcrypt + the MongoDB
 * driver (Node-only APIs). `middleware.ts` builds its own NextAuth
 * instance from just this — it only needs to verify/decode the JWT cookie
 * — while `auth.ts` spreads it and adds the providers for the Node runtime.
 */
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/account/login',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: SessionRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
