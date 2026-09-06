"use client";

import * as React from "react";
import { format, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import {
  Plus,
  BellNotification,
  CheckCircle,
  Clock,
  WarningTriangle,
  Trash,
  Spark,
  Calendar,
  Mail,
  Repeat,
} from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  amount: number | null;
  dueDate: string;
  isRecurring: boolean;
  frequency: string;
  isDone: boolean;
  isEmailNotif: boolean;
  isInAppNotif: boolean;
}

interface RemindersClientProps {
  initialReminders: Reminder[];
  currency: string;
}

export function RemindersClient({
  initialReminders,
  currency,
}: RemindersClientProps) {
  const [reminders, setReminders] = React.useState<Reminder[]>(initialReminders);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    amount: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    isRecurring: false,
    frequency: "ONCE",
    isEmailNotif: true,
    isInAppNotif: true,
  });

  const activeReminders = reminders.filter((r) => !r.isDone);
  const completedReminders = reminders.filter((r) => r.isDone);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dueDate) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          amount: formData.amount ? parseFloat(formData.amount) : undefined,
          dueDate: new Date(formData.dueDate).toISOString(),
          isRecurring: formData.isRecurring,
          frequency: formData.frequency,
          isEmailNotif: formData.isEmailNotif,
          isInAppNotif: formData.isInAppNotif,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create reminder");
      }

      const newReminder = await res.json();
      setReminders((prev) => [
        {
          ...newReminder,
          amount: newReminder.amount ? Number(newReminder.amount) : null,
          dueDate: newReminder.dueDate,
        },
        ...prev,
      ]);
      setIsAddOpen(false);
      setFormData({
        title: "",
        description: "",
        amount: "",
        dueDate: format(new Date(), "yyyy-MM-dd"),
        isRecurring: false,
        frequency: "ONCE",
        isEmailNotif: true,
        isInAppNotif: true,
      });
    } catch (err: any) {
      alert(err.message || "Failed to create reminder");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDone = async (reminder: Reminder) => {
    const updatedStatus = !reminder.isDone;
    setReminders((prev) =>
      prev.map((r) => (r.id === reminder.id ? { ...r, isDone: updatedStatus } : r))
    );

    try {
      const res = await fetch("/api/v1/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reminder.id, isDone: updatedStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch (err: any) {
      // rollback
      setReminders((prev) =>
        prev.map((r) => (r.id === reminder.id ? { ...r, isDone: reminder.isDone } : r))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;

    try {
      const res = await fetch(`/api/v1/reminders?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete reminder");

      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const renderBadge = (dueDateStr: string) => {
    const date = parseISO(dueDateStr);
    if (isToday(date)) {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/40 text-amber-500">
          <Clock className="w-2.5 h-2.5 mr-0.5" /> Due Today
        </Badge>
      );
    }
    if (isTomorrow(date)) {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-blue-400/40 text-blue-400">
          <Clock className="w-2.5 h-2.5 mr-0.5" /> Tomorrow
        </Badge>
      );
    }
    if (isPast(date)) {
      return (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
          <WarningTriangle className="w-2.5 h-2.5 mr-0.5" /> Overdue
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30 text-muted-foreground">
        Upcoming
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Reminders & Bills
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Stay ahead of upcoming payments, subscriptions, and financial deadlines.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 cursor-pointer rounded-xl h-10 px-4 text-xs sm:text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Reminder
        </Button>
      </div>

      {/* Active Reminders */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Active ({activeReminders.length})
        </h2>

        {activeReminders.length === 0 ? (
          <Card className="bg-card/40 backdrop-blur-xl border-border/40 p-8 text-center rounded-2xl">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">
              You have no pending reminders or bills at the moment.
            </p>
          </Card>
        ) : (
          activeReminders.map((r) => (
            <Card
              key={r.id}
              className="bg-card/40 hover:bg-card/60 transition-all duration-200 backdrop-blur-xl border-border/40 rounded-2xl shadow-sm"
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Checkbox
                    checked={r.isDone}
                    onCheckedChange={() => handleToggleDone(r)}
                    className="w-5 h-5 rounded-md cursor-pointer data-[state=checked]:bg-primary"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm sm:text-base text-foreground truncate">
                        {r.title}
                      </h4>
                      {renderBadge(r.dueDate)}
                      {r.isRecurring && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                          <Repeat className="w-2.5 h-2.5 mr-0.5" /> {r.frequency.toLowerCase()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(r.dueDate), "EEEE, MMM d, yyyy")}
                      </span>
                      {r.isEmailNotif && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[11px] text-primary">
                            <Mail className="w-3 h-3" /> Email Alert
                          </span>
                        </>
                      )}
                    </div>
                    {r.description && (
                      <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-1">
                        {r.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {r.amount && (
                    <div className="text-right">
                      <p className="font-semibold text-sm sm:text-base text-foreground">
                        {currency} {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(r.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Completed Reminders */}
      {completedReminders.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Completed ({completedReminders.length})
          </h2>
          {completedReminders.map((r) => (
            <Card
              key={r.id}
              className="bg-card/20 backdrop-blur-xl border-border/30 rounded-2xl shadow-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Checkbox
                    checked={r.isDone}
                    onCheckedChange={() => handleToggleDone(r)}
                    className="w-5 h-5 rounded-md cursor-pointer data-[state=checked]:bg-primary"
                  />
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm text-muted-foreground line-through truncate">
                      {r.title}
                    </h4>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      Completed • Due {format(parseISO(r.dueDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(r.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Reminder Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border/40 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Spark className="w-5 h-5 text-primary" />
              Add Reminder
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Set up a bill deadline, payment reminder, or key financial event.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Title</Label>
              <Input
                placeholder="e.g. Electricity Bill, Internet Subscription"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-background/50 border-input/60 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Due Date</Label>
                <Input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="bg-background/50 border-input/60 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Amount ({currency}, Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="bg-background/50 border-input/60 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    frequency: val ?? "ONCE",
                    isRecurring: (val ?? "ONCE") !== "ONCE",
                  })
                }
              >
                <SelectTrigger className="bg-background/50 border-input/60 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONCE">One-time</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description (Optional)</Label>
              <Textarea
                placeholder="Account number or details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background/50 border-input/60 rounded-xl text-xs resize-none h-16"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-background/40 border border-input/40 rounded-xl">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Email Notification</Label>
                <p className="text-[10px] text-muted-foreground">Send reminder email before due date</p>
              </div>
              <Switch
                checked={formData.isEmailNotif}
                onCheckedChange={(val) => setFormData({ ...formData, isEmailNotif: val })}
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
                Save Reminder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
