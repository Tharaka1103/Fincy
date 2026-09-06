import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, isPast, isToday, format, parseISO } from "date-fns";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "REMINDER" | "OVERDUE" | "BUDGET_WARNING" | "BUDGET_EXCEEDED" | "INFO";
  link: string;
  isActionable: boolean;
}

// GET /api/v1/notifications
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const notifications: NotificationItem[] = [];

  try {
    // 1. Fetch active reminders
    const reminders = await prisma.reminder.findMany({
      where: { userId, isDone: false },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    for (const r of reminders) {
      const isOverdue = isPast(r.dueDate) && !isToday(r.dueDate);
      const isDueToday = isToday(r.dueDate);

      notifications.push({
        id: `reminder-${r.id}`,
        title: isOverdue ? `Overdue: ${r.title}` : isDueToday ? `Due Today: ${r.title}` : r.title,
        description: r.amount
          ? `Amount: ${r.amount.toFixed(2)} • Due ${format(r.dueDate, "MMM d, yyyy")}`
          : `Due ${format(r.dueDate, "MMM d, yyyy")}`,
        time: format(r.dueDate, "MMM d"),
        type: isOverdue ? "OVERDUE" : "REMINDER",
        link: "/reminders",
        isActionable: true,
      });
    }

    // 2. Fetch active budgets and calculate usage
    const budgets = await prisma.budget.findMany({
      where: { userId, isActive: true },
      include: { category: true },
    });

    for (const b of budgets) {
      const agg = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId,
          categoryId: b.categoryId,
          type: "EXPENSE",
          date: { gte: b.startDate, lte: b.endDate ?? monthEnd },
        },
      });

      const spent = Number(agg._sum.amount ?? 0);
      const target = Number(b.amount);
      if (target > 0) {
        const percentage = Math.round((spent / target) * 100);
        if (percentage >= 100) {
          notifications.push({
            id: `budget-${b.id}`,
            title: `Budget Exceeded: ${b.name}`,
            description: `You have spent ${percentage}% of your ${b.category.name} budget (${spent.toFixed(2)} / ${target.toFixed(2)})`,
            time: "This month",
            type: "BUDGET_EXCEEDED",
            link: "/budget",
            isActionable: false,
          });
        } else if (percentage >= b.alertAt) {
          notifications.push({
            id: `budget-${b.id}`,
            title: `Budget Warning: ${b.name}`,
            description: `You have reached ${percentage}% of your ${b.category.name} budget limit`,
            time: "This month",
            type: "BUDGET_WARNING",
            link: "/budget",
            isActionable: false,
          });
        }
      }
    }

    return NextResponse.json({
      notifications,
      unreadCount: notifications.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch notifications" }, { status: 500 });
  }
}
