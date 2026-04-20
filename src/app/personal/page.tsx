"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendUp,
  TrendDown,
  Scales,
  Receipt,
  Plus,
  X,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  PiggyBank,
  CaretDown,
  CaretUp,
  Trash,
  ToggleLeft,
  ToggleRight,
  Repeat,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import StatCard from "@/components/StatCard";
import ExpenseChart from "@/components/ExpenseChart";
import {
  getPersonalMonthlyStats,
  getPersonalMonthTransactions,
  savePersonalTransaction,
  deletePersonalTransaction,
  formatCurrency,
  formatDate,
  generateId,
  getPersonalTotalBalance,
  getPersonalMonthlySavings,
  getPersonalInitialBalance,
  setPersonalInitialBalance,
  getPersonalTransactions,
  MonthlySavingsEntry,
  getFixedItems,
  addFixedItem,
  deleteFixedItem,
  toggleFixedItem,
} from "@/lib/storage";
import {
  Transaction,
  MonthlyStats,
  TransactionType,
  Category,
  CATEGORY_CONFIG,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  FixedItem,
} from "@/lib/types";
import Link from "next/link";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MONTHS_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// ─── Formulario movimiento manual ───────────────────────────────────────────

function PersonalTransactionForm({ onSaved }: { onSaved: () => void }) {
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

    savePersonalTransaction({
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
      setSaved(false);
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().slice(0, 10));
      onSaved();
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
                  transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]
                  ${type === t
                    ? t === "expense" ? "bg-[var(--expense)] text-white" : "bg-[var(--income)] text-white"
                    : "bg-white text-[var(--muted)] hover:text-[var(--foreground)]"
                  }
                `}
              >
                {t === "expense" ? <ArrowDownLeft size={16} weight="bold" /> : <ArrowUpRight size={16} weight="bold" />}
                {t === "expense" ? "Gasto" : "Ingreso"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
          Cantidad
        </label>
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] flex items-center px-5">
            <span className="text-2xl font-mono font-semibold text-[var(--muted)] mr-2">&euro;</span>
            <input
              type="number" step="0.01" min="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" required
              className="flex-1 py-4 text-2xl md:text-3xl font-mono font-semibold tracking-tighter bg-transparent outline-none placeholder:text-black/10"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
          Categoria
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const isActive = category === cat;
            return (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${isActive ? "ring-2 ring-offset-1" : "hover:ring-1 hover:ring-black/10"}`}
                style={{ backgroundColor: config.bgColor, color: config.color }}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
          Descripcion
        </label>
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Supermercado Mercadona"
            className="w-full rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] px-5 py-3.5 text-sm outline-none placeholder:text-black/20"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
          Fecha
        </label>
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] px-5 py-3.5 text-sm outline-none"
          />
        </div>
      </div>
      <motion.button type="submit" disabled={saved} whileTap={{ scale: 0.98 }}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-full text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${saved ? "bg-[var(--income)] text-white" : "bg-[var(--foreground)] text-white hover:bg-[#444] active:scale-[0.98]"}`}
      >
        {saved ? <><Check size={18} weight="bold" />Guardado</> : "Guardar movimiento"}
      </motion.button>
    </motion.form>
  );
}

// ─── Formulario fijo ─────────────────────────────────────────────────────────

function FixedItemForm({ onSaved }: { onSaved: () => void }) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("housing");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

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
      setAmount("");
      setDescription("");
      setCategory(type === "income" ? "salary" : "housing");
      onSaved();
    }, 500);
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-5"
    >
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
          Tipo
        </label>
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <div className="grid grid-cols-2 gap-2">
            {(["expense", "income"] as TransactionType[]).map((t) => (
              <button key={t} type="button"
                onClick={() => { setType(t); setCategory(t === "income" ? "salary" : "housing"); }}
                className={`flex items-center justify-center gap-2 py-3 rounded-[calc(1.25rem-0.375rem)] text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${type === t ? (t === "expense" ? "bg-[var(--expense)] text-white" : "bg-[var(--income)] text-white") : "bg-white text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                {t === "expense" ? <ArrowDownLeft size={16} weight="bold" /> : <ArrowUpRight size={16} weight="bold" />}
                {t === "expense" ? "Gasto fijo" : "Ingreso fijo"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
          Cantidad mensual
        </label>
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] flex items-center px-5">
            <span className="text-2xl font-mono font-semibold text-[var(--muted)] mr-2">&euro;</span>
            <input type="number" step="0.01" min="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" required
              className="flex-1 py-4 text-2xl md:text-3xl font-mono font-semibold tracking-tighter bg-transparent outline-none placeholder:text-black/10"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
          Categoria
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const isActive = category === cat;
            return (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${isActive ? "ring-2 ring-offset-1" : "hover:ring-1 hover:ring-black/10"}`}
                style={{ backgroundColor: config.bgColor, color: config.color }}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
          Descripcion
        </label>
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Alquiler, Netflix, Nomina..."
            className="w-full rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] px-5 py-3.5 text-sm outline-none placeholder:text-black/20"
          />
        </div>
      </div>
      <motion.button type="submit" disabled={saved} whileTap={{ scale: 0.98 }}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-full text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${saved ? "bg-[var(--income)] text-white" : "bg-[var(--foreground)] text-white hover:bg-[#444] active:scale-[0.98]"}`}
      >
        {saved ? <><Check size={18} weight="bold" />Guardado</> : "Guardar fijo"}
      </motion.button>
    </motion.form>
  );
}

// ─── Lista de movimientos manuales ───────────────────────────────────────────

function PersonalTransactionList({ transactions, onDelete, limit }: { transactions: Transaction[]; onDelete?: () => void; limit?: number }) {
  const items = limit ? transactions.slice(0, limit) : transactions;

  if (items.length === 0) {
    return (
      <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
        <div className="rounded-[calc(1.25rem-0.375rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] text-center">
          <p className="text-[var(--muted)] text-sm">Sin movimientos todavia</p>
          <p className="text-[var(--muted)] text-xs mt-1">Tus movimientos apareceran aqui</p>
        </div>
      </div>
    );
  }

  function handleDelete(id: string) {
    deletePersonalTransaction(id);
    onDelete?.();
  }

  return (
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
              transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: [0.32, 0.72, 0, 1] }}
              className="group flex items-center gap-4 px-5 py-4 hover:bg-black/[0.015] transition-colors duration-200"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: isIncome ? "var(--income-bg)" : "var(--expense-bg)", color: isIncome ? "var(--income)" : "var(--expense)" }}
              >
                {isIncome ? <ArrowUpRight size={16} weight="bold" /> : <ArrowDownLeft size={16} weight="bold" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">{tx.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-block rounded-full px-2 py-px text-[9px] uppercase tracking-[0.1em] font-medium"
                    style={{ backgroundColor: config?.bgColor || "#F0F0EE", color: config?.color || "#787774" }}
                  >
                    {config?.label || tx.category}
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">{formatDate(tx.date)}</span>
                </div>
              </div>
              <span className="text-sm font-mono font-semibold tabular-nums shrink-0"
                style={{ color: isIncome ? "var(--income)" : "var(--expense)" }}
              >
                {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
              </span>
              <button onClick={() => handleDelete(tx.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[var(--expense-bg)] text-[var(--muted)] hover:text-[var(--expense)] transition-all duration-200 active:scale-[0.95]"
                aria-label="Eliminar"
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
  );
}

// ─── Ahorro por mes ──────────────────────────────────────────────────────────

function MonthlySavingsSection({ entries }: { entries: MonthlySavingsEntry[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, 3);

  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-3"
    >
      <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
        Ahorro por mes
      </h2>
      <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
        <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] divide-y divide-[var(--border)]">
          {visible.map((entry, i) => {
            const isPositive = entry.savings >= 0;
            return (
              <motion.div
                key={`${entry.year}-${entry.month}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: [0.32, 0.72, 0, 1] }}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold"
                  style={{ backgroundColor: isPositive ? "var(--income-bg)" : "var(--expense-bg)", color: isPositive ? "var(--income)" : "var(--expense)" }}
                >
                  {MONTHS_SHORT[entry.month]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {MONTHS[entry.month]} {entry.year}
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">
                    +{formatCurrency(entry.income)} / -{formatCurrency(entry.expenses)}
                  </p>
                </div>
                <span className="text-sm font-mono font-semibold tabular-nums"
                  style={{ color: isPositive ? "var(--income)" : "var(--expense)" }}
                >
                  {isPositive ? "+" : ""}{formatCurrency(entry.savings)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
      {entries.length > 3 && (
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-200 mx-auto"
        >
          {expanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
          {expanded ? "Ver menos" : `Ver ${entries.length - 3} meses más`}
        </button>
      )}
    </motion.div>
  );
}

// ─── Modal editar saldo ──────────────────────────────────────────────────────

function EditBalanceModal({ currentTotal, onSave, onClose }: { currentTotal: number; onSave: (v: number) => void; onClose: () => void }) {
  const [value, setValue] = useState(currentTotal.toFixed(2));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) { onSave(parsed); onClose(); }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-sm rounded-[1.5rem] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold tracking-tight mb-1">Actualizar saldo actual</h3>
        <p className="text-xs text-[var(--muted)] mb-5">
          Introduce tu saldo real ahora mismo. El sistema se ajustara a partir de este punto.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
            <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] flex items-center px-5">
              <span className="text-2xl font-mono font-semibold text-[var(--muted)] mr-2">&euro;</span>
              <input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)}
                className="flex-1 py-4 text-2xl font-mono font-semibold tracking-tighter bg-transparent outline-none" autoFocus
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-full text-sm font-medium bg-black/[0.04] text-[var(--foreground)] hover:bg-black/[0.08] transition-colors duration-200"
            >
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-3 rounded-full text-sm font-semibold bg-[var(--foreground)] text-white hover:bg-[#444] transition-colors duration-200"
            >
              Guardar
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function PersonalPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedItems, setFixedItems] = useState<FixedItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showFixedForm, setShowFixedForm] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [netSavings, setNetSavings] = useState(0);
  const [monthlySavings, setMonthlySavings] = useState<MonthlySavingsEntry[]>([]);
  const [showEditBalance, setShowEditBalance] = useState(false);

  const refresh = useCallback(() => {
    setStats(getPersonalMonthlyStats(year, month));
    setTransactions(getPersonalMonthTransactions(year, month));
    setTotalBalance(getPersonalTotalBalance());
    setMonthlySavings(getPersonalMonthlySavings());
    setFixedItems(getFixedItems());

    // Ahorro neto = suma ingresos manuales - suma gastos manuales
    const allTx = getPersonalTransactions();
    const net = allTx.reduce((sum, t) => t.type === "income" ? sum + t.amount : sum - t.amount, 0);
    setNetSavings(net);
  }, [year, month]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("contup_personal_initial_balance");
      if (existing === null) {
        const txs = getPersonalTransactions();
        const txBalance = txs.reduce((sum, t) => t.type === "income" ? sum + t.amount : sum - t.amount, 0);
        setPersonalInitialBalance(1884.84 - txBalance);
      }
    }
    refresh();
  }, [refresh]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  function handleSaveInitialBalance(desiredTotal: number) {
    const txs = getPersonalTransactions();
    const txBalance = txs.reduce((sum, t) => t.type === "income" ? sum + t.amount : sum - t.amount, 0);
    setPersonalInitialBalance(desiredTotal - txBalance);
    refresh();
  }

  const fixedIncome = fixedItems.filter((i) => i.type === "income" && i.active).reduce((s, i) => s + i.amount, 0);
  const fixedExpenses = fixedItems.filter((i) => i.type === "expense" && i.active).reduce((s, i) => s + i.amount, 0);

  if (!stats) return null;

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-1">
            Finanzas personales
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter leading-none text-[var(--foreground)]">
            Personal
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth}
            className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95]"
          >
            <span className="text-sm">&larr;</span>
          </button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth}
            className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95]"
          >
            <span className="text-sm">&rarr;</span>
          </button>
        </div>
      </div>

      {/* ── Saldo + Ahorro ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {/* Saldo disponible */}
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5 flex items-center justify-between gap-4 h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: totalBalance >= 0 ? "var(--income-bg)" : "var(--expense-bg)", color: totalBalance >= 0 ? "var(--income)" : "var(--expense)" }}
              >
                <Wallet size={20} weight="bold" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
                  Saldo disponible
                </p>
                <p className="text-2xl font-mono font-semibold tracking-tighter"
                  style={{ color: totalBalance >= 0 ? "var(--income)" : "var(--expense)" }}
                >
                  {formatCurrency(totalBalance)}
                </p>
              </div>
            </div>
            <button onClick={() => setShowEditBalance(true)}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-full px-3 py-1.5 transition-colors duration-200 shrink-0"
            >
              Editar
            </button>
          </div>
        </div>

        {/* Ahorro acumulado */}
        <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
          <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5 flex items-center gap-3 h-full">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: netSavings >= 0 ? "var(--income-bg)" : "var(--expense-bg)", color: netSavings >= 0 ? "var(--income)" : "var(--expense)" }}
            >
              <PiggyBank size={20} weight="bold" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
                Ahorro acumulado
              </p>
              <p className="text-2xl font-mono font-semibold tracking-tighter"
                style={{ color: netSavings >= 0 ? "var(--income)" : "var(--expense)" }}
              >
                {netSavings >= 0 ? "+" : ""}{formatCurrency(netSavings)}
              </p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">
                Neto de movimientos manuales
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats del mes ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="Balance del mes"
          value={formatCurrency(stats.balance)}
          icon={<Scales size={18} weight="bold" />}
          accent={stats.balance >= 0 ? "var(--income)" : "var(--expense)"}
          accentBg={stats.balance >= 0 ? "var(--income-bg)" : "var(--expense-bg)"}
          delay={0}
        />
        <StatCard
          label="Ingresos del mes"
          value={formatCurrency(stats.totalIncome)}
          icon={<TrendUp size={18} weight="bold" />}
          accent="var(--income)"
          accentBg="var(--income-bg)"
          delay={0.08}
        />
        <StatCard
          label="Gastos del mes"
          value={formatCurrency(stats.totalExpenses)}
          icon={<TrendDown size={18} weight="bold" />}
          accent="var(--expense)"
          accentBg="var(--expense-bg)"
          delay={0.16}
        />
      </div>

      {/* ── Ahorro este mes ── */}
      {(() => {
        const monthlySaved = fixedIncome - fixedExpenses + stats.totalIncome - stats.totalExpenses;
        const isPositive = monthlySaved >= 0;
        return (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.32, 0.72, 0, 1] }}
            className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5"
          >
            <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Icono + título + total */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: isPositive ? "var(--income-bg)" : "var(--expense-bg)",
                      color: isPositive ? "var(--income)" : "var(--expense)",
                    }}
                  >
                    <PiggyBank size={20} weight="bold" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
                      Lo que llevas ahorrado este mes
                    </p>
                    <p
                      className="text-2xl font-mono font-semibold tracking-tighter"
                      style={{ color: isPositive ? "var(--income)" : "var(--expense)" }}
                    >
                      {isPositive ? "+" : ""}{formatCurrency(monthlySaved)}
                    </p>
                  </div>
                </div>
                {/* Desglose */}
                <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
                  <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--income-bg)] text-[var(--income)] font-medium">
                    <TrendUp size={12} weight="bold" />
                    +{formatCurrency(fixedIncome)}
                    <span className="font-sans font-normal text-[10px] opacity-70 ml-0.5">fijos</span>
                  </span>
                  <span className="text-[var(--muted)]">−</span>
                  <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--expense-bg)] text-[var(--expense)] font-medium">
                    <TrendDown size={12} weight="bold" />
                    {formatCurrency(fixedExpenses)}
                    <span className="font-sans font-normal text-[10px] opacity-70 ml-0.5">fijos</span>
                  </span>
                  {stats.totalExpenses > 0 && (
                    <>
                      <span className="text-[var(--muted)]">−</span>
                      <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--expense-bg)] text-[var(--expense)] font-medium">
                        <TrendDown size={12} weight="bold" />
                        {formatCurrency(stats.totalExpenses)}
                        <span className="font-sans font-normal text-[10px] opacity-70 ml-0.5">gastos</span>
                      </span>
                    </>
                  )}
                  {stats.totalIncome > 0 && (
                    <>
                      <span className="text-[var(--muted)]">+</span>
                      <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--income-bg)] text-[var(--income)] font-medium">
                        <TrendUp size={12} weight="bold" />
                        {formatCurrency(stats.totalIncome)}
                        <span className="font-sans font-normal text-[10px] opacity-70 ml-0.5">extras</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* ════════════════════════════════════════════════
          SECCIÓN 1: FIJOS MENSUALES
      ════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
        className="space-y-4"
      >
        {/* Cabecera sección fijos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
              <Repeat size={13} weight="bold" className="text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--foreground)]">
                Fijos mensuales
              </h2>
              <p className="text-[10px] text-[var(--muted)]">Ya aplicados en tu saldo actual</p>
            </div>
          </div>
          <button
            onClick={() => setShowFixedForm(!showFixedForm)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${showFixedForm ? "bg-black/[0.06] text-[var(--foreground)]" : "bg-[var(--foreground)] text-white hover:bg-[#444]"}`}
          >
            {showFixedForm ? <X size={13} weight="bold" /> : <Plus size={13} weight="bold" />}
            {showFixedForm ? "Cancelar" : "Nuevo fijo"}
          </button>
        </div>

        {/* Resumen fijos */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[1rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1">
            <div className="rounded-[calc(1rem-0.25rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-3 text-center">
              <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[var(--muted)] mb-1">Ingresos fijos</p>
              <p className="text-sm font-mono font-semibold text-[var(--income)]">+{formatCurrency(fixedIncome)}</p>
            </div>
          </div>
          <div className="rounded-[1rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1">
            <div className="rounded-[calc(1rem-0.25rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-3 text-center">
              <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[var(--muted)] mb-1">Gastos fijos</p>
              <p className="text-sm font-mono font-semibold text-[var(--expense)]">-{formatCurrency(fixedExpenses)}</p>
            </div>
          </div>
          <div className="rounded-[1rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1">
            <div className="rounded-[calc(1rem-0.25rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-3 text-center">
              <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[var(--muted)] mb-1">Neto fijos</p>
              <p className="text-sm font-mono font-semibold"
                style={{ color: fixedIncome - fixedExpenses >= 0 ? "var(--income)" : "var(--expense)" }}
              >
                {fixedIncome - fixedExpenses >= 0 ? "+" : ""}{formatCurrency(fixedIncome - fixedExpenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario nuevo fijo */}
        {showFixedForm && (
          <div className="p-5 rounded-[1.5rem] bg-white/60 backdrop-blur-xl border border-[var(--border)]">
            <FixedItemForm onSaved={() => { refresh(); setShowFixedForm(false); }} />
          </div>
        )}

        {/* Lista de fijos */}
        {fixedItems.length === 0 ? (
          <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
            <div className="rounded-[calc(1.25rem-0.375rem)] bg-white p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] text-center">
              <p className="text-[var(--muted)] text-sm">Sin fijos configurados</p>
              <p className="text-[var(--muted)] text-xs mt-1">Agrega tus recurrentes mensuales</p>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
            <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] divide-y divide-[var(--border)]">
              {fixedItems.map((item, i) => {
                const config = CATEGORY_CONFIG[item.category];
                const isIncome = item.type === "income";
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: [0.32, 0.72, 0, 1] }}
                    className={`group flex items-center gap-4 px-5 py-4 hover:bg-black/[0.015] transition-all duration-200 ${!item.active ? "opacity-40" : ""}`}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isIncome ? "var(--income-bg)" : "var(--expense-bg)", color: isIncome ? "var(--income)" : "var(--expense)" }}
                    >
                      {isIncome ? <ArrowUpRight size={16} weight="bold" /> : <ArrowDownLeft size={16} weight="bold" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-block rounded-full px-2 py-px text-[9px] uppercase tracking-[0.1em] font-medium"
                          style={{ backgroundColor: config?.bgColor || "#F0F0EE", color: config?.color || "#787774" }}
                        >
                          {config?.label || item.category}
                        </span>
                        <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider">Mensual</span>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-semibold tabular-nums shrink-0"
                      style={{ color: isIncome ? "var(--income)" : "var(--expense)" }}
                    >
                      {isIncome ? "+" : "-"}{formatCurrency(item.amount)}
                    </span>
                    <button onClick={() => { toggleFixedItem(item.id); refresh(); }}
                      className="p-1.5 rounded-lg hover:bg-black/[0.04] text-[var(--muted)] transition-all duration-200 active:scale-[0.95]"
                      aria-label={item.active ? "Desactivar" : "Activar"}
                    >
                      {item.active
                        ? <ToggleRight size={20} weight="fill" className="text-[var(--accent)]" />
                        : <ToggleLeft size={20} weight="regular" />
                      }
                    </button>
                    <button onClick={() => { deleteFixedItem(item.id); refresh(); }}
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
        )}
      </motion.div>

      {/* ════════════════════════════════════════════════
          SECCIÓN 2: MOVIMIENTOS MANUALES
      ════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
        className="space-y-4"
      >
        {/* Cabecera sección movimientos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[var(--foreground)]/[0.06] flex items-center justify-center">
              <Receipt size={13} weight="bold" className="text-[var(--foreground)]" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--foreground)]">
                Movimientos manuales
              </h2>
              <p className="text-[10px] text-[var(--muted)]">Actualizan tu saldo disponible</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/personal/historial"
              className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-200 border border-[var(--border)] rounded-full px-3 py-1.5"
            >
              Ver todo
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${showForm ? "bg-black/[0.06] text-[var(--foreground)]" : "bg-[var(--foreground)] text-white hover:bg-[#444]"}`}
            >
              {showForm ? <X size={13} weight="bold" /> : <Plus size={13} weight="bold" />}
              {showForm ? "Cancelar" : "Nuevo movimiento"}
            </button>
          </div>
        </div>

        {/* Formulario nuevo movimiento */}
        {showForm && (
          <div className="p-5 rounded-[1.5rem] bg-white/60 backdrop-blur-xl border border-[var(--border)]">
            <PersonalTransactionForm onSaved={() => { refresh(); setShowForm(false); }} />
          </div>
        )}

        {/* Lista movimientos + gráfico */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <ExpenseChart categoryBreakdown={stats.categoryBreakdown} />
          </div>
          <div className="md:col-span-3">
            <PersonalTransactionList
              transactions={transactions}
              limit={6}
              onDelete={refresh}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Ahorro por mes ── */}
      <MonthlySavingsSection entries={monthlySavings} />

      {/* ── Modal editar saldo ── */}
      <AnimatePresence>
        {showEditBalance && (
          <EditBalanceModal
            currentTotal={totalBalance}
            onSave={handleSaveInitialBalance}
            onClose={() => setShowEditBalance(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
