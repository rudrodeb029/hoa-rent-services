import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Activity, Building2, Calculator, Database, Landmark, Percent, Clock, ShieldCheck, Scale, CalendarClock, Info } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Button, Card, Field, Input, PageHeader, PageShell, Pill } from "@/components/shared/Primitives";
import { useAppStore } from "@/lib/store";
import { JURISDICTIONS, STATE_CODES, describeAppFee, describeInterest, effectiveAPR, type StateCode } from "@/lib/compliance";
import { Tex } from "@/components/shared/Tex";
import { Banner } from "@/components/compliance/Banner";

export const Route = createFileRoute("/admin-compliance")({
  head: () => ({
    meta: [
      { title: "Compliance Helper — HOA Rent Services" },
      { name: "description", content: "Review regulatory rules, simulate roommate and landlord payment rules, and audit transaction logs." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const activeState = useAppStore((s) => s.activeState);
  const setActiveState = useAppStore((s) => s.setActiveState);
  const payments = useAppStore((s) => s.payments);
  const j = JURISDICTIONS[activeState];

  const [P, setP] = useState(3200);
  const [t, setT] = useState(1);
  const [rentArrears, setRentArrears] = useState(450);
  const [repairs, setRepairs] = useState(250);
  const [adminFee, setAdminFee] = useState(75);

  const apr = effectiveAPR(j);
  const interest = P * apr * t;
  const refund = P + interest - (rentArrears + repairs + adminFee);

  const chartData = useMemo(() => {
    const data = [];
    const yearsToModel = Math.max(t, 5);
    for (let i = 0; i <= yearsToModel; i++) {
      const interestAccrued = P * apr * i;
      data.push({
        year: `Yr ${i}`,
        Principal: P,
        Interest: Number(interestAccrued.toFixed(2)),
        Total: Number((P + interestAccrued).toFixed(2))
      });
    }
    return data;
  }, [P, apr, t]);

  const pieData = useMemo(() => {
    const data = [];
    if (rentArrears > 0) data.push({ name: "Arrears", value: rentArrears, color: "#f43f5e" }); // rose-500
    if (repairs > 0) data.push({ name: "Repairs", value: repairs, color: "#f59e0b" }); // amber-500
    if (adminFee > 0) data.push({ name: "Admin Fee", value: adminFee, color: "#6366f1" }); // indigo-500
    if (refund > 0) {
      data.push({ name: "Refund", value: Number(refund.toFixed(2)), color: "#10b981" }); // emerald-500
    }
    return data;
  }, [rentArrears, repairs, adminFee, refund]);

  return (
    <PageShell>
      <PageHeader title="Compliance Helper" subtitle="Review regulatory rules, simulate roommate and landlord payment rules, and audit transaction logs." icon={<Building2 className="h-5 w-5" />} />

      {payments.length > 0 && (
        <div className="mb-6">
          <Banner tone="ok" title="Tenant Journey Successfully Completed!">
            <div className="space-y-2">
              <p className="text-sm">
                Congratulations! We have successfully processed and verified all stages of the tenant journey (Application Fee, Holding Fee, Lease Signing, Security Deposit, and Rent Ledger). All transactions are fully audited and recorded on the state compliance ledger.
              </p>
              <div className="grid gap-4 sm:grid-cols-3 mt-3 pt-3 border-t border-emerald-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Total Completed Payments</span>
                  <span className="text-base font-extrabold text-emerald-850">${payments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Total Escrow Funds Held</span>
                  <span className="text-base font-extrabold text-emerald-850">${payments.filter(p => p.status === "held").reduce((sum, p) => sum + p.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Audit Log Entries</span>
                  <span className="text-base font-extrabold text-emerald-850">{payments.length} verified records</span>
                </div>
              </div>
            </div>
          </Banner>
        </div>
      )}

      <Card className="mb-6 overflow-hidden">
        <div className="border-b border-slate-100 p-5 bg-gradient-to-r from-slate-50/50 to-white">
          <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-slate-800">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:scale-105 transition-transform">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <span className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
              Select State for Compliance Rules
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">
            Click a state code to instantly load its regulatory limits, security deposit cap rules, and required math formulas.
          </p>
        </div>
        {/* Sleek Glassmorphic Color Code Legend */}
        <div className="px-5 py-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100/80 bg-slate-50/40">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200/50 bg-emerald-50/50 text-emerald-800 shadow-sm transition-all hover:bg-emerald-100/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Cost Reimbursement
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-indigo-200/50 bg-indigo-50/50 text-indigo-800 shadow-sm transition-all hover:bg-indigo-100/60">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Capped Limits
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rose-200/50 bg-rose-50/50 text-rose-800 shadow-sm transition-all hover:bg-rose-100/60">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Fees Banned
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-200/50 bg-amber-50/50 text-amber-800 shadow-sm transition-all hover:bg-amber-100/60">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Broker Only
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5 p-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 sm:p-5 bg-gradient-to-b from-white to-slate-50/20">
          {STATE_CODES.map((c) => {
            const isActive = c === activeState;
            const rule = JURISDICTIONS[c].appFeeRule.type;
            
            let badgeStyle = "";
            let btnStyle = "";
            let ruleLabel = "";

            if (rule === "banned") {
              ruleLabel = "Banned";
              if (isActive) {
                badgeStyle = "bg-white/20 text-white border-white/30";
                btnStyle = "border-rose-600 bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 text-white font-bold shadow-[0_8px_20px_rgba(244,63,94,0.3)] ring-2 ring-rose-400/40 scale-[1.05] z-10";
              } else {
                badgeStyle = "bg-rose-50 text-rose-700 border-rose-100/50";
                btnStyle = "border-rose-100/80 bg-gradient-to-br from-rose-50/30 to-rose-100/10 text-rose-950 hover:border-rose-400 hover:bg-rose-50/50 hover:shadow-[0_4px_12px_rgba(244,63,94,0.08)] hover:scale-[1.03] hover:-translate-y-0.5";
              }
            } else if (rule === "broker_only") {
              ruleLabel = "Broker";
              if (isActive) {
                badgeStyle = "bg-white/20 text-white border-white/30";
                btnStyle = "border-amber-600 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-500 text-white font-bold shadow-[0_8px_20px_rgba(245,158,11,0.3)] ring-2 ring-amber-400/40 scale-[1.05] z-10";
              } else {
                badgeStyle = "bg-amber-50 text-amber-700 border-amber-100/50";
                btnStyle = "border-amber-100/80 bg-gradient-to-br from-amber-50/30 to-amber-100/10 text-amber-950 hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-[0_4px_12px_rgba(245,158,11,0.08)] hover:scale-[1.03] hover:-translate-y-0.5";
              }
            } else if (rule === "capped") {
              ruleLabel = "Capped";
              if (isActive) {
                badgeStyle = "bg-white/20 text-white border-white/30";
                btnStyle = "border-indigo-600 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white font-bold shadow-[0_8px_20px_rgba(99,102,241,0.3)] ring-2 ring-indigo-400/40 scale-[1.05] z-10";
              } else {
                badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-100/50";
                btnStyle = "border-indigo-100/80 bg-gradient-to-br from-indigo-50/30 to-indigo-100/10 text-indigo-950 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-[0_4px_12px_rgba(99,102,241,0.08)] hover:scale-[1.03] hover:-translate-y-0.5";
              }
            } else {
              ruleLabel = "Reimburse";
              if (isActive) {
                badgeStyle = "bg-white/20 text-white border-white/30";
                btnStyle = "border-emerald-600 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white font-bold shadow-[0_8px_20px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400/40 scale-[1.05] z-10";
              } else {
                badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100/50";
                btnStyle = "border-emerald-100/80 bg-gradient-to-br from-emerald-50/30 to-emerald-100/10 text-emerald-950 hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-[0_4px_12px_rgba(16,185,129,0.08)] hover:scale-[1.03] hover:-translate-y-0.5";
              }
            }

            return (
              <button
                key={c}
                onClick={() => setActiveState(c as StateCode)}
                className={`relative rounded-xl border p-1.5 sm:p-2 text-center transition-all duration-300 transform cursor-pointer ${btnStyle}`}
              >
                {/* Indicator dot */}
                <span className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${
                  rule === "banned" ? "bg-rose-500" :
                  rule === "broker_only" ? "bg-amber-500" :
                  rule === "capped" ? "bg-indigo-500" : "bg-emerald-500"
                } ${isActive ? "bg-white scale-125 ring-2 ring-white/30" : "opacity-60"}`} />

                <div className="font-display text-sm font-extrabold sm:text-base md:text-lg leading-tight tracking-tight">{c}</div>
                <div className={`hidden sm:block mt-0.5 text-[8px] font-semibold truncate ${isActive ? "text-white/80" : "text-slate-500"}`} title={JURISDICTIONS[c].name}>
                  {JURISDICTIONS[c].name}
                </div>
                <div className={`mt-1.5 text-[7px] font-bold uppercase tracking-wider py-0.5 px-0.5 rounded border transition-all duration-300 ${badgeStyle}`}>
                  {ruleLabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Professional Rule Cards with Multiple Colors Effects */}
        <div className="border-t border-slate-100 p-5 bg-slate-50/30">
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <RuleDetailCard
              title="App Fee Rule"
              value={describeAppFee(j)}
              icon={<Scale className="h-[18px] w-[18px]" />}
              ruleType={j.appFeeRule.type}
            />
            <RuleDetailCard
              title="Security Deposit Cap"
              value={isFinite(j.securityDepositCapMonths) ? `${j.securityDepositCapMonths} month(s)` : "Uncapped"}
              icon={<ShieldCheck className="h-[18px] w-[18px]" />}
              ruleType={j.appFeeRule.type}
            />
            <RuleDetailCard
              title="Escrow Protocol"
              value={`${j.escrowRequirement.separateAccount ? "Separate account" : "Commingling allowed"}${j.escrowRequirement.unitThreshold ? ` (${j.escrowRequirement.unitThreshold}+ units)` : ""}${j.escrowRequirement.inStateBank ? "; in-state bank" : ""}`}
              icon={<Landmark className="h-[18px] w-[18px]" />}
              ruleType={j.appFeeRule.type}
            />
            <RuleDetailCard
              title="Interest Requirement"
              value={describeInterest(j)}
              icon={<Percent className="h-[18px] w-[18px]" />}
              ruleType={j.appFeeRule.type}
            />
            <RuleDetailCard
              title="Refund Deadline"
              value={`${j.refundDeadline.days} ${j.refundDeadline.unit} days${j.refundDeadline.maxIfLeaseSpecifies ? ` (up to ${j.refundDeadline.maxIfLeaseSpecifies} per lease)` : ""}`}
              icon={<CalendarClock className="h-[18px] w-[18px]" />}
              ruleType={j.appFeeRule.type}
            />
            <RuleDetailCard
              title="Late Fee Grace Period"
              value={`${j.lateFeeGraceDays} days`}
              icon={<Clock className="h-[18px] w-[18px]" />}
              ruleType={j.appFeeRule.type}
            />
          </div>

          {j.notes && (
            <div className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-[11px] leading-relaxed shadow-sm transition-all duration-300 ${
              j.appFeeRule.type === "banned" ? "border-rose-100 bg-rose-50/50 text-rose-900" :
              j.appFeeRule.type === "broker_only" ? "border-amber-100 bg-amber-50/50 text-amber-900" :
              j.appFeeRule.type === "capped" ? "border-indigo-100 bg-indigo-50/50 text-indigo-900" :
              "border-emerald-100 bg-emerald-50/50 text-emerald-900"
            }`}>
              <Info className="h-4 w-4 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-extrabold uppercase tracking-wider text-[9px] mr-1.5 opacity-90">State Special Provision:</span>
                {j.notes}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="mb-6">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-2 font-display text-lg font-semibold text-slate-800"><Calculator className="h-5 w-5 text-indigo-600" /> Escrow math formulas & projection</div>
        </div>
        <div className="grid gap-6 p-5 lg:grid-cols-2">
          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-3">Interest accrual</div>
              <div className="rounded-xl bg-slate-50 p-4 text-center mb-3"><Tex block>{`I = P \\times r \\times t`}</Tex></div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Field label="P (principal)"><Input type="number" value={P} onChange={(e) => setP(Number(e.target.value))} /></Field>
                <Field label="r (APR)"><Input value={`${(apr * 100).toFixed(2)}%`} readOnly /></Field>
                <Field label="t (years)"><Input type="number" value={t} onChange={(e) => setT(Number(e.target.value))} step="0.25" /></Field>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <Tex block>{`I = ${P} \\times ${apr.toFixed(4)} \\times ${t} = ${interest.toFixed(2)}`}</Tex>
                <div className="mt-2 text-xs font-semibold text-emerald-700">Accrued interest = ${interest.toFixed(2)}</div>
              </div>
            </div>
            <div className="h-44 w-full mt-6 border-t border-slate-100 pt-4">
              <div className="text-xs font-semibold text-slate-500 mb-2">Accrual Projection (5 Years)</div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Area type="monotone" dataKey="Principal" stackId="1" stroke="#6366f1" fill="#e0e7ff" />
                  <Area type="monotone" dataKey="Interest" stackId="1" stroke="#10b981" fill="#d1fae5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-4 flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-3">Simulated security deposit refund</div>
              <div className="rounded-xl bg-slate-50 p-4 text-center mb-3"><Tex block>{`B_{refund} = (P_{sec} + I_{acc}) - (D_{rent} + D_{repair} + A_{fee})`}</Tex></div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Field label="Rent arrears"><Input type="number" value={rentArrears} onChange={(e) => setRentArrears(Number(e.target.value))} /></Field>
                <Field label="Repairs"><Input type="number" value={repairs} onChange={(e) => setRepairs(Number(e.target.value))} /></Field>
                <Field label="Admin fee"><Input type="number" value={adminFee} onChange={(e) => setAdminFee(Number(e.target.value))} /></Field>
              </div>
              <div className={`rounded-xl border p-4 text-center ${refund >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                <Tex block>{`B_{refund} = (${P} + ${interest.toFixed(2)}) - (${rentArrears} + ${repairs} + ${adminFee}) = ${refund.toFixed(2)}`}</Tex>
                <div className={`mt-2 text-xs font-semibold ${refund >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  Refund balance = ${refund.toFixed(2)} {refund < 0 && "(tenant owes)"}
                </div>
              </div>
            </div>
            <div className="h-auto sm:h-44 w-full mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 gap-4">
              <div className="w-full sm:w-1/2 h-32 sm:h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-1.5 pl-0 sm:pl-4 text-left">
                <div className="text-xs font-semibold text-slate-500 mb-1 text-center sm:text-left">Fund Allocation</div>
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                    <span className="font-semibold ml-auto">${item.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-lg font-semibold text-slate-800"><Database className="h-5 w-5 text-indigo-600" /> Transaction audit ledger</div>
            <Pill tone="indigo"><Activity className="mr-1 inline h-3 w-3" />{payments.length} entries</Pill>
          </div>
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4">UUID</th>
                <th className="py-2 pr-4">State</th>
                <th className="py-2 pr-4">Timestamp</th>
                <th className="py-2 pr-4">Processor</th>
                <th className="py-2 pr-4">Classification</th>
                <th className="py-2 pr-4 text-right">Amount</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">{p.id.slice(0, 8)}</td>
                  <td className="py-2.5 pr-4"><Pill tone="slate">{p.state}</Pill></td>
                  <td className="py-2.5 pr-4 text-xs text-slate-600">{new Date(p.timestamp).toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-slate-700">{p.processor.replace("_", " ")}</td>
                  <td className="py-2.5 pr-4 capitalize text-slate-700">{p.classification.replace("_", " ")}</td>
                  <td className="py-2.5 pr-4 text-right font-medium text-slate-900">${p.amount.toFixed(2)}</td>
                  <td className="py-2.5 pr-4">
                    <Pill tone={p.status === "completed" ? "emerald" : p.status === "held" ? "amber" : p.status === "failed" ? "red" : "slate"}>{p.status}</Pill>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-sm text-slate-500">No transactions yet — complete a flow in any tab to populate the ledger.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 p-4">
          <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(JSON.stringify(payments, null, 2))}>Export JSON</Button>
        </div>
      </Card>
    </PageShell>
  );
}

function RuleDetailCard({
  title,
  value,
  icon,
  ruleType
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  ruleType: "capped" | "banned" | "broker_only" | "cost_reimbursement";
}) {
  let borderTheme = "";
  let bgTheme = "";
  let iconBg = "";

  if (ruleType === "banned") {
    borderTheme = "border-rose-100 hover:border-rose-300 hover:shadow-rose-100/10";
    iconBg = "bg-rose-50 text-rose-700";
    bgTheme = "hover:bg-rose-50/10";
  } else if (ruleType === "broker_only") {
    borderTheme = "border-amber-100 hover:border-amber-300 hover:shadow-amber-100/10";
    iconBg = "bg-amber-50 text-amber-700";
    bgTheme = "hover:bg-amber-50/10";
  } else if (ruleType === "capped") {
    borderTheme = "border-indigo-100 hover:border-indigo-300 hover:shadow-indigo-100/10";
    iconBg = "bg-indigo-50 text-indigo-700";
    bgTheme = "hover:bg-indigo-50/10";
  } else {
    borderTheme = "border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-100/10";
    iconBg = "bg-emerald-50 text-emerald-700";
    bgTheme = "hover:bg-emerald-50/10";
  }

  return (
    <div className={`flex items-center gap-3.5 rounded-xl border p-3.5 transition-all duration-300 hover:shadow-soft hover:-translate-y-0.5 bg-white ${borderTheme} ${bgTheme}`}>
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl shadow-sm transition-transform duration-300 hover:rotate-6 ${iconBg}`}>
        {icon}
      </div>
      <div className="space-y-0.5 min-w-0">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">{title}</span>
        <span className="text-xs sm:text-[13px] font-bold text-slate-800 block leading-tight truncate" title={value}>
          {value}
        </span>
      </div>
    </div>
  );
}
