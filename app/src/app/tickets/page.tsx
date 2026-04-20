"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Receipt,
  Trash,
  Plus,
  X,
  Check,
  ImageSquare,
  ArrowRight,
} from "@phosphor-icons/react";
import {
  Category,
  CATEGORY_CONFIG,
  EXPENSE_CATEGORIES,
  ScannedReceipt,
} from "@/lib/types";
import {
  addReceipt,
  deleteReceipt,
  getReceipts,
  markReceiptAsTransaction,
  saveTransaction,
  generateId,
  formatCurrency,
  formatDate,
} from "@/lib/storage";

export default function TicketsPage() {
  const [receipts, setReceipts] = useState<ScannedReceipt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("shopping");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saved, setSaved] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setReceipts(getReceipts());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const total = receipts.reduce((sum, r) => sum + r.amount, 0);

  async function startCamera() {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 1920 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setShowCamera(false);
      // Fallback to file input if camera not available
      fileInputRef.current?.click();
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    setCapturedImage(dataUrl);
    stopCamera();
    setShowForm(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // Compress the image
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL("image/jpeg", 0.7));
        setShowForm(true);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function resetForm() {
    setCapturedImage(null);
    setAmount("");
    setDescription("");
    setCategory("shopping");
    setDate(new Date().toISOString().slice(0, 10));
    setShowForm(false);
    setSaved(false);
  }

  function handleSave() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !capturedImage) return;

    addReceipt({
      id: generateId(),
      imageData: capturedImage,
      amount: parsed,
      description: description || "Ticket escaneado",
      category,
      date: new Date(date).toISOString(),
      createdAt: new Date().toISOString(),
      addedAsTransaction: false,
    });

    setSaved(true);
    setTimeout(() => {
      resetForm();
      refresh();
    }, 600);
  }

  function handleDelete(id: string) {
    deleteReceipt(id);
    refresh();
  }

  function handleAddAsTransaction(receipt: ScannedReceipt) {
    saveTransaction({
      id: generateId(),
      type: "expense",
      amount: receipt.amount,
      category: receipt.category,
      description: receipt.description,
      date: receipt.date,
      createdAt: new Date().toISOString(),
    });
    markReceiptAsTransaction(receipt.id);
    refresh();
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-1">
            Escanear tickets
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter leading-none text-[var(--foreground)]">
            Tickets
          </h1>
        </div>
      </div>

      {/* Total Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5"
      >
        <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-1">
                Total acumulado
              </p>
              <p className="text-2xl md:text-3xl font-semibold tracking-tighter font-mono text-[var(--expense)]">
                {formatCurrency(total)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--expense-bg)" }}>
              <Receipt size={20} weight="bold" style={{ color: "var(--expense)" }} />
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            {receipts.length} {receipts.length === 1 ? "ticket" : "tickets"} registrados
          </p>
        </div>
      </motion.div>

      {/* Camera / Upload Buttons */}
      {!showForm && !showCamera && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.32, 0.72, 0, 1] }}
          className="grid grid-cols-2 gap-3"
        >
          <button
            onClick={startCamera}
            className="flex flex-col items-center gap-3 rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-6 hover:ring-black/[0.08] transition-all duration-300 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-bg)] flex items-center justify-center">
              <Camera size={24} weight="bold" className="text-[var(--accent)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">Hacer foto</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">Usar camara</p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-3 rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-6 hover:ring-black/[0.08] transition-all duration-300 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-bg)] flex items-center justify-center">
              <ImageSquare size={24} weight="bold" className="text-[var(--accent)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">Subir imagen</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">Desde galeria</p>
            </div>
          </button>
        </motion.div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Camera View */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5"
          >
            <div className="rounded-[calc(1.25rem-0.375rem)] bg-black overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                <button
                  onClick={stopCamera}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <X size={20} weight="bold" />
                </button>
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
                >
                  <div className="w-14 h-14 rounded-full border-[3px] border-[var(--accent)]" />
                </button>
                <div className="w-12" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form after capture */}
      <AnimatePresence>
        {showForm && capturedImage && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="space-y-5"
          >
            {/* Preview */}
            <div className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5">
              <div className="rounded-[calc(1.25rem-0.375rem)] overflow-hidden relative">
                <img
                  src={capturedImage}
                  alt="Ticket capturado"
                  className="w-full max-h-[300px] object-cover"
                />
                <button
                  onClick={resetForm}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-2">
                Importe del ticket
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
                {EXPENSE_CATEGORIES.map((cat) => {
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
                  placeholder="Ej: Compra Mercadona"
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

            {/* Save Button */}
            <motion.button
              onClick={handleSave}
              disabled={saved || !amount}
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
                <>
                  <Receipt size={18} weight="bold" />
                  Guardar ticket
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipts List */}
      {receipts.length > 0 && !showForm && !showCamera && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)] mb-3">
            Tickets guardados
          </h2>
          <div className="space-y-2">
            {receipts.map((receipt, i) => {
              const config = CATEGORY_CONFIG[receipt.category];
              return (
                <motion.div
                  key={receipt.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="rounded-[1.25rem] bg-black/[0.02] ring-1 ring-black/[0.04] p-1.5"
                >
                  <div className="rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-4">
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-black/[0.03]">
                        <img
                          src={receipt.imageData}
                          alt="Ticket"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-[var(--foreground)] truncate">
                              {receipt.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: config.bgColor, color: config.color }}
                              >
                                {config.label}
                              </span>
                              <span className="text-[10px] text-[var(--muted)]">
                                {formatDate(receipt.date)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-semibold font-mono text-[var(--expense)] flex-shrink-0">
                            {formatCurrency(receipt.amount)}
                          </p>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          {!receipt.addedAsTransaction ? (
                            <button
                              onClick={() => handleAddAsTransaction(receipt)}
                              className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--accent)] hover:text-[var(--foreground)] transition-colors px-2.5 py-1.5 rounded-full bg-[var(--accent-bg)] hover:bg-black/[0.04]"
                            >
                              <ArrowRight size={10} weight="bold" />
                              Anadir como gasto
                            </button>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--income)] px-2.5 py-1.5 rounded-full bg-[var(--income-bg)]">
                              <Check size={10} weight="bold" />
                              Anadido
                            </span>
                          )}
                          <button
                            onClick={() => handleDelete(receipt.id)}
                            className="flex items-center gap-1 text-[10px] font-medium text-[var(--muted)] hover:text-[var(--expense)] transition-colors px-2.5 py-1.5 rounded-full hover:bg-[var(--expense-bg)]"
                          >
                            <Trash size={10} weight="bold" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {receipts.length === 0 && !showForm && !showCamera && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-black/[0.03] flex items-center justify-center mx-auto mb-4">
            <Receipt size={28} weight="light" className="text-[var(--muted)]" />
          </div>
          <p className="text-sm text-[var(--muted)]">
            Aun no hay tickets escaneados
          </p>
          <p className="text-xs text-[var(--muted)]/60 mt-1">
            Haz una foto a un ticket para empezar
          </p>
        </motion.div>
      )}
    </div>
  );
}
