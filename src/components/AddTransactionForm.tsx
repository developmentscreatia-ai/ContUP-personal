"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Check,
} from "@phosphor-icons/react";
import {
  TransactionType,
  Category,
  CATEGORY_CONFIG,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "@/lib/types";
import { saveTransaction, generateId } from "@/lib/storage";

export default function AddTransactionForm() {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saved, setSaved] = useState(false);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;

    saveTransaction({
      id: generateId(),
      type,
      amount: parsed,
      category,
      description: description || CATEGORY_CONFIG[category].label,
      date: new Date(date).toISOString(),
      createdAt: new Date().toISOString(),
    });

    setSaved(true);
    setTimeout(() => {
      router.push("/");
    }, 600);
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-6"
    >
      {/* Type Toggle */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
          Tipo
        </label>
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <div className="grid grid-cols-2 gap-2">
            {(["expense", "income"] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategory(t === "income" ? "salary" : "food");
                }}
                className={`
                  flex items-center justify-center gap-2 py-3 rounded-[calc(1.25rem-0.375rem)] text-sm font-medium
                  transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                  active:scale-[0.98]
                  ${
                    type === t
                      ? t === "expense"
                        ? "bg-[var(--expense)] text-white"
                        : "bg-[var(--income)] text-white"
                      : "bg-white text-[var(--muted)] hover:text-[var(--foreground)]"
                  }
                `}
              >
                {t === "expense" ? (
                  <ArrowDownLeft size={16} weight="bold" />
                ) : (
                  <ArrowUpRight size={16} weight="bold" />
                )}
                {t === "expense" ? "Gasto" : "Ingreso"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
          Cantidad
        </label>
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] flex items-center px-5">
            <span className="text-2xl font-mono font-semibold text-[var(--muted)] mr-2">
              &euro;
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="flex-1 py-4 text-2xl md:text-3xl font-mono font-semibold tracking-tighter bg-transparent outline-none placeholder:text-black/10"
            />
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
          Categoria
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const isActive = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`
                  rounded-full px-3.5 py-1.5 text-xs font-medium
                  transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]
                  active:scale-[0.96]
                  ${
                    isActive
                      ? "ring-2 ring-offset-1"
                      : "hover:ring-1 hover:ring-black/10"
                  }
                `}
                style={{
                  backgroundColor: config.bgColor,
                  color: config.color,
                  ...(isActive ? { ringColor: config.color } : {}),
                }}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
          Descripcion
        </label>
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Supermercado Mercadona"
            className="w-full rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] px-5 py-3.5 text-sm outline-none placeholder:text-black/20"
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
          Fecha
        </label>
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] px-5 py-3.5 text-sm outline-none"
          />
        </div>
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={saved}
        whileTap={{ scale: 0.98 }}
        className={`
          w-full flex items-center justify-center gap-2 py-4 rounded-full text-sm font-semibold
          transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${
            saved
              ? "bg-[var(--income)] text-white"
              : "bg-[var(--foreground)] text-white hover:bg-[#444] active:scale-[0.98]"
          }
        `}
      >
        {saved ? (
          <>
            <Check size={18} weight="bold" />
            Guardado
          </>
        ) : (
          "Guardar transaccion"
        )}
      </motion.button>
    </motion.form>
  );
}
