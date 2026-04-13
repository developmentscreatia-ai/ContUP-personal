"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FunnelSimple } from "@phosphor-icons/react";
import TransactionList from "@/components/TransactionList";
import { getTransactions } from "@/lib/storage";
import {
  Transaction,
  TransactionType,
  Category,
  CATEGORY_CONFIG,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/lib/types";

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");

  const refresh = useCallback(() => {
    setTransactions(getTransactions());
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
            Todos los movimientos
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter leading-none text-[var(--foreground)]">
            Historial
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
        {/* Type filter */}
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

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterCategory("all")}
            className={`
              rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] font-medium
              transition-all duration-200
              ${
                filterCategory === "all"
                  ? "bg-[var(--foreground)] text-white"
                  : "bg-black/[0.04] text-[var(--muted)]"
              }
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
                  ${
                    filterCategory === cat
                      ? "ring-2 ring-offset-1"
                      : ""
                  }
                `}
                style={{
                  backgroundColor: config.bgColor,
                  color: config.color,
                }}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* List */}
      <TransactionList
        transactions={filtered}
        onDelete={refresh}
        showDelete
      />
    </div>
  );
}
