"use client";

import * as React from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  Plus,
  Trophy,
  Calendar,
  Spark,
  Trash,
  DollarCircle,
  ArrowUpRight,
  CheckCircle,
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
import { Textarea } from "@/components/ui/textarea";

interface Goal {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: string | null;
  icon: string;
  color: string;
  status: "ACTIVE" | "COMPLETED" | "PAUSED" | "ABANDONED";
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface GoalsClientProps {
  initialGoals: Goal[];
  accounts: Account[];
  currency: string;
}

const PRESET_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
];

export function GoalsClient({
  initialGoals,
  accounts,
  currency,
}: GoalsClientProps) {
  const [goals, setGoals] = React.useState<Goal[]>(initialGoals);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isDepositOpen, setIsDepositOpen] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Add Goal Form
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    targetAmount: "",
    currentAmount: "0",
    deadline: "",
    color: PRESET_COLORS[0],
  });

  // Deposit Form
  const [depositData, setDepositData] = React.useState({
    amount: "",
    accountId: accounts[0]?.id || "",
  });

  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.currentAmount || "0"),
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
          color: formData.color,
          currency,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create goal");
      }

      const newGoal = await res.json();
      setGoals((prev) => [
        {
          ...newGoal,
          targetAmount: Number(newGoal.targetAmount),
          currentAmount: Number(newGoal.currentAmount),
        },
        ...prev,
      ]);
      setIsAddOpen(false);
      setFormData({
        name: "",
        description: "",
        targetAmount: "",
        currentAmount: "0",
        deadline: "",
        color: PRESET_COLORS[0],
      });
    } catch (err: any) {
      alert(err.message || "Failed to create goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !depositData.amount) return;

    setIsSubmitting(true);
    try {
      const depositAmount = parseFloat(depositData.amount);
      const res = await fetch(`/api/v1/goals/${selectedGoal.id}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: depositAmount,
          accountId: depositData.accountId || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to contribute to goal");
      }

      const updated = await res.json();
      setGoals((prev) =>
        prev.map((g) =>
          g.id === selectedGoal.id
            ? {
                ...g,
                currentAmount: Number(updated.currentAmount),
                status: updated.status,
              }
            : g
        )
      );
      setIsDepositOpen(false);
      setSelectedGoal(null);
      setDepositData({ amount: "", accountId: accounts[0]?.id || "" });
    } catch (err: any) {
      alert(err.message || "Deposit failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const res = await fetch(`/api/v1/goals?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete goal");

      setGoals((prev) => prev.filter((g) => g.id !== id));
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
            Savings Goals
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Build your dream fund, emergency reserve, or save up for big milestones.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 cursor-pointer rounded-xl h-10 px-4 text-xs sm:text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Goal
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Target Value</p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                {currency}{" "}
                {totalTarget.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Accumulated Savings</p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-500 mt-1">
                {currency}{" "}
                {totalSaved.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Overall Progress</p>
              <h3 className="text-xl sm:text-2xl font-bold text-primary mt-1">
                {overallProgress}%
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Spark className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-card/40 backdrop-blur-xl border-border/40 p-12 text-center rounded-2xl">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No savings goals created yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start by setting a target for a vacation, car, or emergency fund!
              </p>
            </Card>
          </div>
        ) : (
          goals.map((g) => {
            const percentage = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            const isCompleted = percentage >= 100;
            const daysLeft = g.deadline ? differenceInDays(parseISO(g.deadline), new Date()) : null;

            return (
              <Card
                key={g.id}
                className="bg-card/40 hover:bg-card/60 transition-all duration-200 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: g.color }}
                      >
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-foreground">
                          {g.name}
                        </CardTitle>
                        {g.deadline && (
                          <CardDescription className="text-[11px] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {daysLeft !== null && daysLeft > 0
                              ? `${daysLeft} days left`
                              : daysLeft === 0
                              ? "Due today"
                              : "Deadline passed"}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(g.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-sm text-emerald-500">
                      {currency}{" "}
                      {g.currentAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-muted-foreground">
                      Target: {currency}{" "}
                      {g.targetAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <Progress
                    value={percentage}
                    className="h-2.5 rounded-full [&>div]:bg-emerald-500"
                  />

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{percentage}% saved</span>
                    {isCompleted ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/40 text-emerald-500">
                        <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Goal Reached!
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">
                        {currency}{" "}
                        {(g.targetAmount - g.currentAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        left
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedGoal(g);
                      setIsDepositOpen(true);
                    }}
                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl h-9 text-xs font-medium cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Contribute Funds
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Goal Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border/40 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Spark className="w-5 h-5 text-primary" />
              Create Savings Goal
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a target milestone and optional deadline.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Goal Name</Label>
              <Input
                placeholder="e.g. New MacBook, Tokyo Vacation"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background/50 border-input/60 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Target Amount ({currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="2500.00"
                  required
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  className="bg-background/50 border-input/60 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Starting Amount ({currency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  className="bg-background/50 border-input/60 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Target Deadline (Optional)</Label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="bg-background/50 border-input/60 rounded-xl text-xs"
              />
            </div>

            {/* Color preset picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Color Theme</Label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      formData.color === c ? "scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
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
                Save Goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deposit Modal */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border/40 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <DollarCircle className="w-5 h-5 text-emerald-500" />
              Contribute to {selectedGoal?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add savings to this goal from an account or manual progress.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDeposit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Deposit Amount ({currency})</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="100.00"
                required
                value={depositData.amount}
                onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                className="text-lg font-bold bg-background/50 border-input/60 rounded-xl"
              />
            </div>

            {accounts.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Source Account (Optional)</Label>
                <Select
                  value={depositData.accountId}
                  onValueChange={(val) => setDepositData({ ...depositData, accountId: val ?? "" })}
                >
                  <SelectTrigger className="bg-background/50 border-input/60 rounded-xl text-xs">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({currency} {acc.balance.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDepositOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium cursor-pointer"
              >
                {isSubmitting ? <Spark className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Confirm Contribution
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
