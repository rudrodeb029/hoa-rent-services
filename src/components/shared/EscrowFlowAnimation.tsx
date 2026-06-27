import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Wallet, ShieldCheck, Loader2, Clock, ChevronDown, ChevronUp } from "lucide-react";

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

export function VerificationWaitingPanel({
  logs,
  title,
  subtitle,
}: {
  logs: string[];
  title: string;
  subtitle: string;
}) {
  const [showLogs, setShowLogs] = useState(false);

  // Determine current active step based on log content
  let currentStep = 0; // 0: Uploading, 1: OCR Scan, 2: Ledger Sync, 3: Awaiting Admin
  const logsStr = logs.join("\n");
  
  if (logsStr.includes("Submitted! Status: PENDING ADMIN APPROVAL.") || logsStr.includes("The Administrator is reviewing")) {
    currentStep = 3;
  } else if (logsStr.includes("Matching transaction")) {
    currentStep = 2;
  } else if (logsStr.includes("Analyzing transaction")) {
    currentStep = 1;
  } else if (logsStr.includes("Uploading proof")) {
    currentStep = 0;
  }

  const steps = [
    { label: "Receipt Submission", desc: "Proof screenshot submitted successfully" },
    { label: "Compliance OCR Scan", desc: "Verifying metadata and transaction details" },
    { label: "Ledger Reconciliation", desc: "Matching reference hashes against the ledger" },
    { label: "Awaiting Admin Sign-off", desc: "Pending administrator validation and approval" },
  ];

  const [countdown, setCountdown] = useState(120); // 2 minutes = 120 seconds
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentStep === 3 && countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }
  }, [currentStep]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm text-left">
      {/* Pulse Animation Header */}
      <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
        <div className="relative flex h-16 w-16 items-center justify-center mb-4">
          {/* Animated pulse rings */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-indigo-500/20"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.1, 0.6] }}
            transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-2 rounded-full bg-indigo-500/10"
          />
          {currentStep === 3 ? (
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>
          ) : (
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 shadow-inner">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
        <h3 className="text-base font-bold text-slate-800 font-display">{title}</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">{subtitle}</p>
        {currentStep === 3 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="text-2xl font-mono font-bold text-indigo-600 tabular-nums">{formatTime(countdown)}</div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">estimated wait</span>
          </div>
        )}
      </div>

      {/* Visual Steps Stepper */}
      <div className="my-6 space-y-5 px-2">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isPending = idx > currentStep;

          return (
            <div key={idx} className="flex gap-4 items-start relative">
              {/* Connecting line */}
              {idx < steps.length - 1 && (
                <div 
                  className={`absolute left-3 top-7 w-[2px] h-[calc(100%-8px)] transition-colors duration-500 ${
                    idx < currentStep ? "bg-emerald-500" : "bg-slate-100"
                  }`} 
                />
              )}

              {/* Step indicator dot/icon */}
              <div className="relative z-10 flex h-6.5 w-6.5 shrink-0 items-center justify-center">
                {isCompleted ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg className="h-3.5 w-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isActive ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 ring-4 ring-indigo-50/50">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </div>
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-200 bg-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  </div>
                )}
              </div>

              {/* Step labels */}
              <div className="flex-1 min-w-0">
                <span 
                  className={`text-xs font-bold font-display block transition-colors duration-300 ${
                    isPending ? "text-slate-400" : "text-slate-800"
                  }`}
                >
                  {step.label}
                </span>
                <span className={`text-[10px] block mt-0.5 leading-normal transition-colors duration-300 ${
                  isPending ? "text-slate-400/80" : "text-slate-500"
                }`}>
                  {isActive ? (
                    <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                      <span>{step.desc}</span>
                      <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600 animate-ping" />
                    </span>
                  ) : step.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapsible log drawer */}
      <div className="border-t border-slate-100 pt-4">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="mx-auto flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider cursor-pointer"
        >
          <span>{showLogs ? "Hide technical logs" : "Show technical logs"}</span>
          {showLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <AnimatePresence>
          {showLogs && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-3"
            >
              <div className="bg-slate-950 text-emerald-400 font-mono text-[9px] text-left p-3 rounded-xl h-32 overflow-y-auto space-y-1 shadow-inner border border-slate-800 leading-normal">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-slate-600 shrink-0 select-none">[{new Date().toLocaleTimeString()}]</span>
                    <span className="break-all">{log}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
