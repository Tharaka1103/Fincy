import * as React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { ReportsClient } from "./client";

export const metadata: Metadata = {
  title: "Reports | FINCY",
  description: "Generate and export detailed financial reports and statements.",
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [accounts, categories, transactionCount] = await Promise.all([
    prisma.financialAccount.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: {
        OR: [{ userId: session.user.id }, { isSystem: true }],
      },
      select: { id: true, name: true },
    }),
    prisma.transaction.count({
      where: { userId: session.user.id },
    }),
  ]);

  return (
    <ReportsClient
      accounts={accounts}
      categories={categories}
      transactionCount={transactionCount}
      currency={session.user.currency || "USD"}
    />
  );
}
