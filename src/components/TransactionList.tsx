"use client";

import { motion } from "framer-motion";
import { Transaction, CATEGORY_CONFIG, Category } from "@/lib/types";
import { formatCurrency, formatDate, deleteTransaction } from "@/lib/storage";
import { ArrowUpRight, ArrowDownLeft, Trash, PushPin } from "@phosphor-icons/react";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  limit?: number;
  showDelete?: boolean;
}

export default function TransactionList({
  transactions,
  onDelete,
  limit,
  showDelete = false,
}: TransactionListProps) {
  const items = limit ? transactions.slice(0, limit) : transactions;

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <div className="rounded-[calc(1.25rem-0.375rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] text-center">
            <p className="text-[var(--muted)] text-sm">
              Sin transacciones todavia
            </p>
            <p className="text-[var(--muted)] text-xs mt-1">
              Tus movimientos apareceran aqui
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  function handleDelete(id: string) {
    deleteTransaction(id);
    onDelete?.(id);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
        <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] divide-y divide-[var(--border)]">
          {items.map((tx, i) => {
            const config = CATEGORY_CONFIG[tx.category as Category];
            const isIncome = tx.type === "income";
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.5 + i * 0.06,
                  ease: [0.32, 0.72, 0, 1],
                }}
                className="group flex items-center gap-4 px-5 py-4 hover:bg-black/[0.015] transition-colors duration-200"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isIncome
                      ? "var(--income-bg)"
                      : "var(--expense-bg)",
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
                    {tx.isFixed ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-[0.08em] font-medium text-[var(--muted)]">
                        <PushPin size={9} weight="fill" />
                        Fijo
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--muted)]">
                        {formatDate(tx.date)}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="text-sm font-mono font-semibold tabular-nums shrink-0"
                  style={{
                    color: isIncome ? "var(--income)" : "var(--expense)",
                  }}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
                {showDelete && !tx.isFixed && (
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[var(--expense-bg)] text-[var(--muted)] hover:text-[var(--expense)] transition-all duration-200 active:scale-[0.95]"
                    aria-label="Eliminar transaccion"
                  >
                    <Trash size={14} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
