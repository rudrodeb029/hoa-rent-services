import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Download, Shield, CheckCircle2, Copy, Check } from "lucide-react";
import { Banner } from "@/components/compliance/Banner";
import { Button, Card, Field, PageHeader, PageShell, Textarea } from "@/components/shared/Primitives";
import { StepHeader, StepPanel } from "@/components/shared/StepWizard";
import { ProofUpload } from "@/components/shared/ProofUpload";
import { VerificationWaitingPanel } from "@/components/shared/EscrowFlowAnimation";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/home-insurance")({
  head: () => ({
    meta: [
      { title: "Home Insurance — HOA Rent Services" },
      { name: "description", content: "Secure your home with comprehensive insurance coverage through HOA Rent Services." },
    ],
  }),
  component: HomeInsurancePage,
});

const STEPS = ["Coverage Details", "Payment", "Confirmation"];

function HomeInsurancePage() {
  const activeState = useAppStore((s) => s.activeState);
  const logPayment = useAppStore((s) => s.logPayment);
  const pageSettings = useAppStore((s) => s.pageSettings);
  const payments = useAppStore((s) => s.payments);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");

  const amount = pageSettings.homeInsuranceFee;

  // Payment states
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
      if (paymentStatus !== "confirmed") {
        setPaymentStatus("confirmed");
        setVerificationLogs((prev) => [
          ...prev,
          "Payment verified & accepted by Administrator!",
          "Home insurance coverage is now active.",
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
        classification: "home_insurance", 
        status: "pending", 
        processor: (paymentMethod ? paymentMethod.toUpperCase() : "Uploaded_Screenshot") as any, 
        state: activeState,
        tenantName: name || "Avery Tenant",
        unitAddress: unit || "US Hub",
        proofImage: fileName
      });
      setPendingPaymentId(logged.id);
    }, 6000);
  };

  return (
    <PageShell>
      <PageHeader
        title="Home Insurance"
        subtitle="Protect your home with comprehensive coverage. A one-time insurance fee secures your property."
        icon={<Shield className="h-5 w-5" />}
      />

      <Card className="mb-6 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="text-[120px] font-black text-slate-200/[0.04] tracking-widest select-none leading-none text-center">
            HOA<br/>RENT<br/>SERVICES
          </div>
        </div>

        <div className="border-b border-slate-100 p-5 relative z-10"><StepHeader steps={STEPS} current={step} /></div>
        <div className="p-6 relative z-10">
          <StepPanel keyId={step}>
            {step === 0 && (
              <div className="space-y-6">

                <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Insurance Fee</div>
                      <div className="text-xs text-slate-500 mt-0.5">One-time coverage payment</div>
                    </div>
                    <div className="text-2xl font-extrabold text-indigo-600">${amount.toFixed(2)}</div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your full legal name"><input id="hi-name" className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Renter" /></Field>
                  <Field label="Unit / Property address"><input id="hi-unit" className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. Unit 4B" /></Field>
                </div>

                {pageSettings.homeInsuranceNote && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Note</div>
                    <div className="text-xs text-slate-500 leading-relaxed italic">{pageSettings.homeInsuranceNote}</div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={() => {
                    if (!name.trim()) {
                      const el = document.getElementById('hi-name');
                      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
                      return;
                    }
                    if (!unit.trim()) {
                      const el = document.getElementById('hi-unit');
                      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
                      return;
                    }
                    setStep(1);
                  }}>Continue to Payment</Button>
                </div>
              </div>
            )}

            {step === 1 && (
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

                {paymentStatus === "idle" && (
                  <div className="space-y-5">
                    <div className="text-center">
                      <h3 className="text-sm font-semibold text-slate-800">Choose your preferred payment method</h3>
                      <p className="text-xs text-slate-500 mt-1">Insurance Fee: <strong className="text-indigo-600">${amount.toFixed(2)}</strong></p>
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
                          <div className="relative w-56 h-56 border-2 border-indigo-100 rounded-xl p-2 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                            <div className="scanner-line" />
                            {paymentMethod === "venmo" && pageSettings.payVenmoQr ? (
                              <img src={pageSettings.payVenmoQr} alt="Venmo QR" className="w-full h-full object-contain" />
                            ) : paymentMethod === "cashapp" && pageSettings.payCashAppQr ? (
                              <img src={pageSettings.payCashAppQr} alt="Cash App QR" className="w-full h-full object-contain" />
                            ) : paymentMethod === "chime" && pageSettings.payChimeQr ? (
                              <img src={pageSettings.payChimeQr} alt="Chime QR" className="w-full h-full object-contain" />
                            ) : (
                              <QRCodeSVG />
                            )}
                          </div>

                          <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              {paymentMethod === "venmo" && "Venmo Gateway"}
                              {paymentMethod === "cashapp" && "Cash App Gateway"}
                              {paymentMethod === "chime" && "Chime Digital Portal"}
                            </h4>
                            <div className="text-sm font-semibold text-slate-800">
                              Amount Due: <span className="text-indigo-600">${amount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-100 rounded-lg p-3 mt-1">
                              <span className="font-mono text-base font-bold text-slate-700 truncate select-all">
                                {paymentMethod === "venmo" && (pageSettings.payVenmoHandle || "@hoarentservices")}
                                {paymentMethod === "cashapp" && (pageSettings.payCashAppHandle || "$hoarentservices")}
                                {paymentMethod === "chime" && (pageSettings.payChimeHandle || "hoarentservices@chime.com")}
                              </span>
                              <button
                                onClick={() => copyToClipboard(
                                  paymentMethod === "venmo" ? (pageSettings.payVenmoHandle || "@hoarentservices") :
                                  paymentMethod === "cashapp" ? (pageSettings.payCashAppHandle || "$hoarentservices") : (pageSettings.payChimeHandle || "hoarentservices@chime.com")
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

                        <div className="border-t border-slate-100 pt-4">
                          <ProofUpload label="Upload your payment screenshot" onComplete={(fname) => startPaymentVerification(fname)} />
                        </div>

                        {pageSettings.paymentNote && (
                          <div className="border-t border-slate-100 pt-3">
                            <div className="text-xs font-semibold text-slate-600 mb-1">Payment Note</div>
                            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg italic">
                              {pageSettings.paymentNote}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex justify-start pt-2">
                      <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                    </div>
                  </div>
                )}

                {paymentStatus === "waiting" && (
                  <VerificationWaitingPanel
                    logs={verificationLogs}
                    title="Verifying your insurance payment..."
                    subtitle="We're verifying your uploaded receipt to activate your home insurance coverage."
                  />
                )}

                {paymentStatus === "confirmed" && (
                  <div className="text-center py-8 space-y-4 max-w-md mx-auto">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-800">Insurance Payment Verified!</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Your home insurance has been confirmed. Your coverage is now active.
                      </p>
                    </div>
                    <Button className="w-full" variant="success" onClick={() => setStep(2)}>
                      Continue to Confirmation
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="text-center py-8 space-y-6 max-w-md mx-auto">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Home Insurance Active!</h3>
                  <p className="text-sm text-slate-500 mt-1">Your home insurance coverage has been successfully activated. You are now protected.</p>
                </div>

                <Banner tone="ok" title="Coverage Confirmed">
                  Thank you for connecting with us. Your home insurance coverage is active immediately.
                </Banner>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <Button variant="ghost" onClick={() => { setStep(0); setName(""); setUnit(""); setPaymentStatus("idle"); setPaymentMethod(null); setPendingPaymentId(null); setVerificationLogs([]); }}>New Insurance</Button>
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
