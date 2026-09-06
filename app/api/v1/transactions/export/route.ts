import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog, getIpFromRequest, getUserAgent } from "@/lib/audit";

// GET /api/v1/transactions/export
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = { userId: session.user.id, parentId: null };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: { select: { name: true } },
      account: { select: { name: true } },
      toAccount: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  // Build CSV
  const headers = [
    "Date",
    "Type",
    "Description",
    "Amount",
    "Currency",
    "Category",
    "Account",
    "To Account",
    "Recurring",
    "Tags",
    "Note",
  ];

  const rows = transactions.map((tx) => [
    new Date(tx.date).toISOString().split("T")[0],
    tx.type,
    tx.description ?? "",
    tx.amount.toString(),
    tx.currency,
    tx.category?.name ?? "",
    tx.account.name,
    tx.toAccount?.name ?? "",
    tx.isRecurring ? "Yes" : "No",
    tx.tags.join("; "),
    tx.note ?? "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  // Audit log
  await writeAuditLog({
    userId: session.user.id,
    action: "CSV_EXPORT",
    entity: "Transaction",
    metadata: { from, to, count: transactions.length },
    ipAddress: getIpFromRequest(request),
    userAgent: getUserAgent(request),
  });

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="fincy-transactions-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
