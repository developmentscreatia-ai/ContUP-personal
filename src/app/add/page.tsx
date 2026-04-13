import AddTransactionForm from "@/components/AddTransactionForm";

export default function AddPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] mb-1">
          Registrar movimiento
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter leading-none text-[var(--foreground)]">
          Nueva transaccion
        </h1>
      </div>
      <AddTransactionForm />
    </div>
  );
}
