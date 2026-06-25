import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, Check, X } from "lucide-react";

const BANKS = ["Chase", "Bank of America", "Wells Fargo", "Citi", "Capital One", "PNC", "Local Credit Union"];

export function PlaidLinkSimulator({ open, onClose, onLinked }: { open: boolean; onClose: () => void; onLinked: (bank: string) => void }) {
  const [phase, setPhase] = useState<"select" | "verifying" | "done">("select");
  const [bank, setBank] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setPhase("select"); setBank(null); }
  }, [open]);

  useEffect(() => {
    if (phase === "verifying") {
      const t = setTimeout(() => setPhase("done"), 1800);
      return () => clearTimeout(t);
    }
    if (phase === "done" && bank) {
      const t = setTimeout(() => { onLinked(bank); onClose(); }, 900);
      return () => clearTimeout(t);
    }
  }, [phase, bank, onLinked, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white">
                  <Lock className="h-4 w-4" />
                </div>
                <span className="font-display text-base font-semibold text-slate-800">Secure bank link</span>
              </div>
              <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-5">
              {phase === "select" && (
                <>
                  <div className="text-sm text-slate-600">Select your institution to link a verified ACH source.</div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {BANKS.map((b) => (
                      <button
                        key={b}
                        onClick={() => { setBank(b); setPhase("verifying"); }}
                        className="rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {phase === "verifying" && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <div className="text-sm font-medium text-slate-700">Verifying credentials with {bank}…</div>
                </div>
              )}
              {phase === "done" && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100">
                    <Check className="h-6 w-6 text-emerald-600" />
                  </motion.div>
                  <div className="text-sm font-medium text-slate-700">{bank} successfully linked</div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
