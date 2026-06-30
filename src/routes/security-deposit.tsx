import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Download, Landmark, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, Copy, Check } from "lucide-react";
import { Banner } from "@/components/compliance/Banner";
import { Button, Card, Field, Input, PageHeader, PageShell, Pill, Select } from "@/components/shared/Primitives";
import { useAppStore } from "@/lib/store";
import { JURISDICTIONS, describeInterest, effectiveAPR, STATE_CODES, type StateCode } from "@/lib/compliance";
import { EscrowFlowAnimation, VerificationWaitingPanel } from "@/components/shared/EscrowFlowAnimation";
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
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "uploading" | "waiting" | "confirmed">("idle");
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [processor, setProcessor] = useState<string | null>(null);
  const [funded, setFunded] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);

  const pendingPayment = pendingPaymentId ? payments.find((p) => p.id === pendingPaymentId) : null;
  useEffect(() => {
    if (pendingPayment && (pendingPayment.status === "completed" || pendingPayment.status === "held")) {
      if (paymentStatus !== "confirmed") {
        setFunded(true);
        setPaymentStatus("confirmed");
        setVerificationLogs((prev) => [
          ...prev,
          "Payment verified & accepted by Administrator!",
          "Escrow trust account funded successfully.",
        ]);
        const formattedProcessor = paymentMethod
          ? `${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} (Admin Confirmed)`
          : "Admin Confirmed Receipt";
        setProcessor(formattedProcessor);
      }
    } else if (pendingPayment && pendingPayment.status === "failed") {
      if (paymentStatus !== "idle") {
        setPaymentStatus("idle");
        setVerificationLogs([]);
        setPendingPaymentId(null);
        alert("Payment proof was rejected by the administrator. Please re-submit your receipt.");
      }
    }
  }, [pendingPayment, paymentMethod, paymentStatus]);

  const tiers = useMemo(() => {
    return [
      { key: "half", label: "Half-month deposit", multiplier: 0.5 },
      { key: "full", label: "Full-month deposit", multiplier: 1 },
    ];
  }, []);

  const amount = rent * (tier === "half" ? 0.5 : 1);
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
            <div className="grid gap-3 sm:grid-cols-2">
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
                }

                return (
                  <button
                    key={t.key}
                    onClick={() => setTier(t.key)}
                    className={`relative rounded-xl border p-4 text-left transition-all duration-300 transform cursor-pointer ${btnStyle}`}
                  >
                    <span className={`absolute top-2 right-2 h-1.5 w-1.5 rounded-full ${
                      t.key === "half" ? "bg-emerald-500" : "bg-indigo-500"
                    } ${active ? "bg-white scale-125 ring-2 ring-white/30" : "opacity-60"}`} />

                    <div className={`text-[10px] font-bold uppercase tracking-wider ${titleStyle}`}>{t.label}</div>
                    <div className={`mt-1 font-display text-2xl font-extrabold tracking-tight ${valStyle}`}>${v.toFixed(2)}</div>

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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                          {pageSettings.paymentGateways.map((gw) => {
                            const active = paymentMethod === gw.id;
                            let activeStyles = "border-indigo-600 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 text-white font-bold shadow-[0_8px_20px_rgba(99,102,241,0.3)] ring-2 ring-indigo-400/40 scale-[1.04] z-10";
                            let inactiveStyles = "border-slate-200/80 bg-gradient-to-br from-slate-50/20 to-slate-100/10 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/30 hover:scale-[1.02] hover:-translate-y-0.5";
                            
                            if (gw.name.toLowerCase().includes("venmo")) {
                              if (active) activeStyles = "border-blue-600 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white font-bold shadow-[0_8px_20px_rgba(59,130,246,0.3)] ring-2 ring-blue-400/40 scale-[1.04] z-10";
                              else inactiveStyles = "border-slate-200/80 bg-gradient-to-br from-blue-50/20 to-blue-100/10 text-[#008CFF] hover:border-blue-400 hover:bg-blue-50/30 hover:scale-[1.02] hover:-translate-y-0.5";
                            } else if (gw.name.toLowerCase().includes("cash")) {
                              if (active) activeStyles = "border-emerald-600 bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 text-white font-bold shadow-[0_8px_20px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400/40 scale-[1.04] z-10";
                              else inactiveStyles = "border-slate-200/80 bg-gradient-to-br from-emerald-50/20 to-emerald-100/10 text-[#00D632] hover:border-emerald-400 hover:bg-emerald-50/30 hover:scale-[1.02] hover:-translate-y-0.5";
                            } else if (gw.name.toLowerCase().includes("chime")) {
                              if (active) activeStyles = "border-teal-600 bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 text-white font-bold shadow-[0_8px_20px_rgba(20,184,166,0.3)] ring-2 ring-teal-400/40 scale-[1.04] z-10";
                              else inactiveStyles = "border-slate-200/80 bg-gradient-to-br from-teal-50/20 to-teal-100/10 text-[#25C974] hover:border-teal-400 hover:bg-teal-50/30 hover:scale-[1.02] hover:-translate-y-0.5";
                            } else if (gw.name.toLowerCase().includes("zelle")) {
                              if (active) activeStyles = "border-purple-600 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white font-bold shadow-[0_8px_20px_rgba(147,51,234,0.3)] ring-2 ring-purple-400/40 scale-[1.04] z-10";
                              else inactiveStyles = "border-slate-200/80 bg-gradient-to-br from-purple-50/20 to-purple-100/10 text-purple-600 hover:border-purple-400 hover:bg-purple-50/30 hover:scale-[1.02] hover:-translate-y-0.5";
                            }

                            return (
                              <button
                                key={gw.id}
                                onClick={() => setPaymentMethod(gw.id)}
                                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 sm:p-4.5 transition-all duration-300 transform cursor-pointer ${
                                  active ? activeStyles : inactiveStyles
                                }"
                              >
                                <span className="text-xs sm:text-lg font-extrabold tracking-tight">{gw.name}</span>
                              </button>
                            );
                          })}
                        </div>

              {paymentMethod && (
                <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-4">
                  {(() => {
                    const selectedGateway = pageSettings.paymentGateways.find(g => g.id === paymentMethod);
                    if (!selectedGateway) return null;
                    return (
                      <div className="flex flex-col sm:flex-row gap-6 items-center">
                        {/* QR Code Scan Container */}
                        <div className="relative w-56 h-56 border-2 border-indigo-100 rounded-xl p-2 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                          <div className="scanner-line" />
                          {selectedGateway.qrCode ? (
                            <img src={selectedGateway.qrCode} alt={`${selectedGateway.name} QR`} className="w-full h-full object-contain" />
                          ) : (
                            <QRCodeSVG />
                          )}
                        </div>

                        {/* Details */}
                        <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {selectedGateway.name} Gateway
                          </h4>
                          <div className="text-sm font-semibold text-slate-800">
                            Amount Due: <span className="text-indigo-600">${amount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-100 rounded-lg p-3 mt-1">
                            <span className="font-mono text-base font-bold text-slate-700 truncate select-all">
                              {selectedGateway.handle}
                            </span>
                            <button
                              onClick={() => copyToClipboard(selectedGateway.handle)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500"
                              title="Copy Handle"
                            >
                              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            <a
                              href={(() => {
                                const raw = selectedGateway.handle.trim();
                                if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
                                if (raw.includes("/") || (raw.includes(".") && !raw.includes("@"))) return `https://${raw}`;
                                const name = selectedGateway.name.toLowerCase();
                                if (name.includes("venmo")) return `https://venmo.com/${raw.replace(/^@/, '')}`;
                                if (name.includes("cash")) return `https://cash.app/${raw.startsWith('$') ? raw : '$' + raw}`;
                                if (raw.includes("@")) return `mailto:${raw}`;
                                return `https://${raw}`;
                              })()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
                            >
                              Pay
                            </a>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            Scan the QR code or pay to the handle above. Take a screenshot of your payment confirmation receipt and upload it below.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Screenshot proof upload */}
                  <div className="border-t border-slate-100 pt-4">
                    {overCap ? (
                      <Banner tone="warn" title="Deposit cap violation block">
                        Adjust monthly rent or deposit tier to stay within compliance limits before paying.
                      </Banner>
                    ) : (
                      <ProofUpload label="Upload your payment screenshot" onComplete={(fname) => startPaymentVerification(fname)} />
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-3">
                    <div className="text-xs font-extrabold text-amber-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">⚠️ Payment Note</div>
                    <div className="text-sm font-bold text-amber-900 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-xl">
                      {pageSettings.paymentNote || "No additional instructions provided."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentStatus === "waiting" && (
            <VerificationWaitingPanel
              logs={verificationLogs}
              title="Confirming your payment with care..."
              subtitle="We are verifying your transaction proof to secure your escrow account right away."
            />
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
                    Thank you! Your deposit has been verified and your escrow trust account has been funded.
                  </p>
                </div>
              </div>

              <EscrowFlowAnimation amount={amount} bankName={(processor ?? bankName) || "HOA Rent Services Escrow"} />

              <Banner tone="ok" title="Your process is complete">
                Thank you for connecting with us. Your trust account is active and secured.
              </Banner>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Link to="/home-insurance">
                  <Button variant="success">Proceed to Home Insurance →</Button>
                </Link>
              </div>
            </div>
          )}
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
