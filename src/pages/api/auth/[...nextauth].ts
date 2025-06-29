import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow specific emails or domains for admin
      const allowedEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
      if (allowedEmails.length === 0) return false;
      return allowedEmails.includes(user.email?.toLowerCase() || "");
    },
    async session({ session, token, user }) {
      // Add email to session for client-side checks
      return session;
    },
  },
};

export default NextAuth(authOptions);
