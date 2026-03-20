import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const OAUTH_PASSWORD_PLACEHOLDER = "__OAUTH_NO_PASSWORD__";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        if (user.passwordHash === OAUTH_PASSWORD_PLACEHOLDER) return null;
        const hash = user.passwordHash.trim();
        const ok = await verifyPassword(String(credentials.password), hash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    // Google は .env.local に GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET があるとき有効
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub ?? token.id) as string;
        session.user.email = (token.email as string) ?? session.user.email ?? null;
        session.user.name = (token.name as string) ?? session.user.name ?? null;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        await prisma.user.upsert({
          where: { email: user.email },
          create: {
            name: (user.name as string) ?? user.email.split("@")[0],
            email: user.email,
            passwordHash: OAUTH_PASSWORD_PLACEHOLDER,
          },
          update: {},
        });
      }
      return true;
    },
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      // ログイン・サインアップ・招待・トップは認証不要
      if (
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/invite") ||
        pathname === "/"
      )
        return true;
      return !!auth;
    },
  },
  trustHost: true,
});
