import { Transaction, MonthlyStats, Category } from "./types";

const STORAGE_KEY = "contup_transactions";

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
  return getTransactions().filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
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
