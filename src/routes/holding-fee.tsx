import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Download, AlertTriangle, FileSignature, CreditCard, ClipboardCheck, Loader2, ShieldCheck, CheckCircle2, Check, Copy } from "lucide-react";
import { Banner } from "@/components/compliance/Banner";
import { Button, Card, Field, Input, PageHeader, PageShell, Pill, Select, Textarea } from "@/components/shared/Primitives";
import { StepHeader, StepPanel } from "@/components/shared/StepWizard";
import { ProofUpload } from "@/components/shared/ProofUpload";
import { VerificationWaitingPanel } from "@/components/shared/EscrowFlowAnimation";
import { downloadHoldingAgreement } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/holding-fee")({
  head: () => ({
    meta: [
      { title: "Reserve Your Next Home — HOA Rent Services" },
      { name: "description", content: "Reserve your next home with clear agreements and transparency built on trust." },
    ],
  }),
  component: HoldingPage,
});

const STEPS = ["Reservation Details", "Our Agreement", "Secure Reservation", "Completion & Copy"];

function HoldingPage() {
  const activeState = useAppStore((s) => s.activeState);
  const logPayment = useAppStore((s) => s.logPayment);
  const pageSettings = useAppStore((s) => s.pageSettings);
  const payments = useAppStore((s) => s.payments);
  const units = useAppStore((s) => s.units);
  
  const unitOptions = useMemo(() => {
    const dbUnits = units.map(u => u.unitNumber);
    const defaults = ["4B", "210", "101", "102", "201", "202", "301", "302"];
    return Array.from(new Set([...dbUnits, ...defaults])).sort();
  }, [units]);

  const [step, setStep] = useState(0);
  const [unit, setUnit] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [terms, setTerms] = useState("");
  const [name, setName] = useState("");
  const [typedSig, setTypedSig] = useState("");
  
  // Fixed holding fee: $299 for all states (not editable)
  const amount: number = 299;

  const [authorized, setAuthorized] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  // Payment states matching app-fee page
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "uploading" | "waiting" | "confirmed">("idle");
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [processor, setProcessor] = useState<string | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);

  const pendingPayment = pendingPaymentId ? payments.find((p) => p.id === pendingPaymentId) : null;
  useEffect(() => {
    if (pendingPayment && pendingPayment.status === "completed") {
      if (paymentStatus !== "confirmed") {
        setAuthorized(true);
        setPaymentStatus("confirmed");
        setVerificationLogs((prev) => [
          ...prev,
          "Payment verified & accepted by Administrator!",
          "Holding fee escrow is active.",
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

  const signed = typedSig.trim().length > 0;

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
        classification: "holding_fee", 
        status: "pending", 
        processor: (paymentMethod ? paymentMethod.toUpperCase() : "Uploaded_Screenshot") as any, 
        state: activeState,
        tenantName: name || "Avery Tenant",
        unitAddress: unit ? `Unit ${unit}` : "US Hub",
        proofImage: fileName
      });
      setPendingPaymentId(logged.id);
    }, 6000);
  };

  return (
    <PageShell>
      <PageHeader title="Reserve Your Home" subtitle="Securely reserve a home while we prepare your lease, with clear agreements built on mutual trust." icon={<ClipboardCheck className="h-5 w-5" />} />
      <Card className="mb-6 relative overflow-hidden">
        <div className="border-b border-slate-100 p-5"><StepHeader steps={STEPS} current={step} /></div>
        <div className="p-6">
          <StepPanel keyId={step}>
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your full legal name"><Input id="hf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Renter" /></Field>
                 <Field label="Unit number">
                  <Select id="hf-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                    <option value="">Select Unit</option>
                    {unitOptions.map(opt => (
                      <option key={opt} value={opt}>Unit {opt}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Holding Fee (USD)">
                  <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800">
                    ${amount.toFixed(2)} <span className="text-xs font-normal text-slate-500">(fixed fee)</span>
                  </div>
                </Field>
                <Field label="Reservation start"><Input id="hf-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
                <Field label="Reservation end"><Input id="hf-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
                <Field label="Terms" hint="Free-form reservation terms"><Textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="e.g. 12-month lease, first month + security at signing." /></Field>
                <div className="sm:col-span-2 flex justify-end">
                  <Button onClick={() => {
                    const fields = [
                      { val: name.trim(), id: 'hf-name' },
                      { val: unit, id: 'hf-unit' },
                      { val: start, id: 'hf-start' },
                      { val: end, id: 'hf-end' },
                    ];
                    const missing = fields.find(f => !f.val);
                    if (missing) {
                      const el = document.getElementById(missing.id);
                      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
                      return;
                    }
                    setStep(1);
                  }}>Continue</Button>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><FileSignature className="h-4 w-4" /> Reservation Holding Agreement</div>
                  <p className="text-sm leading-relaxed text-slate-700">
                    On {new Date().toLocaleDateString()}, Morgan Landlord and the Prospective Tenant agree to reserve unit <strong>{unit}</strong> from <strong>{start || "—"}</strong> through <strong>{end || "—"}</strong>.
                    Tenant authorizes a $<strong>{amount.toFixed(2)}</strong> holding deposit, held pursuant to a 30-day manual authorization.
                    Funds are not debited until execution of a binding lease, and shall be refunded in full if Landlord fails to deliver the unit.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Terms: {terms}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your full legal name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Renter" /></Field>
                  <Field label="Type your name to sign" hint="Type your signature"><Input id="hf-sig" value={typedSig} onChange={(e) => setTypedSig(e.target.value)} /></Field>
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                  <Button onClick={() => {
                    if (!typedSig.trim()) {
                      const el = document.getElementById('hf-sig');
                      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
                      return;
                    }
                    setStep(2);
                  }}>Sign & continue</Button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5">
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes scan {
                    0%, 100% { top: 0%; }
                    50% { top: 100%; }
                  }
                  .scanner-line {
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #22c55e, transparent);
                    position: absolute;
                    width: 100%;
                    animation: scan 2.5s infinite linear;
                  }
                `}} />
                <Banner tone="warn" title="30-Day Manual Authorization Hold">
                  This is a card pre-authorization hold. No funds are captured until the lease is executed. The hold expires automatically after 30 days.
                </Banner>

                {amount === 0 ? (
                  <Banner tone="ok" title="No hold amount required">
                    No reservation hold fee is required at this time. You may proceed directly.
                  </Banner>
                ) : (
                  <>
                    {paymentStatus === "idle" && (
                      <div className="space-y-5">
                        <div className="text-center">
                          <h3 className="text-sm font-semibold text-slate-800">Choose your preferred payment method</h3>
                          <p className="text-xs text-slate-500 mt-1">Holding Fee: <strong className="text-indigo-600">${amount.toFixed(2)}</strong>. Select a digital gateway to view handles & QR.</p>
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
                                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 sm:p-4.5 transition-all duration-300 transform cursor-pointer ${
                                  active ? activeStyles : inactiveStyles
                                }`}
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
                              <ProofUpload label="Upload your payment screenshot" onComplete={(fname) => startPaymentVerification(fname)} />
                            </div>
                            <div className="border-t border-slate-100 pt-3 mt-3">
                              <div className="text-xs font-extrabold text-amber-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">⚠️ Payment Note</div>
                              <div className="text-sm font-bold text-amber-900 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-xl">
                                {pageSettings.paymentNote || "No additional instructions provided."}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-start pt-2">
                          <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        </div>
                      </div>
                    )}

                    {paymentStatus === "waiting" && (
                      <VerificationWaitingPanel
                        logs={verificationLogs}
                        title="Verifying secure hold reservation..."
                        subtitle="We're verifying the transaction proof screenshot on the state compliance ledger."
                      />
                    )}

                    {paymentStatus === "confirmed" && (
                      <div className="text-center py-6 space-y-4 max-w-md mx-auto">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-800">Holding Fee Funded!</h3>
                          <p className="text-xs text-slate-500 mt-1">Transaction proof verified successfully. You may proceed to view your reservation copy.</p>
                        </div>
                        <Button className="w-full" onClick={() => setStep(3)}>Proceed to Completion</Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {step === 3 && (
              <div className="space-y-5">
                <Banner tone="ok" title="Your process is complete">
                  Thank you for connecting with us. Your reservation is now secured for unit {unit}. <Pill tone="emerald">30-day reservation</Pill>
                </Banner>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <div className="p-5">
                      <div className="text-sm font-semibold text-slate-800">Your Signed Agreement</div>
                      <p className="mt-1 text-xs text-slate-500">Download a copy of your reservation agreement for safekeeping.</p>
                      <Button className="mt-3" onClick={() => downloadHoldingAgreement({ name, unit, start, end, amount })}><Download className="h-4 w-4" /> Holding Agreement PDF</Button>
                    </div>
                  </Card>
                  <Card>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><AlertTriangle className="h-4 w-4 text-amber-500" /> Need help or support?</div>
                      <p className="mt-1 text-xs text-slate-500">Open a friendly inquiry with our support desk if any questions arise.</p>
                      <Button variant="secondary" className="mt-3" onClick={() => setDisputeOpen((o) => !o)}>{disputeOpen ? "Close" : "New ticket"}</Button>
                    </div>
                  </Card>
                </div>
                {disputeOpen && (
                  <Card><div className="space-y-3 p-5">
                    <Field label="Subject"><Input placeholder="Holding deposit refund" /></Field>
                    <Field label="Details"><Textarea rows={4} placeholder="What happened?" /></Field>
                    <Button variant="danger">Submit dispute</Button>
                  </div></Card>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <Button variant="ghost" onClick={() => { setStep(0); setAuthorized(false); setName(""); setTypedSig(""); }}>New reservation</Button>
                  <Link to="/lease-signing">
                    <Button variant="primary">Proceed to Lease Signing →</Button>
                  </Link>
                </div>
              </div>
            )}
          </StepPanel>
        </div>
      </Card>
    </PageShell>
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
