import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Download, Landmark, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, Copy, Check } from "lucide-react";
import { Banner } from "@/components/compliance/Banner";
import { Button, Card, Field, Input, PageHeader, PageShell, Pill, Select } from "@/components/shared/Primitives";
import { useAppStore } from "@/lib/store";
import { JURISDICTIONS, describeInterest, effectiveAPR, STATE_CODES, type StateCode } from "@/lib/compliance";
import { EscrowFlowAnimation } from "@/components/shared/EscrowFlowAnimation";
import { ProofUpload } from "@/components/shared/ProofUpload";
import { downloadEscrowDisclosure } from "@/lib/pdf";
import { Tex } from "@/components/shared/Tex";

export const Route = createFileRoute("/security-deposit")({
  head: () => ({
    meta: [
      { title: "Security Deposits — HOA Rent Services" },
      { name: "description", content: "Configure escrow accounts, process deposit payments, and generate interest tracking disclosures." },
    ],
  }),
  component: DepositPage,
});

function DepositPage() {
  const activeState = useAppStore((s) => s.activeState);
  const setActiveState = useAppStore((s) => s.setActiveState);
  const logPayment = useAppStore((s) => s.logPayment);
  const pageSettings = useAppStore((s) => s.pageSettings);
  const payments = useAppStore((s) => s.payments);
  const j = JURISDICTIONS[activeState];

  const [rent, setRent] = useState(0);
  const [tier, setTier] = useState<string>("full");
  const [tenant, setTenant] = useState("");
  
  // Default values since we removed Step 2 inputs - initialized from admin config
  const [bankName, setBankName] = useState(pageSettings.securityBankName);
  const [bankAddress, setBankAddress] = useState(pageSettings.securityBankAddress);
  
  useEffect(() => {
    setBankName(pageSettings.securityBankName);
    setBankAddress(pageSettings.securityBankAddress);
  }, [pageSettings.securityBankName, pageSettings.securityBankAddress]);

  const [routing, setRouting] = useState("026009593");
  
  // Payment states matching app-fee page
  const [paymentMethod, setPaymentMethod] = useState<"cashapp" | "venmo" | "chime" | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "uploading" | "waiting" | "confirmed">("idle");
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [processor, setProcessor] = useState<string | null>(null);
  const [funded, setFunded] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);

  const pendingPayment = pendingPaymentId ? payments.find((p) => p.id === pendingPaymentId) : null;
  useEffect(() => {
    if (pendingPayment && pendingPayment.status === "completed") {
      setPaymentStatus((currStatus) => {
        if (currStatus !== "confirmed") {
          setFunded(true);
          setVerificationLogs((prev) => [
            ...prev,
            "Payment verified & accepted by Administrator!",
            "Escrow trust account funded successfully.",
          ]);
          const formattedProcessor = paymentMethod
            ? `${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} (Admin Confirmed)`
            : "Admin Confirmed Receipt";
          setProcessor(formattedProcessor);
          return "confirmed";
        }
        return currStatus;
      });
    } else if (pendingPayment && pendingPayment.status === "failed") {
      setPaymentStatus((currStatus) => {
        if (currStatus !== "idle") {
          setVerificationLogs([]);
          setPendingPaymentId(null);
          alert("Payment proof was rejected by the administrator. Please re-submit your receipt.");
          return "idle";
        }
        return currStatus;
      });
    }
  }, [pendingPayment, paymentMethod]);

  const tiers = useMemo(() => {
    return [
      { key: "half", label: "Half-month deposit", multiplier: 0.5 },
      { key: "full", label: "Full-month deposit", multiplier: 1 },
      { key: "double", label: "Two-month deposit", multiplier: 2 },
      { key: "triple", label: "Three-month deposit", multiplier: 3 },
    ];
  }, []);

  const amount = rent * (tier === "half" ? 0.5 : tier === "full" ? 1 : tier === "double" ? 2 : tier === "triple" ? 3 : 1);
  const overCap = isFinite(j.securityDepositCapMonths) && amount > rent * j.securityDepositCapMonths;
  const apr = pageSettings.securityCustomApr !== undefined && pageSettings.securityCustomApr >= 0 ? pageSettings.securityCustomApr : effectiveAPR(j);
  const projectedInterest = amount * apr;

  const needsSegregation = j.escrowRequirement.separateAccount;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
        amount, 
        classification: "security_deposit", 
        status: "pending", 
        processor: (paymentMethod ? paymentMethod.toUpperCase() : "Uploaded_Screenshot") as any, 
        state: activeState,
        tenantName: tenant || "Avery Tenant",
        unitAddress: bankName ? `Escrow: ${bankName}` : "US Hub",
        proofImage: fileName
      });
      setPendingPaymentId(logged.id);
    }, 6000);
  };

  return (
    <PageShell>
      <PageHeader
        title="Your Security Deposit"
        subtitle="Safeguarding your security deposit with transparency. We help hold and track deposit growth in dedicated trust accounts."
        icon={<ShieldCheck className="h-5 w-5" />}
        right={
          <Select className="w-24" value={activeState} onChange={(e) => setActiveState(e.target.value as StateCode)}>
            {STATE_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        }
      />

      {overCap ? (
        <Banner tone="warn" title="Checking local deposit limits">
          {j.name} limits security deposits to a maximum of {j.securityDepositCapMonths} month(s) of rent (${(rent * j.securityDepositCapMonths).toFixed(2)}). Let's lower the tier to stay compliant.
        </Banner>
      ) : (
        <Banner tone="info" title={`Understanding your ${j.name} deposit rule`}>
          Cap: {isFinite(j.securityDepositCapMonths) ? `${j.securityDepositCapMonths} month(s) of rent` : "uncapped"}.{" "}
          {needsSegregation ? "Separate trust account required." : "Commingling permitted under state law."}{" "}
          Interest: {describeInterest(j)} Refund deadline: {j.refundDeadline.days} {j.refundDeadline.unit} days.
        </Banner>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-display text-lg font-semibold text-slate-800">1 · Let's select your deposit amount</h2>
          </div>
          <div className="p-5">
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <Field label="Monthly rent (USD)"><Input type="number" value={rent || ""} onChange={(e) => setRent(Number(e.target.value))} placeholder="e.g. 2000" /></Field>
              <Field label="Tenant"><Input value={tenant} onChange={(e) => setTenant(e.target.value)} placeholder="e.g. Avery Tenant" /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {tiers.map((t) => {
                const v = rent * t.multiplier;
                const active = tier === t.key;
                
                let btnStyle = "";
                let titleStyle = "";
                let valStyle = "";
                let descStyle = "";

                if (t.key === "half") {
                  if (active) {
                    btnStyle = "border-emerald-600 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white font-semibold shadow-[0_8px_20px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400/40 scale-[1.04] z-10";
                    titleStyle = "text-emerald-100";
                    valStyle = "text-white";
                    descStyle = "text-emerald-100/90";
                  } else {
                    btnStyle = "border-emerald-100/80 bg-gradient-to-br from-emerald-50/20 to-emerald-100/10 text-emerald-950 hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-[0_4px_12px_rgba(16,185,129,0.08)] hover:scale-[1.02] hover:-translate-y-0.5";
                    titleStyle = "text-emerald-700/80";
                    valStyle = "text-emerald-950";
                    descStyle = "text-emerald-700/70";
                  }
                } else if (t.key === "full") {
                  if (active) {
                    btnStyle = "border-indigo-600 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white font-semibold shadow-[0_8px_20px_rgba(99,102,241,0.3)] ring-2 ring-indigo-400/40 scale-[1.04] z-10";
                    titleStyle = "text-indigo-100";
                    valStyle = "text-white";
                    descStyle = "text-indigo-100/90";
                  } else {
                    btnStyle = "border-indigo-100/80 bg-gradient-to-br from-indigo-50/20 to-indigo-100/10 text-indigo-950 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-[0_4px_12px_rgba(99,102,241,0.08)] hover:scale-[1.02] hover:-translate-y-0.5";
                    titleStyle = "text-indigo-700/80";
                    valStyle = "text-indigo-950";
                    descStyle = "text-indigo-700/70";
                  }
                } else if (t.key === "double") {
                  if (active) {
                    btnStyle = "border-purple-600 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white font-semibold shadow-[0_8px_20px_rgba(168,85,247,0.3)] ring-2 ring-purple-400/40 scale-[1.04] z-10";
                    titleStyle = "text-purple-100";
                    valStyle = "text-white";
                    descStyle = "text-purple-100/90";
                  } else {
                    btnStyle = "border-purple-100/80 bg-gradient-to-br from-purple-50/20 to-purple-100/10 text-purple-950 hover:border-purple-400 hover:bg-purple-50/50 hover:shadow-[0_4px_12px_rgba(168,85,247,0.08)] hover:scale-[1.02] hover:-translate-y-0.5";
                    titleStyle = "text-purple-700/80";
                    valStyle = "text-purple-950";
                    descStyle = "text-purple-700/70";
                  }
                } else {
                  if (active) {
                    btnStyle = "border-rose-600 bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 text-white font-semibold shadow-[0_8px_20px_rgba(244,63,94,0.3)] ring-2 ring-rose-400/40 scale-[1.04] z-10";
                    titleStyle = "text-rose-100";
                    valStyle = "text-white";
                    descStyle = "text-rose-100/90";
                  } else {
                    btnStyle = "border-rose-100/80 bg-gradient-to-br from-rose-50/20 to-rose-100/10 text-rose-950 hover:border-rose-400 hover:bg-rose-50/50 hover:shadow-[0_4px_12px_rgba(244,63,94,0.08)] hover:scale-[1.02] hover:-translate-y-0.5";
                    titleStyle = "text-rose-700/80";
                    valStyle = "text-rose-950";
                    descStyle = "text-rose-700/70";
                  }
                }

                return (
                  <button
                    key={t.key}
                    onClick={() => setTier(t.key)}
                    className={`relative rounded-xl border p-4 text-left transition-all duration-300 transform cursor-pointer ${btnStyle}`}
                  >
                    <span className={`absolute top-2 right-2 h-1.5 w-1.5 rounded-full ${
                      t.key === "half" ? "bg-emerald-500" :
                      t.key === "full" ? "bg-indigo-500" :
                      t.key === "double" ? "bg-purple-500" : "bg-rose-500"
                    } ${active ? "bg-white scale-125 ring-2 ring-white/30" : "opacity-60"}`} />

                    <div className={`text-[10px] font-bold uppercase tracking-wider ${titleStyle}`}>{t.label}</div>
                    <div className={`mt-1 font-display text-2xl font-extrabold tracking-tight ${valStyle}`}>${v.toFixed(2)}</div>
                    <div className={`mt-1.5 text-xs font-medium ${descStyle}`}>{t.multiplier}× monthly rent</div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-5"><h2 className="font-display text-lg font-semibold text-slate-800">Accrued growth projection</h2></div>
          <div className="space-y-2 p-5 text-sm">
            <Row k="Deposit Principal (P)" v={`$${amount.toFixed(2)}`} />
            <Row k="APR (r)" v={`${(apr * 100).toFixed(2)}%`} />
            <Row k="Holding Period (t)" v="1 year" />
            <div className="my-3 border-t border-slate-100" />
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <Tex block>{`I = P \\times r \\times t = ${amount.toFixed(2)} \\times ${apr.toFixed(4)} \\times 1`}</Tex>
              <div className="mt-2 font-display text-xl font-semibold text-emerald-700">${projectedInterest.toFixed(2)}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-display text-lg font-semibold text-slate-800">2 · Securely fund your deposit</h2>
        </div>
        <div className="space-y-5 p-5">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes scan {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
            .scanner-line {
              position: absolute;
              width: 100%;
              height: 2px;
              background-color: #4f46e5;
              box-shadow: 0 0 8px #4f46e5;
              animation: scan 2.5s infinite linear;
            }
          `}} />

          {paymentStatus === "idle" && (
            <div className="space-y-5">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-slate-800">Choose your preferred payment method</h3>
              </div>
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
                        Amount Due: <span className="text-indigo-600">${amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-100 rounded-lg p-2 max-w-sm mt-1">
                        <span className="font-mono text-xs text-slate-700 truncate select-all">
                          {paymentMethod === "venmo" && "@hoarentservices"}
                          {paymentMethod === "cashapp" && "$hoarentservices"}
                          {paymentMethod === "chime" && "hoarentservices@chime.com"}
                        </span>
                        <button
                          onClick={() => copyToClipboard(
                            paymentMethod === "venmo" ? "@hoarentservices" :
                            paymentMethod === "cashapp" ? "$hoarentservices" : "hoarentservices@chime.com"
                          )}
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
                    {overCap ? (
                      <Banner tone="warn" title="Deposit cap violation block">
                        Adjust monthly rent or deposit tier to stay within compliance limits before paying.
                      </Banner>
                    ) : (
                      <ProofUpload onComplete={(fname) => startPaymentVerification(fname)} />
                    )}
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
                <p className="text-xs text-slate-500 mt-1">We are verifying your transaction proof to secure your escrow account right away.</p>
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
                  <h3 className="text-base font-semibold text-slate-800">Payment successfully received & verified!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Thank you! Your deposit payment of <strong>${amount.toFixed(2)}</strong> is confirmed, and your escrow trust account has been funded.
                  </p>
                </div>
              </div>

              <EscrowFlowAnimation amount={amount} bankName={(processor ?? bankName) || "HOA Rent Services Escrow"} />

              <Banner tone="ok" title="Deposit secured in escrow">
                <Pill tone="emerald">{processor ?? "Verified Digital Payment"}</Pill> Your trust account is active. You can download your shared transparency disclosure below.
              </Banner>
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-display text-lg font-semibold text-slate-800">3 · Download transparency disclosure</h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="text-sm text-slate-600">
            Download your shared transparency disclosure detailing account info, principal, and interest growth.
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => downloadEscrowDisclosure({ tenant, bankName: (processor ?? bankName) || "HOA Rent Services Escrow", bankAddress, principal: amount, apr, jurisdiction: j })}>
              <Download className="h-4 w-4" /> Escrow Disclosure PDF
            </Button>
            {paymentStatus === "confirmed" && (
              <Link to="/rent-ledger">
                <Button variant="success">Proceed to Rent & Roommates →</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {apr === 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><AlertTriangle className="h-3.5 w-3.5" />{j.name} does not require interest accrual on security deposits.</div>
      )}
    </PageShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between"><span className="text-slate-500">{k}</span><span className="font-semibold text-slate-800">{v}</span></div>
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
