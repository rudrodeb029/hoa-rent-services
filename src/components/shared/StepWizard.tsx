import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function StepHeader({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center justify-between w-full gap-1 sm:gap-1.5">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center flex-1 last:flex-initial">
            <div className="flex items-center gap-1 sm:gap-2 group">
              <div
                className={`flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full border text-[9px] sm:text-[10px] font-bold transition-all duration-300 transform ${
                  done
                    ? "border-emerald-500 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 text-white shadow-[0_2px_6px_rgba(16,185,129,0.2)] scale-105"
                    : active
                    ? "border-indigo-500 bg-gradient-to-br from-indigo-400 via-indigo-500 to-violet-500 text-white shadow-[0_2px_6px_rgba(99,102,241,0.2)] scale-105"
                    : "border-slate-200 bg-slate-50/50 text-slate-400 group-hover:border-slate-300"
                }`}
              >
                {done ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[3]" /> : i + 1}
              </div>
              <span
                className={`text-[9px] sm:text-[11px] md:text-xs font-bold tracking-tight leading-tight transition-all duration-300 ${
                  active
                    ? "text-slate-900 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
                    : done
                    ? "text-emerald-700"
                    : "text-slate-400"
                } ${active ? "inline" : "hidden md:inline"}`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 mx-1 sm:mx-2.5 h-[1.5px] rounded-full transition-all duration-500 min-w-[6px] ${
                done ? "bg-gradient-to-r from-emerald-500 to-indigo-400" : "bg-slate-100"
              }`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function StepPanel({ keyId, children }: { keyId: string | number; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
