"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendUp,
  TrendDown,
  Scales,
  Receipt,
} from "@phosphor-icons/react";
import StatCard from "@/components/StatCard";
import ExpenseChart from "@/components/ExpenseChart";
import TransactionList from "@/components/TransactionList";
import { getMonthlyStats, getMonthTransactions, formatCurrency } from "@/lib/storage";
import { Transaction, MonthlyStats } from "@/lib/types";
import Link from "next/link";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function Dashboard() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refresh = useCallback(() => {
    setStats(getMonthlyStats(year, month));
    setTransactions(getMonthTransactions(year, month));
  }, [year, month]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-1">
            Resumen financiero
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter leading-none text-[var(--foreground)]">
            Panel
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95]"
          >
            <span className="text-sm">&larr;</span>
          </button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95]"
          >
            <span className="text-sm">&rarr;</span>
          </button>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard
          label="Balance"
          value={formatCurrency(stats.balance)}
          icon={<Scales size={18} weight="bold" />}
          accent={stats.balance >= 0 ? "var(--income)" : "var(--expense)"}
          accentBg={stats.balance >= 0 ? "var(--income-bg)" : "var(--expense-bg)"}
          className="md:col-span-2"
          delay={0}
        />
        <StatCard
          label="Ingresos"
          value={formatCurrency(stats.totalIncome)}
          icon={<TrendUp size={18} weight="bold" />}
          accent="var(--income)"
          accentBg="var(--income-bg)"
          delay={0.08}
        />
        <StatCard
          label="Gastos"
          value={formatCurrency(stats.totalExpenses)}
          icon={<TrendDown size={18} weight="bold" />}
          accent="var(--expense)"
          accentBg="var(--expense-bg)"
          delay={0.16}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <ExpenseChart categoryBreakdown={stats.categoryBreakdown} />
        </div>
        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
              Ultimos movimientos
            </h2>
            <Link
              href="/history"
              className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-200"
            >
              <Receipt size={12} />
              Ver todo
            </Link>
          </div>
          <TransactionList
            transactions={transactions}
            limit={6}
            onDelete={refresh}
          />
        </div>
      </div>
    </div>
  );
}
