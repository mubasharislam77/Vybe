import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type {} from 'next-auth/jwt';
import { verifyPassword } from '@/lib/auth/password';
import { findCustomerByIdentifier } from '@/lib/repositories/customers.repo';
import { findStaffByEmail } from '@/lib/repositories/staff.repo';

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/account/login',
  },
  providers: [
    Credentials({
      id: 'customer',
      name: 'Customer',
      credentials: {
        identifier: { label: 'Phone or email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const identifier = raw?.identifier;
        const password = raw?.password;
        if (typeof identifier !== 'string' || typeof password !== 'string') return null;
        const customer = await findCustomerByIdentifier(identifier);
        if (!customer) return null;
        const ok = await verifyPassword(password, customer.passwordHash);
        if (!ok) return null;
        return {
          id: customer._id.toString(),
          role: 'customer' as const,
          name: customer.fullName,
          email: customer.email ?? null,
        };
      },
    }),
    Credentials({
      id: 'staff',
      name: 'Staff',
      credentials: {
        email: { label: 'Email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const email = raw?.email;
        const password = raw?.password;
        if (typeof email !== 'string' || typeof password !== 'string') return null;
        const staff = await findStaffByEmail(email);
        if (!staff) return null;
        const ok = await verifyPassword(password, staff.passwordHash);
        if (!ok) return null;
        return {
          id: staff._id.toString(),
          role: staff.role,
          name: staff.fullName,
          email: staff.email,
        };
      },
    }),
  ],
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
});
