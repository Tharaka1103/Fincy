"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Download,
  Trash,
  ArrowDownLeft,
  ArrowUpRight,
  DataTransferBoth,
  Spark,
  Repeat,
  Calendar,
  Label as TagIcon,
  CreditCard,
} from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  currency: string;
  date: Date | string;
  description: string | null;
  note: string | null;
  tags: string[];
  isRecurring: boolean;
  recurringInterval: string | null;
  isSplit: boolean;
  account: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
  toAccount?: {
    id: string;
    name: string;
    color: string;
  } | null;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
}

interface Account {
  id: string;
  name: string;
  color: string;
  type: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

interface TransactionsClientProps {
  initialTransactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currency: string;
}

export function TransactionsClient({
  initialTransactions,
  accounts,
  categories,
  currency,
}: TransactionsClientProps) {
  const [transactions, setTransactions] = React.useState<Transaction[]>(initialTransactions);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("ALL");
  const [selectedAccount, setSelectedAccount] = React.useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  // Modal State
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  // Form State
  const [formData, setFormData] = React.useState({
    type: "EXPENSE",
    amount: "",
    accountId: accounts[0]?.id || "",
    toAccountId: "",
    categoryId: categories[0]?.id || "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    note: "",
    isRecurring: false,
    recurringInterval: "MONTHLY",
  });

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.category?.name && t.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.account.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === "ALL" || t.type === selectedType;
      const matchesAccount = selectedAccount === "ALL" || t.accountId === selectedAccount || t.toAccountId === selectedAccount;
      const matchesCategory = selectedCategory === "ALL" || t.categoryId === selectedCategory;

      return matchesSearch && matchesType && matchesAccount && matchesCategory;
    });
  }, [transactions, searchQuery, selectedType, selectedAccount, selectedCategory]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.accountId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date).toISOString(),
          toAccountId: formData.type === "TRANSFER" ? formData.toAccountId : undefined,
          categoryId: formData.type === "TRANSFER" ? undefined : formData.categoryId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create transaction");
      }

      const newTx = await res.json();
      setTransactions((prev) => [newTx, ...prev]);
      setIsAddOpen(false);
      setFormData({
        type: "EXPENSE",
        amount: "",
        accountId: accounts[0]?.id || "",
        toAccountId: "",
        categoryId: categories[0]?.id || "",
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
        note: "",
        isRecurring: false,
        recurringInterval: "MONTHLY",
      });
    } catch (err: any) {
      alert(err.message || "Failed to create transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const res = await fetch(`/api/v1/transactions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete transaction");

      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/v1/transactions/export");
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert("Failed to export transactions CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Transactions
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track, filter, categorize, and export all your cash flow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="bg-card/50 backdrop-blur border-border/60 hover:bg-muted/40 cursor-pointer rounded-xl h-10 px-3.5 text-xs sm:text-sm"
          >
            {isExporting ? (
              <span className="w-4 h-4 mr-1.5 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <Download className="w-4 h-4 mr-1.5" strokeWidth={1.8} />
            )}
            Export CSV
          </Button>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 cursor-pointer rounded-xl h-10 px-4 text-xs sm:text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="bg-card/40 backdrop-blur-xl border-border/40 shadow-sm rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search description, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-input/60 rounded-xl h-10 text-xs sm:text-sm"
            />
          </div>

          {/* Type Filter */}
          <Select value={selectedType} onValueChange={(val) => setSelectedType(val ?? "ALL")}>
            <SelectTrigger className="bg-background/50 border-input/60 rounded-xl h-10 text-xs sm:text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="EXPENSE">Expenses</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="TRANSFER">Transfers</SelectItem>
            </SelectContent>
          </Select>

          {/* Account Filter */}
          <Select value={selectedAccount} onValueChange={(val) => setSelectedAccount(val ?? "ALL")}>
            <SelectTrigger className="bg-background/50 border-input/60 rounded-xl h-10 text-xs sm:text-sm">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Accounts</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val ?? "ALL")}>
            <SelectTrigger className="bg-background/50 border-input/60 rounded-xl h-10 text-xs sm:text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Transactions List */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 p-12 text-center rounded-2xl">
            <p className="text-sm text-muted-foreground">No transactions found matching your criteria.</p>
          </Card>
        ) : (
          filteredTransactions.map((tx) => (
            <Card
              key={tx.id}
              className="bg-card/40 hover:bg-card/70 transition-all duration-200 border-border/40 rounded-2xl shadow-sm overflow-hidden"
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                {/* Left icon & details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                    style={{
                      backgroundColor:
                        tx.type === "INCOME"
                          ? "rgba(16, 185, 129, 0.15)"
                          : tx.type === "TRANSFER"
                          ? "rgba(59, 130, 246, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                      color:
                        tx.type === "INCOME"
                          ? "rgb(16, 185, 129)"
                          : tx.type === "TRANSFER"
                          ? "rgb(59, 130, 246)"
                          : "rgb(239, 68, 68)",
                    }}
                  >
                    {tx.type === "INCOME" ? (
                      <ArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
                    ) : tx.type === "TRANSFER" ? (
                      <DataTransferBoth className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm sm:text-base text-foreground truncate">
                        {tx.description || tx.category?.name || "Untitled Transaction"}
                      </h4>
                      {tx.isRecurring && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                          <Repeat className="w-2.5 h-2.5 mr-0.5" strokeWidth={2} />
                          Recurring
                        </Badge>
                      )}
                      {tx.isSplit && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-500">
                          Split
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span>{format(new Date(tx.date), "MMM d, yyyy")}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" strokeWidth={1.8} />
                        {tx.account.name}
                        {tx.toAccount && ` → ${tx.toAccount.name}`}
                      </span>
                      {tx.category && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <TagIcon className="w-3 h-3" strokeWidth={1.8} />
                            {tx.category.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right amount and actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p
                      className={`font-semibold text-sm sm:text-base ${
                        tx.type === "INCOME"
                          ? "text-emerald-500"
                          : tx.type === "TRANSFER"
                          ? "text-blue-400"
                          : "text-foreground"
                      }`}
                    >
                      {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}
                      {currency}{" "}
                      {tx.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(tx.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                  >
                    <Trash className="w-4 h-4" strokeWidth={1.8} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border/40 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Spark className="w-5 h-5 text-primary" strokeWidth={2} />
              Add Transaction
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Record a new expense, income, or transfer.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-background/50 rounded-xl border border-input/40">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "EXPENSE" })}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  formData.type === "EXPENSE"
                    ? "bg-destructive text-destructive-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "INCOME" })}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  formData.type === "INCOME"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "TRANSFER" })}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  formData.type === "TRANSFER"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Transfer
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Amount ({currency})</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="text-lg font-bold bg-background/50 border-input/60 rounded-xl"
              />
            </div>

            {/* Accounts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  {formData.type === "TRANSFER" ? "From Account" : "Account"}
                </Label>
                <Select
                  value={formData.accountId}
                  onValueChange={(val) => setFormData({ ...formData, accountId: val ?? "" })}
                >
                  <SelectTrigger className="bg-background/50 border-input/60 rounded-xl text-xs">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "TRANSFER" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">To Account</Label>
                  <Select
                    value={formData.toAccountId}
                    onValueChange={(val) => setFormData({ ...formData, toAccountId: val ?? "" })}
                  >
                    <SelectTrigger className="bg-background/50 border-input/60 rounded-xl text-xs">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((acc) => acc.id !== formData.accountId)
                        .map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(val) => setFormData({ ...formData, categoryId: val ?? "" })}
                  >
                    <SelectTrigger className="bg-background/50 border-input/60 rounded-xl text-xs">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Date & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date</Label>
                <Input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="bg-background/50 border-input/60 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <Input
                  placeholder="e.g. Grocery store, Salary"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-background/50 border-input/60 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Note (Optional)</Label>
              <Textarea
                placeholder="Additional details..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="bg-background/50 border-input/60 rounded-xl text-xs resize-none h-16"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 rounded-xl text-xs font-medium cursor-pointer"
              >
                {isSubmitting ? <Spark className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Save Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
