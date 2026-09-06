import { z } from "zod";
import { sanitizedString } from "@/lib/sanitize";

const FinancialAccountType = z.enum([
  "CASH",
  "BANK",
  "CREDIT_CARD",
  "INVESTMENT",
  "SAVINGS",
  "OTHER",
]);

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(1, "Account name is required")
    .max(50, "Account name must be at most 50 characters")
    .transform(sanitizedString),
  type: FinancialAccountType,
  balance: z
    .number()
    .min(-999999999, "Balance is too low")
    .max(999999999, "Balance is too high"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format").default("#6366f1"),
  icon: z.string().min(1).max(50).default("wallet").transform(sanitizedString),
  description: z
    .string()
    .max(200, "Description too long")
    .transform(sanitizedString)
    .optional(),
  isDefault: z.boolean().default(false),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

// ────────────────────────────────────────────────────────────
// Transaction Schemas
// ────────────────────────────────────────────────────────────

const TransactionType = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);
const RecurringInterval = z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]);

export const baseTransactionSchema = z.object({
  accountId: z.string().min(1, "Account is required").cuid("Invalid account ID"),
  toAccountId: z.string().cuid("Invalid destination account").optional(),
  categoryId: z.string().cuid("Invalid category").optional(),
  type: TransactionType,
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(999999999, "Amount is too large"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
  exchangeRate: z.number().positive().optional(),
  date: z.string().datetime().or(z.date()),
  description: z
    .string()
    .max(100, "Description too long")
    .transform(sanitizedString)
    .optional(),
  note: z
    .string()
    .max(500, "Note too long")
    .transform(sanitizedString)
    .optional(),
  tags: z.array(z.string().transform(sanitizedString)).max(10).default([]),
  isRecurring: z.boolean().default(false),
  recurringInterval: RecurringInterval.optional(),
  recurringEndDate: z.string().datetime().optional(),
  isSplit: z.boolean().default(false),
});

export const createTransactionSchema = baseTransactionSchema
  .refine(
    (data) => {
      if (data.type === "TRANSFER" && !data.toAccountId) {
        return false;
      }
      return true;
    },
    { message: "Destination account is required for transfers", path: ["toAccountId"] }
  )
  .refine(
    (data) => {
      if (data.isRecurring && !data.recurringInterval) {
        return false;
      }
      return true;
    },
    { message: "Recurring interval is required for recurring transactions", path: ["recurringInterval"] }
  );

export const updateTransactionSchema = baseTransactionSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

// ────────────────────────────────────────────────────────────
// Category Schemas
// ────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(50, "Category name too long")
    .transform(sanitizedString),
  icon: z.string().min(1).max(50).default("tag").transform(sanitizedString),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color").default("#6366f1"),
  type: z.enum(["INCOME", "EXPENSE", "BOTH"]).default("EXPENSE"),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ────────────────────────────────────────────────────────────
// Budget Schemas
// ────────────────────────────────────────────────────────────

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required").cuid("Invalid category ID"),
  name: z
    .string()
    .min(1, "Budget name is required")
    .max(80, "Budget name too long")
    .transform(sanitizedString),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(999999999, "Amount too large"),
  period: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).default("MONTHLY"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  alertAt: z.number().min(1).max(100).default(80),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

// ────────────────────────────────────────────────────────────
// Reminder Schemas
// ────────────────────────────────────────────────────────────

export const createReminderSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title too long")
    .transform(sanitizedString),
  description: z
    .string()
    .max(500, "Description too long")
    .transform(sanitizedString)
    .optional(),
  amount: z.number().positive().max(999999999).optional(),
  dueDate: z.string().datetime(),
  isRecurring: z.boolean().default(false),
  frequency: z
    .enum(["ONCE", "DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "YEARLY"])
    .default("ONCE"),
  isEmailNotif: z.boolean().default(true),
  isInAppNotif: z.boolean().default(true),
});

export const updateReminderSchema = createReminderSchema.partial();

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;

// ────────────────────────────────────────────────────────────
// Goal Schemas
// ────────────────────────────────────────────────────────────

export const createGoalSchema = z.object({
  name: z
    .string()
    .min(1, "Goal name is required")
    .max(80, "Goal name too long")
    .transform(sanitizedString),
  description: z
    .string()
    .max(500, "Description too long")
    .transform(sanitizedString)
    .optional(),
  targetAmount: z
    .number()
    .positive("Target amount must be positive")
    .max(999999999, "Target too large"),
  currency: z.string().length(3).default("USD"),
  deadline: z.string().datetime().optional(),
  icon: z.string().min(1).max(50).default("target").transform(sanitizedString),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export const updateGoalSchema = createGoalSchema.partial();

export const goalDepositSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(999999999, "Amount too large"),
  note: z.string().max(200).transform(sanitizedString).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type GoalDepositInput = z.infer<typeof goalDepositSchema>;

// ────────────────────────────────────────────────────────────
// Settings Schemas
// ────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name too long")
    .transform(sanitizedString)
    .optional(),
  currency: z.string().length(3, "Currency must be a 3-letter code").optional(),
  locale: z.string().min(2).max(10).optional(),
});

const BottomNavItemSchema = z.object({
  id: z.string(),
  label: z.string().max(20).transform(sanitizedString),
  icon: z.string().max(50).transform(sanitizedString),
  href: z.string().startsWith("/"),
  enabled: z.boolean(),
});

export const updateBottomNavSchema = z.object({
  items: z
    .array(BottomNavItemSchema)
    .min(3, "At least 3 items required")
    .max(5, "Maximum 5 items allowed"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateBottomNavInput = z.infer<typeof updateBottomNavSchema>;
