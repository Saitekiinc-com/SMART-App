import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      authorize: async (credentials) => {
        // TODO: Prisma でユーザー取得・パスワード検証に差し替える
        if (!credentials?.email || !credentials?.password) return null;
        return null; // 現状は常に失敗（DB 実装後に有効化）
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
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      // ログイン・招待・トップは認証不要
      if (pathname.startsWith("/login") || pathname.startsWith("/invite") || pathname === "/")
        return true;
      return !!auth;
    },
  },
  trustHost: true,
});
