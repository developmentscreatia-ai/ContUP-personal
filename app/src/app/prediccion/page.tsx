"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChartBar,
  TrendUp,
  TrendDown,
  Info,
} from "@phosphor-icons/react";
import { getTransactions, getFixedItems, formatCurrency } from "@/lib/storage";
import { Transaction, FixedItem, Category, CATEGORY_CONFIG } from "@/lib/types";

// --- Forecast logic ---

interface MonthData {
  year: number;
  month: number;
  income: number;
  expenses: number;
  categoryBreakdown: Record<string, number>;
}

interface ForecastMonth {
  year: number;
  month: number;
  label: string;
  income: number;
  expenses: number;
  balance: number;
  categoryBreakdown: Record<string, number>;
}

function getHistoricalMonths(transactions: Transaction[]): MonthData[] {
  const map = new Map<string, MonthData>();
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map.has(key)) {
      map.set(key, {
        year: d.getFullYear(),
        month: d.getMonth(),
        income: 0,
        expenses: 0,
        categoryBreakdown: {},
      });
    }
    const m = map.get(key)!;
    if (t.type === "income") {
      m.income += t.amount;
    } else {
      m.expenses += t.amount;
      m.categoryBreakdown[t.category] =
        (m.categoryBreakdown[t.category] || 0) + t.amount;
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );
}

function buildForecast(
  transactions: Transaction[],
  fixedItems: FixedItem[],
  monthsAhead = 12
): { forecast: ForecastMonth[]; monthsOfData: number } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Exclude the current (partial) month from the average
  const historical = getHistoricalMonths(transactions).filter(
    (m) => !(m.year === currentYear && m.month === currentMonth)
  );

  const monthsOfData = historical.length;
  if (monthsOfData === 0) return { forecast: [], monthsOfData: 0 };

  // Use up to the last 6 complete months for the rolling average
  const recent = historical.slice(-6);
  const count = recent.length;

  const avgVariableIncome =
    recent.reduce((s, m) => s + m.income, 0) / count;
  const avgVariableExpenses =
    recent.reduce((s, m) => s + m.expenses, 0) / count;

  const categoryTotals: Record<string, number> = {};
  for (const m of recent) {
    for (const [cat, amt] of Object.entries(m.categoryBreakdown)) {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    }
  }
  const avgCategoryBreakdown: Record<string, number> = {};
  for (const [cat, total] of Object.entries(categoryTotals)) {
    avgCategoryBreakdown[cat] = total / count;
  }

  // Active fixed items
  const activeFixed = fixedItems.filter((f) => f.active);
  const fixedIncome = activeFixed
    .filter((f) => f.type === "income")
    .reduce((s, f) => s + f.amount, 0);
  const fixedExpenses = activeFixed
    .filter((f) => f.type === "expense")
    .reduce((s, f) => s + f.amount, 0);
  const fixedCategoryBreakdown: Record<string, number> = {};
  for (const f of activeFixed.filter((f) => f.type === "expense")) {
    fixedCategoryBreakdown[f.category] =
      (fixedCategoryBreakdown[f.category] || 0) + f.amount;
  }

  const forecast: ForecastMonth[] = [];
  for (let i = 1; i <= monthsAhead; i++) {
    const d = new Date(currentYear, currentMonth + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleDateString("es-ES", {
      month: "short",
      year: "numeric",
    });

    const income = avgVariableIncome + fixedIncome;
    const expenses = avgVariableExpenses + fixedExpenses;

    const categoryBreakdown: Record<string, number> = {
      ...avgCategoryBreakdown,
    };
    for (const [cat, amt] of Object.entries(fixedCategoryBreakdown)) {
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
    }

    forecast.push({
      year,
      month,
      label,
      income,
      expenses,
      balance: income - expenses,
      categoryBreakdown,
    });
  }

  return { forecast, monthsOfData };
}

function monthName(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
}

export default function PrediccionPage() {
  const [forecast, setForecast] = useState<ForecastMonth[]>([]);
  const [monthsOfData, setMonthsOfData] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const transactions = getTransactions();
    const fixedItems = getFixedItems();
    const result = buildForecast(transactions, fixedItems);
    setForecast(result.forecast);
    setMonthsOfData(result.monthsOfData);
    setLoaded(true);
  }, []);

  const nextMonth = forecast[0] ?? null;
  const hasEnoughData = monthsOfData >= 2;

  const topCategories = nextMonth
    ? Object.entries(nextMonth.categoryBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : [];

  const maxAmount =
    forecast.length > 0
      ? Math.max(...forecast.map((m) => Math.max(m.income, m.expenses)))
      : 0;

  const totalIncome = forecast.reduce((s, m) => s + m.income, 0);
  const totalExpenses = forecast.reduce((s, m) => s + m.expenses, 0);
  const totalBalance = totalIncome - totalExpenses;

  if (!loaded) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-1">
          Basado en tu historial
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter leading-none text-[var(--foreground)]">
          Predicciones
        </h1>
      </motion.div>

      {/* Not enough data */}
      {!hasEnoughData && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
            <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FBF3DB] flex items-center justify-center mx-auto">
                <ChartBar size={24} weight="bold" className="text-[#956400]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Necesitas más datos
                </p>
                <p className="text-xs text-[var(--muted)] mt-1.5 max-w-[260px] mx-auto leading-relaxed">
                  Registra al menos 2 meses completos de transacciones y
                  ContUp calculará automáticamente lo que gastarás, ingresarás
                  y ahorrarás en el futuro.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.04] text-xs text-[var(--muted)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                {monthsOfData === 0
                  ? "Sin meses completos todavía"
                  : `${monthsOfData} mes${monthsOfData !== 1 ? "es" : ""} registrado`}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main content */}
      {hasEnoughData && nextMonth && (
        <>
          {/* Info badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/[0.04] text-xs text-[var(--muted)]">
              <Info size={12} />
              Predicción basada en {Math.min(monthsOfData, 6)} mes
              {Math.min(monthsOfData, 6) !== 1 ? "es" : ""} de historial
            </div>
          </motion.div>

          {/* Next month highlight card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
          >
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
              Próximo mes —{" "}
              <span className="capitalize">
                {monthName(nextMonth.year, nextMonth.month)}
              </span>
            </p>
            <div className="rounded-[1.25rem] bg-[var(--foreground)] p-1.5">
              <div className="rounded-[calc(1.25rem-0.375rem)] bg-[var(--foreground)] p-5 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-white/50 text-[10px] uppercase tracking-[0.12em] font-medium mb-2">
                    Ingresos
                  </p>
                  <p className="text-white font-mono font-semibold text-base tracking-tight">
                    {formatCurrency(nextMonth.income)}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    <TrendUp size={10} className="text-green-400" />
                    <span className="text-[10px] text-white/40">estimado</span>
                  </div>
                </div>
                <div className="text-center border-x border-white/[0.08]">
                  <p className="text-white/50 text-[10px] uppercase tracking-[0.12em] font-medium mb-2">
                    Gastos
                  </p>
                  <p className="text-white font-mono font-semibold text-base tracking-tight">
                    {formatCurrency(nextMonth.expenses)}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    <TrendDown size={10} className="text-red-400" />
                    <span className="text-[10px] text-white/40">estimado</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white/50 text-[10px] uppercase tracking-[0.12em] font-medium mb-2">
                    Ahorro
                  </p>
                  <p
                    className={`font-mono font-semibold text-base tracking-tight ${
                      nextMonth.balance >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(nextMonth.balance)}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    <span className="text-[10px] text-white/40">previsto</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 12-month bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
              Proyección 12 meses
            </p>
            <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
              <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5">
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--income)]" />
                    <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-[0.1em]">
                      Ingresos
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--expense)]" />
                    <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-[0.1em]">
                      Gastos
                    </span>
                  </div>
                </div>
                <div className="flex items-end gap-1 h-36">
                  {forecast.map((m, i) => {
                    const incomePct =
                      maxAmount > 0 ? (m.income / maxAmount) * 100 : 0;
                    const expensePct =
                      maxAmount > 0 ? (m.expenses / maxAmount) * 100 : 0;
                    const isNext = i === 0;
                    return (
                      <div
                        key={`${m.year}-${m.month}`}
                        className="flex-1 flex flex-col items-center gap-1 group relative"
                      >
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
                          <div className="bg-[var(--foreground)] text-white rounded-xl px-3 py-2.5 text-[10px] whitespace-nowrap shadow-xl">
                            <div className="font-semibold mb-1 capitalize">
                              {m.label}
                            </div>
                            <div className="text-green-400">
                              ↑ {formatCurrency(m.income)}
                            </div>
                            <div className="text-red-400">
                              ↓ {formatCurrency(m.expenses)}
                            </div>
                            <div
                              className={
                                m.balance >= 0
                                  ? "text-white/60"
                                  : "text-red-300"
                              }
                            >
                              = {formatCurrency(m.balance)}
                            </div>
                          </div>
                        </div>

                        {/* Bars */}
                        <div className="w-full flex items-end gap-0.5 h-28">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${incomePct}%` }}
                            transition={{
                              duration: 0.7,
                              delay: 0.3 + i * 0.04,
                              ease: [0.32, 0.72, 0, 1],
                            }}
                            className={`flex-1 rounded-t-sm transition-opacity ${
                              isNext
                                ? "bg-[var(--income)]"
                                : "bg-[var(--income)]/35"
                            }`}
                          />
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${expensePct}%` }}
                            transition={{
                              duration: 0.7,
                              delay: 0.35 + i * 0.04,
                              ease: [0.32, 0.72, 0, 1],
                            }}
                            className={`flex-1 rounded-t-sm transition-opacity ${
                              isNext
                                ? "bg-[var(--expense)]"
                                : "bg-[var(--expense)]/35"
                            }`}
                          />
                        </div>

                        {/* Month label */}
                        <span
                          className={`text-[8px] font-medium uppercase tracking-wide truncate max-w-full ${
                            isNext
                              ? "text-[var(--foreground)]"
                              : "text-[var(--muted)]/50"
                          }`}
                        >
                          {m.label.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Category forecast */}
          {topCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.25,
                ease: [0.32, 0.72, 0, 1],
              }}
            >
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
                Gastos estimados por categoría
              </p>
              <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
                <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5 space-y-4">
                  {topCategories.map(([cat, amount], i) => {
                    const config = CATEGORY_CONFIG[cat as Category];
                    const pct =
                      nextMonth.expenses > 0
                        ? (amount / nextMonth.expenses) * 100
                        : 0;
                    return (
                      <motion.div
                        key={cat}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.35 + i * 0.08,
                          ease: [0.32, 0.72, 0, 1],
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className="inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] font-medium"
                            style={{
                              backgroundColor: config?.bgColor || "#F0F0EE",
                              color: config?.color || "#787774",
                            }}
                          >
                            {config?.label || cat}
                          </span>
                          <span className="text-sm font-mono font-medium text-[var(--foreground)]">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-black/[0.04] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: config?.color || "#787774",
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              duration: 0.8,
                              delay: 0.4 + i * 0.08,
                              ease: [0.32, 0.72, 0, 1],
                            }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* 12-month totals */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
              Acumulado previsto (12 meses)
            </p>
            <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
              <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--muted)] font-medium mb-2">
                      Ingresos totales
                    </p>
                    <p className="font-mono font-semibold text-base tracking-tight text-[var(--income)]">
                      {formatCurrency(totalIncome)}
                    </p>
                  </div>
                  <div className="text-center border-x border-black/[0.05]">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--muted)] font-medium mb-2">
                      Gastos totales
                    </p>
                    <p className="font-mono font-semibold text-base tracking-tight text-[var(--expense)]">
                      {formatCurrency(totalExpenses)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--muted)] font-medium mb-2">
                      Ahorro total
                    </p>
                    <p
                      className={`font-mono font-semibold text-base tracking-tight ${
                        totalBalance >= 0
                          ? "text-[var(--income)]"
                          : "text-[var(--expense)]"
                      }`}
                    >
                      {formatCurrency(totalBalance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
