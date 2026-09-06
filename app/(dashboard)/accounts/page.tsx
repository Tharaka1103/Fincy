import * as React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { AccountsClient } from "./client";

export const metadata: Metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const accounts = await prisma.financialAccount.findMany({
    where: { userId, isArchived: false },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <AccountsClient
      initialAccounts={accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Number(a.balance),
        currency: a.currency,
        color: a.color,
        icon: a.icon,
        isDefault: a.isDefault,
        description: a.description,
      }))}
      userCurrency={session!.user.currency ?? "USD"}
    />
  );
}
