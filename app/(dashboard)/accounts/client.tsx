"use client";

import * as React from "react";
import {
  Plus,
  Wallet,
  Building,
  CreditCard,
  PiggyBank,
  GraphUp,
  DollarCircle,
  EditPencil,
  Trash,
  Star,
  MoreHoriz,
} from "iconoir-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAccountSchema, type CreateAccountInput } from "@/lib/validations/finance";
import { accountsApi, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: "Cash", BANK: "Bank", CREDIT_CARD: "Credit Card",
  INVESTMENT: "Investment", SAVINGS: "Savings", OTHER: "Other",
};

const PRESET_COLORS = [
  "#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#10b981", "#6366f1",
];

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

interface Account {
  id: string; name: string; type: string; balance: number;
  currency: string; color: string; icon: string; isDefault: boolean;
  description?: string | null;
}

interface AccountsClientProps {
  initialAccounts: Account[];
  userCurrency: string;
}

interface AccountFormData {
  name: string;
  type: string;
  balance: number;
  currency: string;
  color: string;
  icon: string;
  description?: string;
  isDefault: boolean;
}

export function AccountsClient({ initialAccounts, userCurrency }: AccountsClientProps) {
  const [accounts, setAccounts] = React.useState<Account[]>(initialAccounts);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedColor, setSelectedColor] = React.useState(PRESET_COLORS[0]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(createAccountSchema) as any,
    defaultValues: {
      name: "",
      type: "BANK",
      balance: 0,
      currency: userCurrency,
      color: PRESET_COLORS[0],
      icon: "wallet",
      isDefault: false,
    },
  });

  function openCreate() {
    setEditingAccount(null);
    reset({ currency: userCurrency, color: PRESET_COLORS[0], icon: "wallet" });
    setSelectedColor(PRESET_COLORS[0]);
    setError(null);
    setIsDialogOpen(true);
  }

  function openEdit(account: Account) {
    setEditingAccount(account);
    reset({
      name: account.name,
      type: account.type as any,
      balance: account.balance,
      currency: account.currency,
      color: account.color,
      icon: account.icon as any,
      description: account.description ?? undefined,
      isDefault: account.isDefault,
    });
    setSelectedColor(account.color);
    setError(null);
    setIsDialogOpen(true);
  }

  async function onSubmit(data: any) {
    setError(null);
    try {
      if (editingAccount) {
        const updated = await accountsApi.update(editingAccount.id, data);
        setAccounts((prev) =>
          prev.map((a) => (a.id === editingAccount.id ? { ...a, ...updated, balance: Number(updated.balance) } : a))
        );
      } else {
        const created = await accountsApi.create(data);
        setAccounts((prev) => [...prev, { ...created, balance: Number(created.balance) }]);
      }
      setIsDialogOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function handleDelete(id: string) {
    try {
      await accountsApi.delete(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete account");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-heading font-black gradient-text">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total: {formatCurrency(totalBalance, userCurrency)}
          </p>
        </div>
        <Button
          id="add-account-btn"
          onClick={openCreate}
          className="rounded-xl gap-2 bg-primary hover:glow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Account</span>
        </Button>
      </div>

      {error && (
        <div className="glass-subtle rounded-xl p-3 border-destructive/30 text-destructive text-sm animate-fade-in">
          {error}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-lg mb-2">No accounts yet</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Add your first account to start tracking your finances
          </p>
          <Button onClick={openCreate} id="add-first-account" className="gap-2">
            <Plus className="h-4 w-4" /> Add Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account, i) => {
            const Icon = ACCOUNT_ICONS[account.icon] ?? Wallet;
            return (
              <div
                key={account.id}
                id={`account-${account.id}`}
                className={cn(
                  "glass-card rounded-3xl p-5 group relative overflow-hidden",
                  "hover:-translate-y-1 transition-all duration-200",
                  `animate-fade-in-up delay-${Math.min(i * 100, 500)}`
                )}
              >
                {/* Background accent */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-xl pointer-events-none"
                  style={{ background: account.color }}
                  aria-hidden="true"
                />

                <div className="flex items-start justify-between mb-4 relative">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
                    style={{ background: `${account.color}25`, border: `1px solid ${account.color}40` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: account.color }} />
                  </div>
                  <div className="flex items-center gap-1">
                    {account.isDefault && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                        <Star className="h-2.5 w-2.5 mr-1" />
                        Default
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        id={`account-menu-${account.id}`}
                        className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-muted/40 text-muted-foreground"
                      >
                        <MoreHoriz className="h-4 w-4" strokeWidth={2} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="glass-card border-0">
                        <DropdownMenuItem
                          id={`edit-account-${account.id}`}
                          onClick={() => openEdit(account)}
                          className="gap-2 cursor-pointer"
                        >
                          <EditPencil className="h-3.5 w-3.5" strokeWidth={1.8} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          id={`delete-account-${account.id}`}
                          onClick={() => handleDelete(account.id)}
                          className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash className="h-3.5 w-3.5" strokeWidth={1.8} /> Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-1">{account.name}</p>
                <p className="text-xs text-muted-foreground/60 mb-3">
                  {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                </p>
                <p
                  className={cn(
                    "text-2xl font-heading font-black",
                    account.balance < 0 ? "text-destructive" : "text-foreground"
                  )}
                >
                  {formatCurrency(account.balance, account.currency)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-card border-0 max-w-md" id="account-dialog">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="acc-name">Account Name</Label>
              <Input id="acc-name" placeholder="e.g. Chase Checking" className="glass-subtle border-border/60" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  onValueChange={(v) => setValue("type", v as any)}
                  defaultValue={editingAccount?.type ?? "BANK"}
                >
                  <SelectTrigger id="acc-type" className="glass-subtle border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-0">
                    {Object.entries(ACCOUNT_TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acc-currency">Currency</Label>
                <Input
                  id="acc-currency"
                  maxLength={3}
                  placeholder="USD"
                  className="glass-subtle border-border/60 uppercase"
                  {...register("currency")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-balance">Current Balance</Label>
              <Input
                id="acc-balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="glass-subtle border-border/60"
                {...register("balance", { valueAsNumber: true })}
              />
              {errors.balance && <p className="text-xs text-destructive">{errors.balance.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    id={`color-${color.slice(1)}`}
                    className={cn(
                      "w-7 h-7 rounded-lg transition-all duration-150",
                      selectedColor === color && "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                    )}
                    style={{ background: color }}
                    onClick={() => {
                      setSelectedColor(color);
                      setValue("color", color);
                    }}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                id="save-account-btn"
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:glow-sm transition-all"
              >
                {isSubmitting ? "Saving…" : editingAccount ? "Update" : "Add Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
