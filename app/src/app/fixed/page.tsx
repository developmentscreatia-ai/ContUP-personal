"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Trash,
  ToggleLeft,
  ToggleRight,
  Check,
} from "@phosphor-icons/react";
import {
  TransactionType,
  Category,
  FixedItem,
  CATEGORY_CONFIG,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "@/lib/types";
import {
  getFixedItems,
  addFixedItem,
  deleteFixedItem,
  toggleFixedItem,
  generateId,
  formatCurrency,
  getPersonalTotalBalance,
} from "@/lib/storage";

export default function FixedPage() {
  const [items, setItems] = useState<FixedItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [personalBalance, setPersonalBalance] = useState(0);

  // Form state
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("housing");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const refresh = useCallback(() => {
    setItems(getFixedItems());
    setPersonalBalance(getPersonalTotalBalance());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;

    addFixedItem({
      id: generateId(),
      type,
      amount: parsed,
      category,
      description: description || CATEGORY_CONFIG[category].label,
      active: true,
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowForm(false);
      setAmount("");
      setDescription("");
      setCategory(type === "income" ? "salary" : "housing");
      refresh();
    }, 500);
  }

  function handleDelete(id: string) {
    deleteFixedItem(id);
    refresh();
  }

  function handleToggle(id: string) {
    toggleFixedItem(id);
    refresh();
  }

  const fixedIncome = items
    .filter((i) => i.type === "income" && i.active)
    .reduce((s, i) => s + i.amount, 0);
  const fixedExpenses = items
    .filter((i) => i.type === "expense" && i.active)
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="flex items-end justify-between"
      >
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-1">
            Recurrentes cada mes
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter leading-none text-[var(--foreground)]">
            Fijos
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
            transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]
            ${
              showForm
                ? "bg-black/[0.04] text-[var(--muted)]"
                : "bg-[var(--foreground)] text-white"
            }
          `}
        >
          <Plus
            size={16}
            weight="bold"
            className={`transition-transform duration-300 ${showForm ? "rotate-45" : ""}`}
          />
          {showForm ? "Cancelar" : "Nuevo fijo"}
        </button>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08, ease: [0.32, 0.72, 0, 1] }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
            <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5">
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)] mb-1">
                Ingresos fijos
              </p>
              <p className="text-xl font-mono font-semibold tracking-tighter text-[var(--income)]">
                +{formatCurrency(fixedIncome)}
              </p>
            </div>
          </div>
          <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
            <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5">
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)] mb-1">
                Gastos fijos
              </p>
              <p className="text-xl font-mono font-semibold tracking-tighter text-[var(--expense)]">
                -{formatCurrency(fixedExpenses)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Margen mensual fijos
            </p>
            <p
              className="text-xl font-mono font-semibold tracking-tighter"
              style={{
                color:
                  fixedIncome - fixedExpenses >= 0
                    ? "var(--income)"
                    : "var(--expense)",
              }}
            >
              {fixedIncome - fixedExpenses >= 0 ? "+" : ""}
              {formatCurrency(fixedIncome - fixedExpenses)}
            </p>
          </div>
        </div>
        {personalBalance !== 0 && (
          <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
            <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
                  Saldo personal tras fijos
                </p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5 opacity-70">
                  Saldo disponible − gastos fijos + ingresos fijos
                </p>
              </div>
              <p
                className="text-xl font-mono font-semibold tracking-tighter"
                style={{
                  color:
                    personalBalance + fixedIncome - fixedExpenses >= 0
                      ? "var(--income)"
                      : "var(--expense)",
                }}
              >
                {formatCurrency(personalBalance + fixedIncome - fixedExpenses)}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add Form */}
      {showForm && (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="space-y-5"
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
                      setCategory(t === "income" ? "salary" : "housing");
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
                    {t === "expense" ? "Gasto fijo" : "Ingreso fijo"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
              Cantidad mensual
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
                placeholder="Ej: Alquiler, Netflix, Nomina..."
                className="w-full rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] px-5 py-3.5 text-sm outline-none placeholder:text-black/20"
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
              "Guardar fijo"
            )}
          </motion.button>
        </motion.form>
      )}

      {/* List */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
          Tus fijos mensuales
        </h2>
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
              <div className="rounded-[calc(1.25rem-0.375rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] text-center">
                <p className="text-[var(--muted)] text-sm">
                  Sin gastos o ingresos fijos
                </p>
                <p className="text-[var(--muted)] text-xs mt-1">
                  Anade tus recurrentes mensuales aqui
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
              <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] divide-y divide-[var(--border)]">
                {items.map((item, i) => {
                  const config = CATEGORY_CONFIG[item.category];
                  const isIncome = item.type === "income";
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.3 + i * 0.06,
                        ease: [0.32, 0.72, 0, 1],
                      }}
                      className={`group flex items-center gap-4 px-5 py-4 hover:bg-black/[0.015] transition-all duration-200 ${
                        !item.active ? "opacity-40" : ""
                      }`}
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
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="inline-block rounded-full px-2 py-px text-[9px] uppercase tracking-[0.1em] font-medium"
                            style={{
                              backgroundColor: config?.bgColor || "#F0F0EE",
                              color: config?.color || "#787774",
                            }}
                          >
                            {config?.label || item.category}
                          </span>
                          <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider">
                            Mensual
                          </span>
                        </div>
                      </div>
                      <span
                        className="text-sm font-mono font-semibold tabular-nums shrink-0"
                        style={{
                          color: isIncome ? "var(--income)" : "var(--expense)",
                        }}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(item.amount)}
                      </span>
                      <button
                        onClick={() => handleToggle(item.id)}
                        className="p-1.5 rounded-lg hover:bg-black/[0.04] text-[var(--muted)] transition-all duration-200 active:scale-[0.95]"
                        aria-label={item.active ? "Desactivar" : "Activar"}
                      >
                        {item.active ? (
                          <ToggleRight size={20} weight="fill" className="text-[var(--accent)]" />
                        ) : (
                          <ToggleLeft size={20} weight="regular" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[var(--expense-bg)] text-[var(--muted)] hover:text-[var(--expense)] transition-all duration-200 active:scale-[0.95]"
                        aria-label="Eliminar"
                      >
                        <Trash size={14} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
