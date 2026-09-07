"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
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
  StarSolid,
  MoreHoriz,
  Check,
} from "iconoir-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAccountSchema, type CreateAccountInput } from "@/lib/validations/finance";
import { accountsApi, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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

// Expanded pastel-friendly color palette
const PRESET_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#ef4444", // red
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#10b981", // emerald
  "#6366f1", // indigo
  "#84cc16", // lime
  "#f43f5e", // rose
  "#0ea5e9", // sky
  "#a855f7", // purple
  "#14b8a6", // teal
];

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Generate a soft pastel gradient overlay based on account color */
function cardGradientStyle(color: string) {
  return {
    background: `linear-gradient(135deg, ${color}12 0%, ${color}06 100%)`,
  };
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

// ─── Mini Account Preview Card ─────────────────────────────────────────────
function AccountPreview({
  name, type, balance, currency, color, icon,
}: {
  name: string; type: string; balance: number; currency: string;
  color: string; icon: string;
}) {
  const Icon = ACCOUNT_ICONS[icon] ?? Wallet;
  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden border border-white/10"
      style={cardGradientStyle(color)}
    >
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 blur-xl pointer-events-none"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: `${color}30`, border: `1px solid ${color}50` }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color }} />
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}25`, color }}
        >
          {ACCOUNT_TYPE_LABELS[type] ?? type}
        </span>
      </div>
      <p className="text-xs font-medium text-muted-foreground truncate">{name || "Account Name"}</p>
      <p
        className="text-xl font-black font-heading mt-0.5 truncate"
        style={{ color: balance < 0 ? "#ef4444" : color }}
      >
        {formatCurrency(balance, currency || "USD")}
      </p>
    </div>
  );
}

export function AccountsClient({ initialAccounts, userCurrency }: AccountsClientProps) {
  const [accounts, setAccounts] = React.useState<Account[]>(initialAccounts);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedColor, setSelectedColor] = React.useState(PRESET_COLORS[0]);
  const [isDefault, setIsDefault] = React.useState(false);

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

  // Watch values for live preview
  const watchedName = watch("name");
  const watchedType = watch("type");
  const watchedBalance = watch("balance");
  const watchedIcon = watch("icon");

  function openCreate() {
    setEditingAccount(null);
    reset({ currency: userCurrency, color: PRESET_COLORS[0], icon: "wallet", balance: 0, isDefault: false, type: "BANK", name: "" });
    setSelectedColor(PRESET_COLORS[0]);
    setIsDefault(false);
    setError(null);
    setIsDialogOpen(true);
  }

  const searchParams = useSearchParams();
  React.useEffect(() => {
    if (searchParams.get("add") === "true") {
      openCreate();
    }
  }, [searchParams]);

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
    setIsDefault(account.isDefault);
    setError(null);
    setIsDialogOpen(true);
  }

  async function handleSetDefault(id: string) {
    try {
      await accountsApi.update(id, { isDefault: true });
      setAccounts((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to set default account");
    }
  }

  async function onSubmit(data: any) {
    setError(null);
    try {
      const payload = { ...data, isDefault };
      if (editingAccount) {
        const updated = await accountsApi.update(editingAccount.id, payload);
        const formattedUpdated = { ...updated, balance: Number(updated.balance), isDefault };
        setAccounts((prev) =>
          prev.map((a) => {
            if (a.id === editingAccount.id) return formattedUpdated;
            if (isDefault) return { ...a, isDefault: false };
            return a;
          })
        );
      } else {
        const created = await accountsApi.create(payload);
        const formattedCreated = { ...created, balance: Number(created.balance), isDefault };
        setAccounts((prev) => {
          const others = isDefault
            ? prev.map((a) => ({ ...a, isDefault: false }))
            : prev;
          return [formattedCreated, ...others];
        });
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

  const sortedAccounts = React.useMemo(() => {
    return [...accounts].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return 0;
    });
  }, [accounts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-heading font-black gradient-text">Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            Total: {formatCurrency(totalBalance, userCurrency)}
          </p>
        </div>
        <Button
          id="add-account-btn"
          onClick={openCreate}
          className="rounded-full gap-2 bg-primary hover:glow-sm transition-all shrink-0 ml-3"
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

      {sortedAccounts.length === 0 ? (
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
          {sortedAccounts.map((account, i) => {
            const Icon = ACCOUNT_ICONS[account.icon] ?? Wallet;
            return (
              <div
                key={account.id}
                id={`account-${account.id}`}
                className={cn(
                  "rounded-3xl p-5 group relative overflow-hidden border border-white/10 dark:border-white/5",
                  "hover:-translate-y-1 hover:shadow-xl transition-all duration-300",
                  `animate-fade-in-up delay-${Math.min(i * 100, 500)}`
                )}
                style={cardGradientStyle(account.color)}
              >
                {/* Background glow accent */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-15 blur-2xl pointer-events-none"
                  style={{ background: account.color }}
                  aria-hidden="true"
                />
                <div
                  className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-8 blur-xl pointer-events-none"
                  style={{ background: account.color }}
                  aria-hidden="true"
                />

                <div className="flex items-start justify-between mb-4 relative">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shrink-0"
                    style={{ background: `${account.color}25`, border: `1px solid ${account.color}45` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: account.color }} />
                  </div>
                  <div className="flex items-center gap-1">
                    {account.isDefault && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                        <StarSolid className="h-2.5 w-2.5 mr-1" style={{ color: account.color }} />
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
                        {!account.isDefault && (
                          <DropdownMenuItem
                            id={`set-default-account-${account.id}`}
                            onClick={() => handleSetDefault(account.id)}
                            className="gap-2 cursor-pointer text-amber-500 focus:text-amber-500"
                          >
                            <Star className="h-3.5 w-3.5" strokeWidth={1.8} /> Make Default
                          </DropdownMenuItem>
                        )}
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

                {/* Account Info */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{account.name}</p>
                  <p className="text-xs text-muted-foreground/70 mb-2">
                    {ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · {account.currency}
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-heading font-black leading-tight break-all",
                      account.balance < 0 ? "text-destructive" : "text-foreground"
                    )}
                    style={account.balance >= 0 ? { color: account.color } : undefined}
                  >
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="glass-card border-0 max-w-md w-full p-0 overflow-hidden"
          id="account-dialog"
        >
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[80vh]">
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
              {/* Live Preview */}
              <div className="rounded-2xl overflow-hidden">
                <AccountPreview
                  name={watchedName || "My Account"}
                  type={watchedType || "BANK"}
                  balance={watchedBalance || 0}
                  currency={userCurrency}
                  color={selectedColor}
                  icon={watchedIcon || "wallet"}
                />
              </div>

              {/* Account Name */}
              <div className="space-y-1.5">
                <Label htmlFor="acc-name">Account Name</Label>
                <Input
                  id="acc-name"
                  placeholder="e.g. Chase Checking"
                  className="glass-subtle border-border/60"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              {/* Type + Currency (read-only badge) */}
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
                  <Label>Currency</Label>
                  <div className="flex items-center h-10 px-3 rounded-xl glass-subtle border border-border/60 gap-2">
                    <span className="text-sm font-semibold text-foreground">{userCurrency}</span>
                    <span className="text-xs text-muted-foreground ml-auto">(Profile)</span>
                  </div>
                  {/* hidden input so form has the value */}
                  <input type="hidden" value={userCurrency} {...register("currency")} />
                </div>
              </div>

              {/* Current Balance */}
              <div className="space-y-1.5">
                <Label htmlFor="acc-balance">Current Balance</Label>
                <Input
                  id="acc-balance"
                  type="number"
                  step="0.01"
                  className="glass-subtle border-border/60 font-mono text-lg"
                  defaultValue="0.00"
                  onFocus={(e) => e.target.select()}
                  {...register("balance", { valueAsNumber: true })}
                />
                {errors.balance && <p className="text-xs text-destructive">{errors.balance.message}</p>}
              </div>

              {/* Icon Selector */}
              <div className="space-y-1.5">
                <Label>Icon</Label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(ACCOUNT_ICONS).map(([key, IconComp]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setValue("icon", key as any)}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 border",
                        watchedIcon === key
                          ? "border-primary bg-primary/20 scale-110 shadow-md"
                          : "border-border/40 hover:border-primary/40 bg-muted/30"
                      )}
                      aria-label={key}
                    >
                      <IconComp className="h-5 w-5" style={{ color: watchedIcon === key ? selectedColor : undefined }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      id={`color-${color.slice(1)}`}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all duration-150 flex items-center justify-center",
                        selectedColor === color && "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                      )}
                      style={{ background: color }}
                      onClick={() => {
                        setSelectedColor(color);
                        setValue("color", color);
                      }}
                    >
                      {selectedColor === color && <Check className="h-3 w-3 text-white drop-shadow-md" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Is Default Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl glass-subtle border border-border/40">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Main Account?</p>
                  <p className="text-xs text-muted-foreground">
                    Set as your primary account for quick transactions
                  </p>
                </div>
                <Switch
                  id="acc-default"
                  checked={isDefault}
                  onCheckedChange={(val) => {
                    setIsDefault(val);
                    setValue("isDefault", val);
                  }}
                />
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <DialogFooter className="pt-1 flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  id="save-account-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:glow-sm transition-all"
                >
                  {isSubmitting ? "Saving…" : editingAccount ? "Update Account" : "Add Account"}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
