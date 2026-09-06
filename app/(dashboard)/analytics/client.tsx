"use client";

import * as React from "react";
import { format, parseISO, startOfMonth, isSameMonth } from "date-fns";
import {
  PercentageCircle,
  StatsUpSquare,
  GraphUp,
  GraphDown,
  Spark,
  List,
} from "iconoir-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SerializedTx {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  date: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface AnalyticsClientProps {
  transactions: SerializedTx[];
  categories: Category[];
  currency: string;
}

export function AnalyticsClient({
  transactions,
  categories,
  currency,
}: AnalyticsClientProps) {
  // Monthly Trends calculation
  const monthlyData = React.useMemo(() => {
    const monthsMap: Record<string, { month: string; income: number; expense: number; net: number }> = {};

    // Group last 6 months
    transactions.forEach((tx) => {
      const monthKey = format(parseISO(tx.date), "MMM yyyy");
      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = { month: monthKey, income: 0, expense: 0, net: 0 };
      }

      if (tx.type === "INCOME") {
        monthsMap[monthKey].income += tx.amount;
        monthsMap[monthKey].net += tx.amount;
      } else if (tx.type === "EXPENSE") {
        monthsMap[monthKey].expense += tx.amount;
        monthsMap[monthKey].net -= tx.amount;
      }
    });

    return Object.values(monthsMap);
  }, [transactions]);

  // Spending by Category calculation
  const categoryData = React.useMemo(() => {
    const catMap: Record<string, { name: string; value: number; color: string }> = {};

    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((tx) => {
        const catName = tx.categoryName;
        if (!catMap[catName]) {
          catMap[catName] = {
            name: catName,
            value: 0,
            color: tx.categoryColor || "#6366f1",
          };
        }
        catMap[catName].value += tx.amount;
      });

    return Object.values(catMap).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalExpense = categoryData.reduce((acc, curr) => acc + curr.value, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Financial Analytics
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Visual insights into your income, expenses, and wealth accumulation over time.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Inflow (6 Mo)</p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-500 mt-1">
                {currency} {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <GraphUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Outflow (6 Mo)</p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                {currency} {totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <GraphDown className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Average Savings Rate</p>
              <h3 className="text-xl sm:text-2xl font-bold text-primary mt-1">
                {savingsRate.toFixed(1)}%
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Spark className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <StatsUpSquare className="w-4 h-4 text-primary" />
              Income vs Expenses
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Comparison of cash inflows and outflows by month
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(20, 20, 25, 0.85)",
                      backdropFilter: "blur(12px)",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown Donut */}
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <PercentageCircle className="w-4 h-4 text-primary" />
              Expenses by Category
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Proportional distribution of total expenses
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px] w-full flex items-center justify-center">
              {categoryData.length === 0 ? (
                <p className="text-xs text-muted-foreground">No expense data available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [
                        `${currency} ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                        "Spent",
                      ]}
                      contentStyle={{
                        backgroundColor: "rgba(20, 20, 25, 0.85)",
                        backdropFilter: "blur(12px)",
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories Ranking Table */}
      <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <List className="w-4 h-4 text-primary" />
            Top Spending Categories
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Ranked breakdown of where your money goes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryData.slice(0, 5).map((cat, idx) => {
              const percentage = totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                    <span className="text-muted-foreground">
                      {currency}{" "}
                      {cat.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
