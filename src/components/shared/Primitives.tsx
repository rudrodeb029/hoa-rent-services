export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200/60 bg-white shadow-soft ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 p-5">
      {icon && <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</div>}
      <div>
        <h2 className="font-display text-base font-semibold text-slate-800">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, right, icon }: { eyebrow?: string; title: string; subtitle?: string; right?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <header className="relative mb-6 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-soft overflow-hidden">
      {/* Real estate / HOA theme vector illustration */}
      <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-[0.03] pointer-events-none select-none hidden sm:block">
        <svg className="w-full h-full text-indigo-900" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,100 L10,80 L20,90 L35,60 L50,85 L65,55 L80,75 L90,65 L100,85 L100,100 Z" />
          <path d="M15,100 L25,75 L35,85 L45,50 L60,80 L75,45 L90,70 L100,60 L100,100 Z" opacity="0.5" />
        </svg>
      </div>

      {/* Soft color highlights in the background */}
      <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
      <div className="absolute right-10 -bottom-10 w-40 h-40 rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 z-10">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm animate-float hover-wiggle transition-colors hover:bg-indigo-100 hover:text-indigo-700">
              {icon}
            </div>
          )}
          <div className="space-y-0.5">
            {eyebrow && <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">{eyebrow}</div>}
            <h1 className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{title}</h1>
            {subtitle && <p className="text-[13px] text-slate-500 leading-relaxed max-w-2xl">{subtitle}</p>}
          </div>
        </div>
        {right && <div className="flex items-center gap-2 shrink-0 sm:self-center">{right}</div>}
      </div>
    </header>
  );
}

export function PageShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`w-full px-4 py-6 sm:px-6 sm:py-8 ${className}`}>{children}</div>;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "success" | "danger" }) {
  const map = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  } as const;
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${map[variant]} ${className}`}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label mb-1.5 block text-[10px] font-bold tracking-wider text-slate-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
        props.className ?? ""
      }`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
        props.className ?? ""
      }`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
        props.className ?? ""
      }`}
    />
  );
}

export function Pill({ children, tone = "indigo" }: { children: React.ReactNode; tone?: "indigo" | "emerald" | "amber" | "slate" | "red" }) {
  const map = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
    slate: "bg-slate-100 text-slate-700",
    red: "bg-red-50 text-red-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}
