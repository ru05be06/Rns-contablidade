import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email.toLowerCase().trim(),
            active: true,
            deletedAt: null,
          },
          include: { role: true, organization: true },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl ?? undefined,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
          roleId: user.roleId,
          roleKey: user.role.key,
          roleName: user.role.name,
          permissions: user.role.permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.roleId = user.roleId;
        token.roleKey = user.roleKey;
        token.roleName = user.roleName;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName as string;
        session.user.roleId = token.roleId as string;
        session.user.roleKey = token.roleKey as string;
        session.user.roleName = token.roleName as string;
        session.user.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
