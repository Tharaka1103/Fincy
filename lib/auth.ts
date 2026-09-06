import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        deviceId: { label: "Device ID", type: "text" },
        forceLogout: { label: "Force Logout", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          currency: user.currency,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.type === "oauth" && user?.id) {
        const activeSession = await prisma.session.findFirst({
          where: { userId: user.id, isActive: true },
        });

        if (activeSession) {
          return `/login?error=ActiveSession`;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.currency = (user as any).currency || "USD";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.currency = (token.currency as string) || "USD";
      }
      return session;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser && user.email && user.name) {
        // Send welcome email for new registrations
        try {
          const { sendWelcomeEmail } = await import("@/lib/email");
          await sendWelcomeEmail(user.email, user.name);
        } catch {
          // Non-blocking
        }
        // Create default bottom nav config
        if (user.id) {
          await prisma.bottomNavConfig.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              items: [
                { id: "accounts", label: "Accounts", icon: "wallet", href: "/accounts", enabled: true },
                { id: "transactions", label: "Transactions", icon: "arrow-left-right", href: "/transactions", enabled: true },
                { id: "dashboard", label: "Home", icon: "home", href: "/dashboard", enabled: true },
                { id: "analytics", label: "Analytics", icon: "bar-chart-2", href: "/analytics", enabled: true },
                { id: "settings", label: "Settings", icon: "settings", href: "/settings", enabled: true },
              ],
            },
            update: {},
          });
        }
      }

      await writeAuditLog({
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        metadata: { email: user.email, isNewUser: isNewUser ?? false },
      });
    },
    async signOut(message: any) {
      const userId = message?.session?.userId ?? message?.token?.sub;
      if (userId) {
        // Mark the session as inactive
        const sessionToken = message?.session?.sessionToken;
        if (sessionToken) {
          await prisma.session.updateMany({
            where: { userId, sessionToken },
            data: { isActive: false },
          });
        }
        await writeAuditLog({
          userId,
          action: "LOGOUT",
          entity: "User",
          entityId: userId,
        });
      }
    },
  },
});

// Extend session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      currency?: string;
    };
  }
}
