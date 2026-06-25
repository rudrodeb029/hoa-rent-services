import { Copy, Check } from "lucide-react";
import { useState } from "react";

const PORTALS = [
  { 
    id: "cashapp", 
    name: "Cash App", 
    handle: "$hoarentservices", 
    color: "bg-[#00D632] text-white", 
    border: "border-emerald-100 hover:border-emerald-300 hover:shadow-[0_8px_20px_rgba(16,185,129,0.08)] bg-gradient-to-br from-emerald-50/20 to-emerald-100/5",
    btnColor: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-200"
  },
  { 
    id: "venmo", 
    name: "Venmo", 
    handle: "@hoarentservices", 
    color: "bg-[#008CFF] text-white", 
    border: "border-blue-100 hover:border-blue-300 hover:shadow-[0_8px_20px_rgba(59,130,246,0.08)] bg-gradient-to-br from-blue-50/20 to-blue-100/5",
    btnColor: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-200"
  },
  { 
    id: "chime", 
    name: "Chime", 
    handle: "$hoarentservices", 
    color: "bg-[#25C974] text-white", 
    border: "border-teal-100 hover:border-teal-300 hover:shadow-[0_8px_20px_rgba(20,184,166,0.08)] bg-gradient-to-br from-teal-50/20 to-teal-100/5",
    btnColor: "bg-teal-600 hover:bg-teal-700 focus:ring-teal-200"
  },
  { 
    id: "card", 
    name: "Card", 
    handle: "Pay by debit/credit", 
    color: "bg-indigo-600 text-white", 
    border: "border-indigo-100 hover:border-indigo-300 hover:shadow-[0_8px_20px_rgba(99,102,241,0.08)] bg-gradient-to-br from-indigo-50/20 to-indigo-100/5",
    btnColor: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-200"
  },
] as const;

export function PaymentPortals({ onSelect, amount }: { onSelect: (processor: string) => void; amount: number }) {
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PORTALS.map((p) => (
        <div key={p.id} className={`flex flex-col rounded-xl border p-4 transition-all duration-300 transform hover:-translate-y-0.5 ${p.border}`}>
          <div className="flex items-center gap-3">
            <div className={`grid h-9 w-9 place-items-center rounded-xl font-extrabold shadow-sm ${p.color}`}>{p.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-800">{p.name}</div>
              <div className="text-xs text-slate-500 font-medium truncate select-all">{p.handle}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(p.handle);
                setCopied(p.id);
                setTimeout(() => setCopied(null), 1400);
              }}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              title="Copy tag"
            >
              {copied === p.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="mt-3.5 flex items-center justify-between border-t border-dashed border-slate-100 pt-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</span>
            <span className="text-base font-extrabold text-slate-850">${amount.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={() => onSelect(p.name)}
            className={`mt-3 rounded-lg px-3 py-2 text-xs font-bold text-white shadow-soft transition-all duration-200 transform active:scale-95 cursor-pointer ${p.btnColor}`}
          >
            I Paid via {p.name}
          </button>
        </div>
      ))}
    </div>
  );
}
