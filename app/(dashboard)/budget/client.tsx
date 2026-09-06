"use client";

import * as React from "react";
import {
  Plus,
  PiggyBank,
  WarningTriangle,
  CheckCircle,
  Trash,
  Spark,
  GraphUp,
  PercentageCircle,
} from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  period: string;
  alertAt: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface BudgetClientProps {
  initialBudgets: Budget[];
  categories: Category[];
  currency: string;
}

export function BudgetClient({
  initialBudgets,
  categories,
  currency,
}: BudgetClientProps) {
  const [budgets, setBudgets] = React.useState<Budget[]>(initialBudgets);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: "",
    categoryId: categories[0]?.id || "",
    amount: "",
    period: "MONTHLY",
    alertAt: "80",
  });

  const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const remaining = Math.max(0, totalBudget - totalSpent);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.categoryId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          categoryId: formData.categoryId,
          amount: parseFloat(formData.amount),
          period: formData.period,
          alertAt: parseInt(formData.alertAt, 10),
          startDate: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create budget");
      }

      const newBudget = await res.json();
      setBudgets((prev) => [
        {
          ...newBudget,
          amount: Number(newBudget.amount),
          spent: 0,
        },
        ...prev,
      ]);
      setIsAddOpen(false);
      setFormData({
        name: "",
        categoryId: categories[0]?.id || "",
        amount: "",
        period: "MONTHLY",
        alertAt: "80",
      });
    } catch (err: any) {
      alert(err.message || "Failed to create budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;

    try {
      const res = await fetch(`/api/v1/budgets?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete budget");

      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Budgets
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Keep your category spending in check with monthly limits and alert thresholds.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 cursor-pointer rounded-xl h-10 px-4 text-xs sm:text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Budget
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Budget Pool</p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                {currency}{" "}
                {totalBudget.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <PiggyBank className="w-5 h-5" strokeWidth={1.8} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Spent (This Month)</p>
              <h3 className="text-xl sm:text-2xl font-bold text-destructive mt-1">
                {currency}{" "}
                {totalSpent.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <PercentageCircle className="w-5 h-5" strokeWidth={1.8} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Remaining Safe Pool</p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-500 mt-1">
                {currency}{" "}
                {remaining.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" strokeWidth={1.8} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-card/40 backdrop-blur-xl border-border/40 p-12 text-center rounded-2xl">
              <PiggyBank className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1.8} />
              <p className="text-sm font-medium text-foreground">No budgets set yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first budget to start controlling your monthly expenses.
              </p>
            </Card>
          </div>
        ) : (
          budgets.map((b) => {
            const percentage = Math.min(100, Math.round((b.spent / b.amount) * 100));
            const isNearLimit = percentage >= b.alertAt && percentage < 100;
            const isExceeded = percentage >= 100;

            return (
              <Card
                key={b.id}
                className="bg-card/40 hover:bg-card/60 transition-all duration-200 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: b.category.color }}
                      />
                      <CardTitle className="text-base font-semibold text-foreground">
                        {b.name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(b.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" strokeWidth={1.8} />
                    </Button>
                  </div>
                  <CardDescription className="text-xs flex items-center gap-1.5 mt-1">
                    <span>{b.category.name}</span>
                    <span>•</span>
                    <span className="capitalize">{b.period.toLowerCase()}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-sm text-foreground">
                      {currency}{" "}
                      {b.spent.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-muted-foreground">
                      of {currency}{" "}
                      {b.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <Progress
                    value={percentage}
                    className={`h-2.5 rounded-full ${
                      isExceeded
                        ? "[&>div]:bg-destructive"
                        : isNearLimit
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-primary"
                    }`}
                  />

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-muted-foreground">{percentage}% used</span>
                    {isExceeded ? (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                        <WarningTriangle className="w-2.5 h-2.5 mr-0.5" strokeWidth={2} /> Over Budget
                      </Badge>
                    ) : isNearLimit ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/40 text-amber-500">
                        <WarningTriangle className="w-2.5 h-2.5 mr-0.5" strokeWidth={2} /> Near Limit ({b.alertAt}%)
                      </Badge>
                    ) : (
                      <span className="text-emerald-500 font-medium">On Track</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Budget Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border/40 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Spark className="w-5 h-5 text-primary" strokeWidth={2} />
              Create Budget Limit
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a cap for a specific category to prevent overspending.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Budget Name</Label>
              <Input
                placeholder="e.g. Dining Out Budget"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background/50 border-input/60 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Monthly Limit ({currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="500.00"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="bg-background/50 border-input/60 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Period</Label>
                <Select
                  value={formData.period}
                  onValueChange={(val) => setFormData({ ...formData, period: val ?? "MONTHLY" })}
                >
                  <SelectTrigger className="bg-background/50 border-input/60 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Alert Threshold (%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.alertAt}
                  onChange={(e) => setFormData({ ...formData, alertAt: e.target.value })}
                  className="bg-background/50 border-input/60 rounded-xl text-xs"
                />
              </div>
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
                Save Budget
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
