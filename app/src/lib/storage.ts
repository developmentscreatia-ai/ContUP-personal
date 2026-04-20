import { Transaction, MonthlyStats, Category, FixedItem, ScannedReceipt, SavingsGoal } from "./types";

const STORAGE_KEY = "contup_transactions";
const FIXED_KEY = "contup_fixed_items";
const RECEIPTS_KEY = "contup_receipts";

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
}

export function saveTransaction(tx: Transaction): void {
  const all = getTransactions();
  all.unshift(tx);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteTransaction(id: string): void {
  const all = getTransactions().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// --- Fixed Items ---

export function getFixedItems(): FixedItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(FIXED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FixedItem[];
  } catch {
    return [];
  }
}

function saveFixedItems(items: FixedItem[]): void {
  localStorage.setItem(FIXED_KEY, JSON.stringify(items));
}

export function addFixedItem(item: FixedItem): void {
  const all = getFixedItems();
  all.unshift(item);
  saveFixedItems(all);
}

export function deleteFixedItem(id: string): void {
  saveFixedItems(getFixedItems().filter((i) => i.id !== id));
}

export function toggleFixedItem(id: string): void {
  const all = getFixedItems();
  const item = all.find((i) => i.id === id);
  if (item) item.active = !item.active;
  saveFixedItems(all);
}

export function getMonthlyStats(
  year: number,
  month: number
): MonthlyStats {
  const all = getTransactions();
  const filtered = all.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const categoryBreakdown = {} as Record<Category, number>;
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of filtered) {
    if (t.type === "income") {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      categoryBreakdown[t.category] =
        (categoryBreakdown[t.category] || 0) + t.amount;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    transactionCount: filtered.length,
    categoryBreakdown,
  };
}

export function getMonthTransactions(
  year: number,
  month: number
): Transaction[] {
  const manual = getTransactions().filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return manual;
}

// --- Scanned Receipts ---

export function getReceipts(): ScannedReceipt[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(RECEIPTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ScannedReceipt[];
  } catch {
    return [];
  }
}

function saveReceipts(items: ScannedReceipt[]): void {
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(items));
}

export function addReceipt(receipt: ScannedReceipt): void {
  const all = getReceipts();
  all.unshift(receipt);
  saveReceipts(all);
}

export function deleteReceipt(id: string): void {
  saveReceipts(getReceipts().filter((r) => r.id !== id));
}

export function markReceiptAsTransaction(id: string): void {
  const all = getReceipts();
  const receipt = all.find((r) => r.id === id);
  if (receipt) {
    receipt.addedAsTransaction = true;
    saveReceipts(all);
  }
}

// --- Savings Goals ---

const GOALS_KEY = "contup_savings_goals";

export function getSavingsGoals(): SavingsGoal[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(GOALS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavingsGoal[];
  } catch {
    return [];
  }
}

function saveGoals(goals: SavingsGoal[]): void {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export function addSavingsGoal(goal: SavingsGoal): void {
  const all = getSavingsGoals();
  all.unshift(goal);
  saveGoals(all);
}

export function deleteSavingsGoal(id: string): void {
  saveGoals(getSavingsGoals().filter((g) => g.id !== id));
}

export function updateSavingsGoalProgress(id: string, savedAmount: number): void {
  const all = getSavingsGoals();
  const goal = all.find((g) => g.id === id);
  if (goal) {
    goal.savedAmount = savedAmount;
    saveGoals(all);
  }
}

// --- Personal Initial Balance ---

const PERSONAL_INITIAL_BALANCE_KEY = "contup_personal_initial_balance";

export function getPersonalInitialBalance(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(PERSONAL_INITIAL_BALANCE_KEY);
  return raw !== null ? parseFloat(raw) : 0;
}

export function setPersonalInitialBalance(amount: number): void {
  localStorage.setItem(PERSONAL_INITIAL_BALANCE_KEY, amount.toString());
}

export function getPersonalTotalBalance(): number {
  const initial = getPersonalInitialBalance();
  const transactions = getPersonalTransactions();
  const txBalance = transactions.reduce((sum, t) => {
    return t.type === "income" ? sum + t.amount : sum - t.amount;
  }, 0);
  return initial + txBalance;
}

export interface MonthlySavingsEntry {
  year: number;
  month: number;
  income: number;
  expenses: number;
  savings: number;
  fixedIncome: number;
  fixedExpenses: number;
  totalSavings: number;
}

export function getPersonalMonthlySavings(): MonthlySavingsEntry[] {
  const transactions = getPersonalTransactions();
  const fixedItems = getFixedItems().filter((i) => i.active);

  const monthMap = new Map<string, { income: number; expenses: number }>();

  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    if (!monthMap.has(key)) monthMap.set(key, { income: 0, expenses: 0 });
    const entry = monthMap.get(key)!;
    if (t.type === "income") entry.income += t.amount;
    else entry.expenses += t.amount;
  }

  const fixedIncomeTot = fixedItems
    .filter((i) => i.type === "income")
    .reduce((s, i) => s + i.amount, 0);
  const fixedExpensesTot = fixedItems
    .filter((i) => i.type === "expense")
    .reduce((s, i) => s + i.amount, 0);

  return Array.from(monthMap.entries())
    .map(([key, data]) => {
      const [yearStr, monthStr] = key.split("-");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      return {
        year,
        month,
        income: data.income,
        expenses: data.expenses,
        savings: data.income - data.expenses,
        fixedIncome: fixedIncomeTot,
        fixedExpenses: fixedExpensesTot,
        totalSavings: data.income - data.expenses + fixedIncomeTot - fixedExpensesTot,
      };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

// --- Personal Transactions ---

const PERSONAL_KEY = "contup_personal_transactions";

export function getPersonalTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PERSONAL_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
}

export function savePersonalTransaction(tx: Transaction): void {
  const all = getPersonalTransactions();
  all.unshift(tx);
  localStorage.setItem(PERSONAL_KEY, JSON.stringify(all));
}

export function deletePersonalTransaction(id: string): void {
  const all = getPersonalTransactions().filter((t) => t.id !== id);
  localStorage.setItem(PERSONAL_KEY, JSON.stringify(all));
}

export function getPersonalMonthlyStats(year: number, month: number): MonthlyStats {
  const all = getPersonalTransactions();
  const filtered = all.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const categoryBreakdown = {} as Record<Category, number>;
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of filtered) {
    if (t.type === "income") {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    transactionCount: filtered.length,
    categoryBreakdown,
  };
}

export function getPersonalMonthTransactions(year: number, month: number): Transaction[] {
  return getPersonalTransactions().filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function getReceiptsTotal(): number {
  return getReceipts().reduce((sum, r) => sum + r.amount, 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}
