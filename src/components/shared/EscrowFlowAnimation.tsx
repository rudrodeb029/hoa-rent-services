import { motion } from "framer-motion";
import { Landmark, Wallet, ShieldCheck } from "lucide-react";

export function EscrowFlowAnimation({ amount, bankName }: { amount: number; bankName: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/50 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-white">
            <Wallet className="h-6 w-6 text-slate-600" />
          </div>
          <div className="text-xs font-semibold text-slate-600">Tenant</div>
        </div>

        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
          />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-emerald-300 bg-emerald-50">
            <Landmark className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="text-xs font-semibold text-emerald-700">Segregated Trust Account</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-slate-800">{bankName || "Awaiting trust bank"}</span>
        </div>
        <div className="text-lg font-semibold text-emerald-700">${amount.toFixed(2)}</div>
      </div>
    </div>
  );
}
