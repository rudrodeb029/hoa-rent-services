import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, Wallet, TrendingUp, Repeat, AlertTriangle, CheckCircle2, Loader2, Copy, Check, ShieldCheck } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Banner } from "@/components/compliance/Banner";
import { Button, Card, Field, Input, PageHeader, PageShell, Pill } from "@/components/shared/Primitives";
import { useAppStore } from "@/lib/store";
import { JURISDICTIONS } from "@/lib/compliance";
import { ProofUpload } from "@/components/shared/ProofUpload";

export const Route = createFileRoute("/rent-ledger")({
  head: () => ({
    meta: [
      { title: "Your Shared Rent Ledger — HOA Rent Services" },
      { name: "description", content: "Track your rental payments, split roommate costs fairly, and keep everyone on the same page." },
    ],
  }),
  component: RentPage,
});

interface Roommate { id: string; email: string; pct: number; }

function RentPage() {
  const activeState = useAppStore((s) => s.activeState);
  const logPayment = useAppStore((s) => s.logPayment);
  const pageSettings = useAppStore((s) => s.pageSettings);
  const payments = useAppStore((s) => s.payments);
  const j = JURISDICTIONS[activeState];

  const [baseRent, setBaseRent] = useState(3200);
  const [utilities, setUtilities] = useState(180);
  const [autopay, setAutopay] = useState(true);
  const [reportCredit, setReportCredit] = useState(true);
  const [daysLate, setDaysLate] = useState(0);

  const [roommates, setRoommates] = useState<Roommate[]>([
    { id: "me", email: "you@example.com", pct: 100 },
  ]);
  const [newEmail, setNewEmail] = useState("");

  // Payment states matching applications payment flow
  const [paymentMethod, setPaymentMethod] = useState<"cashapp" | "venmo" | "chime" | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "uploading" | "waiting" | "confirmed">("idle");
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [processor, setProcessor] = useState<string | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);

  const pendingPayment = pendingPaymentId ? payments.find((p) => p.id === pendingPaymentId) : null;
  useEffect(() => {
    if (pendingPayment && pendingPayment.status === "completed") {
      setPaymentStatus("confirmed");
      setVerificationLogs((prev) => [
        ...prev,
        "Payment verified & accepted by Administrator!",
        "Rent ledger updated.",
      ]);
      const formattedProcessor = paymentMethod
        ? `${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} (Admin Confirmed)`
        : "Admin Confirmed Receipt";
      setProcessor(formattedProcessor);
    } else if (pendingPayment && pendingPayment.status === "failed") {
      setPaymentStatus("idle");
      setVerificationLogs([]);
      setPendingPaymentId(null);
      alert("Payment proof was rejected by the administrator. Please re-submit your receipt.");
    }
  }, [pendingPayment]);

  const total = baseRent + utilities;
  const totalPct = roommates.reduce((s, r) => s + r.pct, 0);

  const addRoommate = () => {
    if (!newEmail.includes("@")) return;
    const even = Math.floor(100 / (roommates.length + 1));
    const remainder = 100 - even * (roommates.length + 1);
    setRoommates([
      ...roommates.map((r, i) => ({ ...r, pct: even + (i === 0 ? remainder : 0) })),
      { id: crypto.randomUUID().slice(0, 6), email: newEmail, pct: even },
    ]);
    setNewEmail("");
  };

  const graceDays = pageSettings.rentGraceDays !== undefined ? pageSettings.rentGraceDays : j.lateFeeGraceDays;

  const lateFee = useMemo(() => {
    if (daysLate <= graceDays) return 0;
    const rate = (pageSettings.rentLateFeePercent !== undefined ? pageSettings.rentLateFeePercent : 5) / 100;
    return Math.min(baseRent * rate, 50 + (daysLate - graceDays) * 5);
  }, [daysLate, graceDays, baseRent, pageSettings.rentLateFeePercent]);

  const inGrace = daysLate <= graceDays;

  const roommateChartData = useMemo(() => {
    const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
    return roommates.map((r, idx) => ({
      name: r.email,
      value: r.pct,
      color: COLORS[idx % COLORS.length]
    }));
  }, [roommates]);

  const startPaymentVerification = (fileName: string) => {
    setPaymentProofFile(fileName);
    setPaymentStatus("waiting");
    setVerificationLogs(["Initializing digital verification protocol..."]);
    
    setTimeout(() => {
      setVerificationLogs(prev => [...prev, "Uploading proof screenshot..."]);
    }, 1000);
    
    setTimeout(() => {
      setVerificationLogs(prev => [...prev, "Analyzing transaction image (OCR check)..."]);
    }, 2000);
    
    setTimeout(() => {
      setVerificationLogs(prev => [...prev, "Matching transaction reference code on the ledger..."]);
    }, 3500);

    setTimeout(() => {
      setVerificationLogs(prev => [...prev, "Submitting details to HOA Admin Panel for validation..."]);
    }, 4500);

    setTimeout(() => {
      setVerificationLogs(prev => [...prev, "Submitted! Status: PENDING ADMIN APPROVAL.", "The Administrator is reviewing your payment proof in the admin panel."]);
      const logged = logPayment({ 
        amount: total + lateFee, 
        classification: "rent", 
        status: "pending", 
        processor: (paymentMethod ? paymentMethod.toUpperCase() : "Uploaded_Screenshot") as any, 
        state: activeState,
        tenantName: "Avery Tenant",
        unitAddress: "Hudson Heights, 4B",
        proofImage: fileName
      });
      setPendingPaymentId(logged.id);
    }, 6000);
  };

  return (
    <PageShell>
      <PageHeader title="Shared Rent Ledger" subtitle="Easily check monthly statement details, customize roommate shares, and pay securely." icon={<Wallet className="h-5 w-5" />} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-slate-800">{new Date().toLocaleString(undefined, { month: "long", year: "numeric" })} Statement</h2>
              <div className="flex items-center gap-2">
                {paymentStatus === "confirmed" && <Pill tone="emerald">Paid</Pill>}
                <Pill tone={autopay ? "emerald" : "amber"}>{autopay ? "Autopay on" : "Manual pay"}</Pill>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Base rent"><Input type="number" value={baseRent} onChange={(e) => setBaseRent(Number(e.target.value))} disabled={paymentStatus === "confirmed" || paymentStatus === "waiting"} /></Field>
              <Field label="Utilities"><Input type="number" value={utilities} onChange={(e) => setUtilities(Number(e.target.value))} disabled={paymentStatus === "confirmed" || paymentStatus === "waiting"} /></Field>
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm"><span className="text-slate-600">Base rent</span><span className="font-medium">${baseRent.toFixed(2)}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="text-slate-600">Utilities</span><span className="font-medium">${utilities.toFixed(2)}</span></div>
              {lateFee > 0 && (
                <div className="flex items-center justify-between text-sm text-amber-700"><span>Late fee ({daysLate - j.lateFeeGraceDays} days past grace)</span><span className="font-medium">+${lateFee.toFixed(2)}</span></div>
              )}
              <div className="my-2 border-t border-slate-200" />
              <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-800">Total due</span><span className="font-display text-2xl font-bold text-slate-900">${(total + lateFee).toFixed(2)}</span></div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-5">
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes scan {
                  0%, 100% { top: 0%; }
                  50% { top: 100%; }
                }
                .scanner-line {
                  height: 2px;
                  background: linear-gradient(90deg, transparent, #4f46e5, transparent);
                  position: absolute;
                  width: 100%;
                  animation: scan 2.5s infinite linear;
                }
              `}} />

              {paymentStatus === "idle" && (
                <div className="space-y-4">
                  <div className="text-xs font-semibold text-slate-500">Securely pay rent statement balance</div>
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                    <button
                      onClick={() => setPaymentMethod("venmo")}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 sm:p-4.5 transition-all duration-300 transform cursor-pointer ${
                        paymentMethod === "venmo"
                          ? "border-blue-600 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white font-bold shadow-[0_8px_20px_rgba(59,130,246,0.3)] ring-2 ring-blue-400/40 scale-[1.04] z-10"
                          : "border-slate-200/80 bg-gradient-to-br from-blue-50/20 to-blue-100/10 text-[#008CFF] hover:border-blue-400 hover:bg-blue-50/30 hover:scale-[1.02] hover:-translate-y-0.5"
                      }`}
                    >
                      <span className={`text-xs sm:text-lg font-extrabold tracking-tight transition-colors duration-300 ${paymentMethod === "venmo" ? "text-white" : "text-[#008CFF]"}`}>Venmo</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("cashapp")}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 sm:p-4.5 transition-all duration-300 transform cursor-pointer ${
                        paymentMethod === "cashapp"
                          ? "border-emerald-600 bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 text-white font-bold shadow-[0_8px_20px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400/40 scale-[1.04] z-10"
                          : "border-slate-200/80 bg-gradient-to-br from-emerald-50/20 to-emerald-100/10 text-[#00D632] hover:border-emerald-400 hover:bg-emerald-50/30 hover:scale-[1.02] hover:-translate-y-0.5"
                      }`}
                    >
                      <span className={`text-xs sm:text-lg font-extrabold tracking-tight transition-colors duration-300 ${paymentMethod === "cashapp" ? "text-white" : "text-[#00D632]"}`}>Cash App</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("chime")}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 sm:p-4.5 transition-all duration-300 transform cursor-pointer ${
                        paymentMethod === "chime"
                          ? "border-teal-600 bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 text-white font-bold shadow-[0_8px_20px_rgba(20,184,166,0.3)] ring-2 ring-teal-400/40 scale-[1.04] z-10"
                          : "border-slate-200/80 bg-gradient-to-br from-teal-50/20 to-teal-100/10 text-[#25C974] hover:border-teal-400 hover:bg-teal-50/30 hover:scale-[1.02] hover:-translate-y-0.5"
                      }`}
                    >
                      <span className={`text-xs sm:text-lg font-extrabold tracking-tight transition-colors duration-300 ${paymentMethod === "chime" ? "text-white" : "text-[#25C974]"}`}>Chime</span>
                    </button>
                  </div>

                  {paymentMethod && (
                    <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-4">
                      <div className="flex flex-col sm:flex-row gap-6 items-center">
                        {/* QR Code Scan Container */}
                        <div className="relative w-36 h-36 border-2 border-indigo-100 rounded-xl p-2 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                          <div className="scanner-line" />
                          <QRCodeSVG />
                        </div>

                        {/* Details */}
                        <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {paymentMethod === "venmo" && "Venmo Gateway"}
                            {paymentMethod === "cashapp" && "Cash App Gateway"}
                            {paymentMethod === "chime" && "Chime Digital Portal"}
                          </h4>
                          <div className="text-sm font-semibold text-slate-800">
                            Amount Due: <span className="text-indigo-600">${(total + lateFee).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-100 rounded-lg p-2 max-w-sm mt-1">
                            <span className="font-mono text-xs text-slate-700 truncate select-all">
                              {paymentMethod === "venmo" && "@hoarentservices"}
                              {paymentMethod === "cashapp" && "$hoarentservices"}
                              {paymentMethod === "chime" && "hoarentservices@chime.com"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  paymentMethod === "venmo" ? "@hoarentservices" :
                                  paymentMethod === "cashapp" ? "$hoarentservices" : "hoarentservices@chime.com"
                                );
                                setCopied(true);
                                setTimeout(() => setCopied(false), 1500);
                              }}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500"
                              title="Copy Handle"
                            >
                              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            Scan the QR code or pay to the handle above. Take a screenshot of your payment confirmation receipt and upload it below.
                          </p>
                        </div>
                      </div>

                      {/* Screenshot proof upload */}
                      <div className="border-t border-slate-100 pt-4">
                        <ProofUpload onComplete={(fname) => startPaymentVerification(fname)} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {paymentStatus === "waiting" && (
                <div className="text-center py-6 space-y-4 max-w-md mx-auto">
                  <div className="relative inline-flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                    <ShieldCheck className="h-5 w-5 text-indigo-400 absolute" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">Confirming your payment with care...</h3>
                    <p className="text-xs text-slate-500 mt-1">We're verifying your uploaded receipt to settle your statement balance.</p>
                  </div>
                  {/* Custom Console Log */}
                  <div className="bg-slate-950 text-emerald-400 font-mono text-[10px] text-left p-3.5 rounded-xl h-36 overflow-y-auto space-y-1 shadow-inner border border-slate-800">
                    {verificationLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                        <span className="break-all">{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {paymentStatus === "confirmed" && (
                <div className="space-y-5">
                  <div className="text-center py-6 space-y-4 max-w-md mx-auto">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">Rent Payment Confirmed!</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Thank you! Your payment of <strong>${(total + lateFee).toFixed(2)}</strong> via <strong>{processor ?? "Digital Gateway"}</strong> has been confirmed. Your statement balance is settled.
                      </p>
                    </div>
                  </div>
                  
                  <Banner tone="ok" title="Billing Settle Check">
                    Receipt logged on transaction ledger. You can view it under the Compliance Helper tab.
                  </Banner>

                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    <Button variant="secondary" onClick={() => {
                      setPaymentMethod(null);
                      setPaymentStatus("idle");
                      setProcessor(null);
                    }}>
                      Reset Payment Settle
                    </Button>
                    <Link to="/admin-compliance">
                      <Button variant="primary">Proceed to Admin Compliance →</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-5"><h2 className="font-display text-lg font-semibold text-slate-800">Payment Preferences</h2></div>
          <div className="space-y-4 p-5">
            <Toggle on={autopay} onChange={setAutopay} icon={<Repeat className="h-4 w-4" />} title="Autopay" subtitle="Set up recurring payments on the 1st" />
            <Toggle on={reportCredit} onChange={setReportCredit} icon={<TrendingUp className="h-4 w-4" />} title="Help build your credit score" subtitle="Report on-time rent payments to bureaus" />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-800">Roommate share splits</h2>
            <Pill tone={totalPct === 100 ? "emerald" : "amber"}>{totalPct}% allocated</Pill>
          </div>
        </div>
        <div className="p-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              {roommates.map((r, idx) => (
                <div key={r.id} className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <div className="text-sm text-slate-700 truncate max-w-[200px]" title={r.email}>{r.email}{idx === 0 && <span className="ml-2 text-xs text-slate-400">(you)</span>}</div>
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={100} value={r.pct} onChange={(e) => {
                      const v = Number(e.target.value);
                      setRoommates((arr) => arr.map((x) => x.id === r.id ? { ...x, pct: v } : x));
                    }} className="w-28 sm:w-36 accent-indigo-600" />
                    <span className="w-10 text-right text-sm font-semibold text-slate-800">{r.pct}%</span>
                    <span className="w-16 text-right text-xs text-slate-500">${((total * r.pct) / 100).toFixed(2)}</span>
                  </div>
                  {idx !== 0 && (
                    <button onClick={() => setRoommates((arr) => arr.filter((x) => x.id !== r.id))} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Input placeholder="roommate@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <Button onClick={addRoommate} variant="secondary"><Plus className="h-4 w-4" /> Invite</Button>
              </div>
              {totalPct !== 100 && <Banner tone="warn" title="Splits must total 100%">Adjust the sliders so every dollar of rent is allocated.</Banner>}
            </div>
            <div className="flex flex-col items-center justify-center min-h-[220px] md:border-l md:border-slate-100 md:pl-6">
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roommateChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {roommateChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-800">Late fee policy helper</h2>
            <Pill tone={inGrace ? "emerald" : "amber"}>{j.code} grace: {j.lateFeeGraceDays} day(s)</Pill>
          </div>
        </div>
        <div className="p-5">
          <Field label={`Days past due (${j.name})`}>
            <input type="range" min={0} max={30} value={daysLate} onChange={(e) => setDaysLate(Number(e.target.value))} className="w-full accent-amber-500" />
          </Field>
          <div className="mt-2 text-sm text-slate-600">Day {daysLate} of late period.</div>
          {inGrace ? (
            <Banner tone="ok" title={`Within ${j.code} grace period`}>No late fee accrues for the first {j.lateFeeGraceDays} days under {j.name} law.</Banner>
          ) : (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              <div className="text-sm">Late fee of <strong>${lateFee.toFixed(2)}</strong> will be auto-added on the next billing cycle.</div>
            </div>
          )}
        </div>
      </Card>
    </PageShell>
  );
}

function Toggle({ on, onChange, icon, title, subtitle }: { on: boolean; onChange: (v: boolean) => void; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <button 
      onClick={() => onChange(!on)} 
      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-300 cursor-pointer transform active:scale-[0.99] ${
        on 
          ? "border-indigo-200 bg-gradient-to-br from-indigo-50/20 to-indigo-100/5 shadow-sm" 
          : "border-slate-200/80 bg-white hover:bg-slate-50/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-xl transition-all duration-300 shadow-sm ${
          on ? "bg-indigo-100 text-indigo-700 scale-105" : "bg-slate-100 text-slate-400"
        }`}>
          {icon}
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800 leading-tight">{title}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5 leading-tight">{subtitle}</div>
        </div>
      </div>
      <span className={`relative h-6.5 w-11.5 rounded-full transition-colors duration-300 ${on ? "bg-indigo-600 shadow-[0_2px_8px_rgba(99,102,241,0.25)]" : "bg-slate-200"}`}>
        <span className={`absolute top-0.75 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${on ? "left-6" : "left-0.75"}`} />
      </span>
    </button>
  );
}

function QRCodeSVG() {
  return (
    <svg width="100" height="100" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-800 w-full h-full">
      {/* Outer frame */}
      <path d="M1 1h7v2H3v4H1V1zM21 1h7v6h-2V3h-5V1zM1 21h2v5h5v2H1v-7zM28 21v7h-7v-2h5v-5h2z" fill="currentColor" />
      {/* Finder Patterns */}
      <path d="M3 3h7v7H3V3zm1 1v5h5V4H4zM5 5h3v3H5V5z" fill="currentColor" />
      <path d="M19 3h7v7h-7V3zm1 1v5h5V4h-5zM21 5h3v3h-3V5z" fill="currentColor" />
      <path d="M3 19h7v7H3v-7zm1 1v5h5v-5H4zM5 21h3v3H5v-3z" fill="currentColor" />
      {/* Alignment Pattern */}
      <path d="M19 19h2v2h-2v-2zM21 21h2v2h-2v-2zM23 19h2v2h-2v-2zM23 23h2v2h-2v-2zM19 23h2v2h-2v-2z" fill="currentColor" />
      {/* Timing and Random Data blocks */}
      <path d="M12 3h2v2h-2V3zM15 3h2v2h-2V3zM12 6h2v2h-2V6zM15 6h2v2h-2V6zM3 12h2v2H3v-2zM6 12h2v2H6v-2zM3 15h2v2H3v-2zM6 15h2v2H6v-2z" fill="currentColor" />
      <path d="M12 12h2v2h-2v-2zM14 14h2v2h-2v-2zM16 12h2v2h-2v-2zM12 16h2v2h-2v-2z" fill="currentColor" />
      <path d="M9 12h2v2H9v-2zM9 15h2v2H9v-2zM15 9h2v2h-2V9zM12 9h2v2h-2V9z" fill="currentColor" />
    </svg>
  );
}
