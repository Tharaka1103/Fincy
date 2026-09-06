import * as React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch user's bottom nav config
  const navConfig = await prisma.bottomNavConfig.findUnique({
    where: { userId: session.user.id },
  });

  const navItems = navConfig?.items as any[] | undefined;

  return (
    <div className="min-h-screen flex flex-col mesh-bg">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 md:px-6 pb-24 md:pb-6 max-w-7xl">
        {children}
      </main>
      <BottomNav items={navItems} />
    </div>
  );
}
