"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FunnelSimple, ArrowUpRight, ArrowDownLeft } from "@phosphor-icons/react";
import {
  getPersonalTransactions,
  deletePersonalTransaction,
  formatCurrency,
  formatDate,
} from "@/lib/storage";
import {
  Transaction,
  TransactionType,
  Category,
  CATEGORY_CONFIG,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/lib/types";

function PersonalHistoryList({
  transactions,
  onDelete,
}: {
  transactions: Transaction[];
  onDelete?: () => void;
}) {
  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <div className="rounded-[calc(1.25rem-0.375rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] text-center">
            <p className="text-[var(--muted)] text-sm">Sin transacciones todavia</p>
            <p className="text-[var(--muted)] text-xs mt-1">Tus movimientos apareceran aqui</p>
          </div>
        </div>
      </motion.div>
    );
  }

  function handleDelete(id: string) {
    deletePersonalTransaction(id);
    onDelete?.();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
        <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] divide-y divide-[var(--border)]">
          {transactions.map((tx, i) => {
            const config = CATEGORY_CONFIG[tx.category as Category];
            const isIncome = tx.type === "income";
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.04, ease: [0.32, 0.72, 0, 1] }}
                className="group flex items-center gap-4 px-5 py-4 hover:bg-black/[0.015] transition-colors duration-200"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isIncome ? "var(--income-bg)" : "var(--expense-bg)",
                    color: isIncome ? "var(--income)" : "var(--expense)",
                  }}
                >
                  {isIncome ? (
                    <ArrowUpRight size={16} weight="bold" />
                  ) : (
                    <ArrowDownLeft size={16} weight="bold" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {tx.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="inline-block rounded-full px-2 py-px text-[9px] uppercase tracking-[0.1em] font-medium"
                      style={{
                        backgroundColor: config?.bgColor || "#F0F0EE",
                        color: config?.color || "#787774",
                      }}
                    >
                      {config?.label || tx.category}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">{formatDate(tx.date)}</span>
                  </div>
                </div>
                <span
                  className="text-sm font-mono font-semibold tabular-nums shrink-0"
                  style={{ color: isIncome ? "var(--income)" : "var(--expense)" }}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[var(--expense-bg)] text-[var(--muted)] hover:text-[var(--expense)] transition-all duration-200 active:scale-[0.95]"
                  aria-label="Eliminar transaccion"
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z" />
                  </svg>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default function PersonalHistorialPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");

  const refresh = useCallback(() => {
    setTransactions(getPersonalTransactions());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    return true;
  });

  const allCategories = [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-1">
            Finanzas personales
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter leading-none text-[var(--foreground)]">
            Historial Personal
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--muted)]">
          <FunnelSimple size={14} />
          <span className="text-xs font-mono">{filtered.length}</span>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="space-y-3"
      >
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`
                rounded-full px-3.5 py-1.5 text-xs font-medium
                transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]
                active:scale-[0.96]
                ${
                  filterType === t
                    ? "bg-[var(--foreground)] text-white"
                    : "bg-black/[0.04] text-[var(--muted)] hover:text-[var(--foreground)]"
                }
              `}
            >
              {t === "all" ? "Todos" : t === "income" ? "Ingresos" : "Gastos"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterCategory("all")}
            className={`
              rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] font-medium
              transition-all duration-200
              ${filterCategory === "all" ? "bg-[var(--foreground)] text-white" : "bg-black/[0.04] text-[var(--muted)]"}
            `}
          >
            Todas
          </button>
          {allCategories.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`
                  rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] font-medium
                  transition-all duration-200
                  ${filterCategory === cat ? "ring-2 ring-offset-1" : ""}
                `}
                style={{ backgroundColor: config.bgColor, color: config.color }}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      <PersonalHistoryList transactions={filtered} onDelete={refresh} />
    </div>
  );
}
