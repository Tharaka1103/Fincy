import * as React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { TransactionsClient } from "./client";

export const metadata: Metadata = {
  title: "Transactions | FINCY",
  description: "View, filter, manage and export your financial transactions.",
};

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [transactions, accounts, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      include: {
        account: true,
        toAccount: true,
        category: true,
      },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.financialAccount.findMany({
      where: { userId: session.user.id, isArchived: false },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    prisma.category.findMany({
      where: {
        OR: [{ userId: session.user.id }, { isSystem: true }],
        isArchived: false,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedTransactions = transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
    exchangeRate: t.exchangeRate ? Number(t.exchangeRate) : null,
    account: {
      ...t.account,
      balance: Number(t.account.balance),
    },
    toAccount: t.toAccount
      ? {
          ...t.toAccount,
          balance: Number(t.toAccount.balance),
        }
      : null,
  }));

  const serializedAccounts = accounts.map((a) => ({
    ...a,
    balance: Number(a.balance),
  }));

  return (
    <TransactionsClient
      initialTransactions={serializedTransactions}
      accounts={serializedAccounts}
      categories={categories}
      currency={session.user.currency || "USD"}
    />
  );
}
