"use client";

import { motion } from "framer-motion";
import { CATEGORY_CONFIG, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/storage";

interface ExpenseChartProps {
  categoryBreakdown: Record<string, number>;
}

export default function ExpenseChart({ categoryBreakdown }: ExpenseChartProps) {
  const entries = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const total = entries.reduce((sum, [, val]) => sum + val, 0);

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <div className="rounded-[calc(1.25rem-0.375rem)] bg-white p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
            <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-6">
              Gastos por categoria
            </h3>
            <div className="flex flex-col items-center justify-center py-12 text-[var(--muted)]">
              <p className="text-sm">Sin gastos este mes</p>
              <p className="text-xs mt-1">Registra tu primer gasto para ver el desglose</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
        <div className="rounded-[calc(1.25rem-0.375rem)] bg-white p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
          <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-6">
            Gastos por categoria
          </h3>
          <div className="space-y-4">
            {entries.map(([cat, amount], i) => {
              const config = CATEGORY_CONFIG[cat as Category];
              const pct = total > 0 ? (amount / total) * 100 : 0;
              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.4 + i * 0.08,
                    ease: [0.32, 0.72, 0, 1],
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] font-medium"
                        style={{
                          backgroundColor: config?.bgColor || "#F0F0EE",
                          color: config?.color || "#787774",
                        }}
                      >
                        {config?.label || cat}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-medium text-[var(--foreground)]">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/[0.04] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: config?.color || "#787774" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        duration: 0.8,
                        delay: 0.5 + i * 0.08,
                        ease: [0.32, 0.72, 0, 1],
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
