"use client";

import * as React from "react";
import Link from "next/link";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import {
  Eye,
  EyeClosed,
  GraphUp,
  GraphDown,
  NavArrowRight,
  BellNotification,
  Wallet,
  DataTransferBoth,
  WarningTriangle,
  Building,
  CreditCard,
  PiggyBank,
  DollarCircle,
} from "iconoir-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number | string; style?: React.CSSProperties }>;

const ACCOUNT_ICONS: Record<string, IconComponent> = {
  "building-2": Building,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  wallet: Wallet,
  "trending-up": GraphUp,
  "dollar-sign": DollarCircle,
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface DashboardClientProps {
  user: { name: string; currency: string };
  accounts: Array<{
    id: string; name: string; type: string; balance: number;
    currency: string; color: string; icon: string; isDefault: boolean;
  }>;
  summary: {
    totalBalance: number; income: number; expense: number; net: number;
    expenseChange: number; month: string;
  };
  recentTransactions: Array<{
    id: string; type: string; amount: number; currency: string;
    description: string; date: string;
    category: { name: string; icon: string; color: string } | null;
    accountName: string;
  }>;
  upcomingReminders: Array<{
    id: string; title: string; dueDate: string; amount: number | null;
  }>;
  budgets: Array<{
    id: string; name: string; amount: number; spent: number;
    percentage: number; alertAt: number;
    category: { name: string; icon: string; color: string };
  }>;
}

export function DashboardClient({
  user, accounts, summary, recentTransactions, upcomingReminders, budgets,
}: DashboardClientProps) {
  const [balanceVisible, setBalanceVisible] = React.useState(false);

  const formatted = balanceVisible
    ? formatCurrency(summary.totalBalance, user.currency)
    : "••••••";

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  function formatDueDate(dateStr: string) {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-heading font-bold">
          {getGreeting()}, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">{summary.month}</p>
      </div>

      {/* Balance Hero Card */}
      <div className="glass-card rounded-3xl p-6 animate-fade-in-up delay-100 relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
          style={{ background: "var(--primary)" }}
          aria-hidden="true"
        />
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={cn(
                  "text-4xl font-heading font-black transition-all duration-300",
                  balanceVisible ? "gradient-text" : "text-muted-foreground"
                )}
              >
                {formatted}
              </span>
              <button
                id="toggle-balance-visibility"
                onClick={() => setBalanceVisible((v) => !v)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-xl hover:bg-muted/30 cursor-pointer"
                aria-label={balanceVisible ? "Hide balance" : "Show balance"}
              >
                {balanceVisible ? (
                  <EyeClosed className="h-5 w-5" strokeWidth={2} />
                ) : (
                  <Eye className="h-5 w-5" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{accounts.length} accounts</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            {
              label: "Income",
              value: summary.income,
              icon: GraphUp,
              color: "text-emerald-400",
              bg: "bg-emerald-400/10",
            },
            {
              label: "Expenses",
              value: summary.expense,
              icon: GraphDown,
              color: "text-rose-400",
              bg: "bg-rose-400/10",
            },
            {
              label: "Net",
              value: summary.net,
              icon: summary.net >= 0 ? GraphUp : GraphDown,
              color: summary.net >= 0 ? "text-blue-400" : "text-amber-400",
              bg: summary.net >= 0 ? "bg-blue-400/10" : "bg-amber-400/10",
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={cn("glass-subtle rounded-2xl p-3 animate-fade-in-up", `delay-${(i + 2) * 100}`)}
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-2", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} strokeWidth={2} />
              </div>
              <p className="text-[10px] text-muted-foreground mb-0.5">{stat.label}</p>
              <p className={cn("text-sm font-bold", stat.color)}>
                {balanceVisible
                  ? formatCurrency(Math.abs(stat.value), user.currency)
                  : "••••"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Accounts row */}
      <div className="animate-fade-in-up delay-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-base">Your Accounts</h2>
          <Link
            href="/accounts"
            prefetch={true}
            id="view-all-accounts"
            className="text-xs text-primary flex items-center gap-1 hover:gap-2 transition-all cursor-pointer font-medium"
          >
            View all <NavArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {accounts.map((account, i) => {
            const Icon = ACCOUNT_ICONS[account.icon] ?? Wallet;
            return (
              <Link
                key={account.id}
                href="/accounts"
                prefetch={true}
                id={`account-card-${account.id}`}
                className={cn(
                  "glass-subtle rounded-2xl p-4 min-w-[140px] flex-shrink-0 cursor-pointer",
                  "hover:border-primary/40 transition-all duration-200 hover:-translate-y-0.5",
                  `animate-fade-in-up delay-${(i + 3) * 100}`
                )}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${account.color}20` }}
                >
                  <Icon className="h-4 w-4" style={{ color: account.color }} strokeWidth={1.8} />
                </div>
                <p className="text-xs text-muted-foreground truncate mb-0.5">{account.name}</p>
                <p className="text-sm font-bold">
                  {balanceVisible
                    ? formatCurrency(account.balance, account.currency)
                    : "••••"}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Budget overview */}
      {budgets.length > 0 && (
        <div className="animate-fade-in-up delay-300">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-base">Budget Overview</h2>
            <Link
              href="/budget"
              prefetch={true}
              id="view-all-budgets"
              className="text-xs text-primary flex items-center gap-1 hover:gap-2 transition-all cursor-pointer font-medium"
            >
              View all <NavArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {budgets.map((budget, i) => (
              <div
                key={budget.id}
                className={cn(
                  "glass-card rounded-2xl p-4",
                  `animate-fade-in-up delay-${(i + 4) * 100}`,
                  budget.percentage >= budget.alertAt && "border-amber-400/30"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: `${budget.category.color}20` }}
                    >
                      <span style={{ color: budget.category.color }}>
                        {budget.category.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-medium truncate max-w-[100px]">
                      {budget.category.name}
                    </span>
                  </div>
                  {budget.percentage >= budget.alertAt && (
                    <WarningTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" strokeWidth={2} />
                  )}
                </div>
                <Progress
                  value={budget.percentage}
                  className="h-1.5 mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(budget.spent, user.currency)} spent</span>
                  <span className={budget.percentage >= 100 ? "text-destructive font-medium" : ""}>
                    {budget.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="animate-fade-in-up delay-300">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-base">Recent Transactions</h2>
            <Link
              href="/transactions"
              prefetch={true}
              id="view-all-transactions"
              className="text-xs text-primary flex items-center gap-1 hover:gap-2 transition-all cursor-pointer font-medium"
            >
              View all <NavArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No transactions yet.{" "}
                <Link href="/transactions" prefetch={true} className="text-primary font-medium hover:underline">
                  Add one
                </Link>
              </div>
            ) : (
              <div>
                {recentTransactions.map((tx, i) => (
                  <React.Fragment key={tx.id}>
                    {i > 0 && <Separator className="bg-border/30" />}
                    <div className="flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                      {/* Icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{
                          background: tx.category
                            ? `${tx.category.color}20`
                            : "var(--muted)",
                          color: tx.category?.color ?? "var(--muted-foreground)",
                        }}
                      >
                        {tx.category?.name.charAt(0) ?? "?"}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.description || tx.category?.name || "Transaction"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.date), "MMM d")} · {tx.accountName}
                        </p>
                      </div>
                      {/* Amount */}
                      <span
                        className={cn(
                          "text-sm font-bold flex-shrink-0",
                          tx.type === "INCOME" ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="animate-fade-in-up delay-400">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-base">Upcoming Reminders</h2>
            <Link
              href="/reminders"
              prefetch={true}
              id="view-all-reminders"
              className="text-xs text-primary flex items-center gap-1 hover:gap-2 transition-all cursor-pointer font-medium"
            >
              View all <NavArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            {upcomingReminders.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                No upcoming reminders.{" "}
                <Link href="/reminders" prefetch={true} className="text-primary font-medium hover:underline">
                  Add one
                </Link>
              </div>
            ) : (
              <div>
                {upcomingReminders.map((reminder, i) => {
                  const dateLabel = formatDueDate(reminder.dueDate);
                  const isUrgent = isToday(new Date(reminder.dueDate));
                  return (
                    <React.Fragment key={reminder.id}>
                      {i > 0 && <Separator className="bg-border/30" />}
                      <div className="flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                            isUrgent ? "bg-amber-400/20" : "bg-primary/10"
                          )}
                        >
                          <BellNotification
                            className={cn("h-4 w-4", isUrgent ? "text-amber-400" : "text-primary")}
                            strokeWidth={2}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{reminder.title}</p>
                          {reminder.amount && (
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(reminder.amount, user.currency)}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={isUrgent ? "destructive" : "secondary"}
                          className="text-[10px] flex-shrink-0"
                        >
                          {dateLabel}
                        </Badge>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
