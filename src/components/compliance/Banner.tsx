import { AlertTriangle, Ban, Info, ShieldCheck } from "lucide-react";
import { JURISDICTIONS, describeAppFee, type StateCode } from "@/lib/compliance";

type Tone = "info" | "warn" | "ban" | "ok";

export function Banner({
  tone = "info",
  title,
  children,
}: {
  tone?: Tone;
  title: string;
  children?: React.ReactNode;
}) {
  const map: Record<Tone, { bg: string; border: string; text: string; icon: React.ElementType }> = {
    info: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800", icon: Info },
    warn: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-900", icon: AlertTriangle },
    ban: { bg: "bg-red-50", border: "border-red-300", text: "text-red-800", icon: Ban },
    ok: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: ShieldCheck },
  };
  const s = map[tone];
  const Icon = s.icon;
  return (
    <div className={`flex gap-3 rounded-xl border ${s.border} ${s.bg} p-4 ${s.text}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="text-sm">
        <div className="font-semibold">{title}</div>
        {children && <div className="mt-1 leading-relaxed opacity-90">{children}</div>}
      </div>
    </div>
  );
}

export function AppFeeBanner({ state }: { state: StateCode }) {
  const j = JURISDICTIONS[state];
  if (j.appFeeRule.type === "banned") {
    return <Banner tone="ban" title={`${j.name} Ban Alert`}>Application fees are prohibited under {j.code} law. No fee may be charged or collected.</Banner>;
  }
  if (j.appFeeRule.type === "broker_only") {
    return <Banner tone="warn" title="Landlord application fees not permitted">Massachusetts law restricts application fees to licensed brokers. Landlords may not collect.</Banner>;
  }
  return <Banner tone="info" title={`${j.name} application fee rule`}>{describeAppFee(j)}</Banner>;
}
