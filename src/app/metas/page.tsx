"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  CalendarBlank,
  PiggyBank,
  Trash,
  Check,
  Plus,
  ArrowRight,
  Pencil,
} from "@phosphor-icons/react";
import { SavingsGoal } from "@/lib/types";
import {
  getSavingsGoals,
  addSavingsGoal,
  deleteSavingsGoal,
  updateSavingsGoalProgress,
  generateId,
  formatCurrency,
} from "@/lib/storage";

type CalcMode = "time" | "monthly";

function monthsToLabel(months: number): string {
  if (months < 1) return "menos de 1 mes";
  const y = Math.floor(months / 12);
  const m = Math.round(months % 12);
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} año${y !== 1 ? "s" : ""}`);
  if (m > 0) parts.push(`${m} mes${m !== 1 ? "es" : ""}`);
  return parts.join(" y ");
}

function addMonthsToNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil(months));
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function monthsBetween(targetDate: string): number {
  const now = new Date();
  // targetDate is "YYYY-MM"
  const [y, m] = targetDate.split("-").map(Number);
  const diff = (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
  return Math.max(1, diff);
}

export default function MetasPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [mode, setMode] = useState<CalcMode>("time");
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlySavings, setMonthlySavings] = useState("");
  const [targetMonth, setTargetMonth] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [alreadySaved, setAlreadySaved] = useState("");

  // Edit progress overlay
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const refresh = useCallback(() => setGoals(getSavingsGoals()), []);
  useEffect(() => { refresh(); }, [refresh]);

  // --- Derived calculations for the form preview ---
  const parsed = {
    target: parseFloat(targetAmount) || 0,
    monthly: parseFloat(monthlySavings) || 0,
    saved: parseFloat(alreadySaved) || 0,
  };

  const remaining = Math.max(0, parsed.target - parsed.saved);

  const calcMonths =
    mode === "time" && parsed.monthly > 0
      ? remaining / parsed.monthly
      : 0;

  const targetDate = targetMonth && targetYear ? `${targetYear}-${targetMonth}` : "";

  const calcMonthly =
    mode === "monthly" && targetDate
      ? remaining / monthsBetween(targetDate)
      : 0;

  const hasPreview =
    parsed.target > 0 &&
    ((mode === "time" && parsed.monthly > 0) ||
      (mode === "monthly" && targetDate !== ""));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed.target || parsed.target <= 0) return;
    const monthly =
      mode === "time"
        ? parsed.monthly
        : calcMonthly;
    if (!monthly || monthly <= 0) return;

    addSavingsGoal({
      id: generateId(),
      name: name || "Meta de ahorro",
      targetAmount: parsed.target,
      monthlySavings: monthly,
      savedAmount: parsed.saved,
      createdAt: new Date().toISOString(),
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowForm(false);
      setName("");
      setTargetAmount("");
      setMonthlySavings("");
      setTargetMonth("");
      setTargetYear("");
      setAlreadySaved("");
      setMode("time");
      refresh();
    }, 500);
  }

  function handleDelete(id: string) {
    deleteSavingsGoal(id);
    refresh();
  }

  function handleEditProgress(goal: SavingsGoal) {
    setEditingId(goal.id);
    setEditAmount(String(goal.savedAmount));
  }

  function handleSaveProgress(id: string) {
    const val = parseFloat(editAmount);
    if (!isNaN(val) && val >= 0) {
      updateSavingsGoalProgress(id, val);
      refresh();
    }
    setEditingId(null);
    setEditAmount("");
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const years = Array.from({ length: 11 }, (_, i) => currentYear + i);
  const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  // Filter months if selected year is current year
  const availableMonths = MONTHS.map((label, i) => ({
    label,
    value: String(i + 1).padStart(2, "0"),
    disabled: Number(targetYear) === currentYear && i + 1 <= currentMonth,
  }));

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
            Planifica tu ahorro
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter leading-none text-[var(--foreground)]">
            Metas
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
          {showForm ? "Cancelar" : "Nueva meta"}
        </button>
      </motion.div>

      {/* Calculator Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="space-y-5"
          >
            {/* Mode Toggle */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
                ¿Qué quieres calcular?
              </label>
              <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("time")}
                    className={`
                      flex items-center justify-center gap-2 py-3 rounded-[calc(1.25rem-0.375rem)] text-sm font-medium
                      transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]
                      ${mode === "time" ? "bg-[var(--foreground)] text-white" : "bg-white text-[var(--muted)] hover:text-[var(--foreground)]"}
                    `}
                  >
                    <CalendarBlank size={16} weight="bold" />
                    ¿Cuánto tiempo?
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("monthly")}
                    className={`
                      flex items-center justify-center gap-2 py-3 rounded-[calc(1.25rem-0.375rem)] text-sm font-medium
                      transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]
                      ${mode === "monthly" ? "bg-[var(--foreground)] text-white" : "bg-white text-[var(--muted)] hover:text-[var(--foreground)]"}
                    `}
                  >
                    <PiggyBank size={16} weight="bold" />
                    ¿Cuánto al mes?
                  </button>
                </div>
              </div>
            </div>

            {/* Goal Name */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
                ¿Para qué ahorras?
              </label>
              <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: iPhone, Viaje a Japón, Portátil nuevo..."
                  className="w-full rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] px-5 py-3.5 text-sm outline-none placeholder:text-black/20"
                />
              </div>
            </div>

            {/* Target Amount */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
                Precio objetivo
              </label>
              <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
                <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] flex items-center px-5">
                  <span className="text-2xl font-mono font-semibold text-[var(--muted)] mr-2">&euro;</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="flex-1 py-4 text-2xl md:text-3xl font-mono font-semibold tracking-tighter bg-transparent outline-none placeholder:text-black/10"
                  />
                </div>
              </div>
            </div>

            {/* Already saved */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
                Ya tengo ahorrado (opcional)
              </label>
              <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
                <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] flex items-center px-5">
                  <span className="text-xl font-mono font-semibold text-[var(--muted)] mr-2">&euro;</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={alreadySaved}
                    onChange={(e) => setAlreadySaved(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 py-3.5 text-xl font-mono font-semibold tracking-tighter bg-transparent outline-none placeholder:text-black/10"
                  />
                </div>
              </div>
            </div>

            {/* Conditional: Monthly savings OR target date */}
            <AnimatePresence mode="wait">
              {mode === "time" ? (
                <motion.div
                  key="monthly-input"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.25 }}
                >
                  <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
                    Ahorro mensual
                  </label>
                  <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
                    <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] flex items-center px-5">
                      <span className="text-xl font-mono font-semibold text-[var(--muted)] mr-2">&euro;</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={monthlySavings}
                        onChange={(e) => setMonthlySavings(e.target.value)}
                        placeholder="0.00"
                        required={mode === "time"}
                        className="flex-1 py-3.5 text-xl font-mono font-semibold tracking-tighter bg-transparent outline-none placeholder:text-black/10"
                      />
                      <span className="text-xs text-[var(--muted)] font-medium">/mes</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="date-input"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
                    Quiero tenerlo para...
                  </label>
                  <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
                    <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] grid grid-cols-2 divide-x divide-[var(--border)]">
                      <select
                        value={targetMonth}
                        onChange={(e) => setTargetMonth(e.target.value)}
                        required={mode === "monthly"}
                        className="bg-transparent px-5 py-3.5 text-sm font-medium outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Mes</option>
                        {availableMonths.map(({ label, value, disabled }) => (
                          <option key={value} value={value} disabled={disabled}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={targetYear}
                        onChange={(e) => {
                          setTargetYear(e.target.value);
                          // reset month if it becomes invalid
                          if (Number(e.target.value) === currentYear && Number(targetMonth) <= currentMonth) {
                            setTargetMonth("");
                          }
                        }}
                        required={mode === "monthly"}
                        className="bg-transparent px-5 py-3.5 text-sm font-medium outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Año</option>
                        {years.map((y) => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview Result */}
            <AnimatePresence>
              {hasPreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="rounded-[1.25rem] bg-[var(--foreground)] p-1.5"
                >
                  <div className="rounded-[calc(1.25rem-0.375rem)] bg-[var(--foreground)] p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      {mode === "time"
                        ? <CalendarBlank size={20} weight="bold" className="text-white" />
                        : <PiggyBank size={20} weight="bold" className="text-white" />
                      }
                    </div>
                    <div className="flex-1">
                      {mode === "time" ? (
                        <>
                          <p className="text-white/60 text-xs font-medium uppercase tracking-[0.12em] mb-0.5">
                            Lo conseguirás en
                          </p>
                          <p className="text-white text-lg font-semibold tracking-tight">
                            {monthsToLabel(calcMonths)}
                          </p>
                          <p className="text-white/50 text-xs mt-0.5">
                            Aprox. {addMonthsToNow(calcMonths)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-white/60 text-xs font-medium uppercase tracking-[0.12em] mb-0.5">
                            Necesitas ahorrar
                          </p>
                          <p className="text-white text-lg font-semibold tracking-tight font-mono">
                            {formatCurrency(calcMonthly)}<span className="text-white/50 text-sm font-normal">/mes</span>
                          </p>
                          <p className="text-white/50 text-xs mt-0.5">
                            Durante {monthsBetween(targetDate)} meses
                          </p>
                        </>
                      )}
                    </div>
                    <ArrowRight size={16} className="text-white/30 shrink-0" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                    : "bg-[var(--foreground)] text-white hover:bg-[#444]"
                }
              `}
            >
              {saved ? (
                <><Check size={18} weight="bold" /> Guardada</>
              ) : (
                "Guardar meta"
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Goals List */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
          Tus metas
        </h2>

        {goals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
              <div className="rounded-[calc(1.25rem-0.375rem)] bg-white p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] text-center">
                <Target size={32} className="text-[var(--muted)] mx-auto mb-3 opacity-30" />
                <p className="text-[var(--muted)] text-sm">Sin metas todavía</p>
                <p className="text-[var(--muted)] text-xs mt-1">
                  Crea una meta para planificar tu ahorro
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="space-y-3"
          >
            {goals.map((goal, i) => {
              const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
              const monthsLeft = goal.monthlySavings > 0 ? remaining / goal.monthlySavings : 0;
              const progress = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);
              const isComplete = goal.savedAmount >= goal.targetAmount;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease: [0.32, 0.72, 0, 1] }}
                >
                  <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5 group">
                    <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5 space-y-4">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isComplete ? "bg-[var(--income-bg)]" : "bg-black/[0.04]"}`}>
                            <Target size={18} weight="bold" className={isComplete ? "text-[var(--income)]" : "text-[var(--muted)]"} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                              {goal.name}
                            </p>
                            {isComplete ? (
                              <p className="text-xs text-[var(--income)] font-medium mt-0.5">¡Meta conseguida!</p>
                            ) : (
                              <p className="text-xs text-[var(--muted)] mt-0.5">
                                {formatCurrency(goal.monthlySavings)}/mes &middot; {monthsToLabel(monthsLeft)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditProgress(goal)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-black/[0.04] text-[var(--muted)] transition-all duration-200 active:scale-[0.95]"
                            aria-label="Actualizar progreso"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[var(--expense-bg)] text-[var(--muted)] hover:text-[var(--expense)] transition-all duration-200 active:scale-[0.95]"
                            aria-label="Eliminar"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="h-2 rounded-full bg-black/[0.05] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + i * 0.06, ease: [0.32, 0.72, 0, 1] }}
                            className={`h-full rounded-full ${isComplete ? "bg-[var(--income)]" : "bg-[var(--accent)]"}`}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-[var(--muted)]">
                            {formatCurrency(goal.savedAmount)} ahorrado
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-[var(--foreground)]">
                            {formatCurrency(goal.targetAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Edit progress inline */}
                      <AnimatePresence>
                        {editingId === goal.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-1 flex gap-2">
                              <div className="flex-1 rounded-[0.875rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1">
                                <div className="rounded-[calc(0.875rem-0.25rem)] bg-white flex items-center px-3">
                                  <span className="text-sm font-mono text-[var(--muted)] mr-1">&euro;</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    className="flex-1 py-2 text-sm font-mono font-semibold bg-transparent outline-none"
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => handleSaveProgress(goal.id)}
                                className="px-4 py-2 rounded-[0.875rem] bg-[var(--foreground)] text-white text-xs font-semibold active:scale-[0.97] transition-all"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-2 rounded-[0.875rem] bg-black/[0.04] text-[var(--muted)] text-xs font-semibold active:scale-[0.97] transition-all"
                              >
                                ✕
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
