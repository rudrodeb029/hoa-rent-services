import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Download, FileText, HelpCircle, Receipt, ShieldCheck, Sparkles, Send, MessageCircle, Phone, User, Home, Briefcase, Users, CheckCircle2, Loader2, Copy, Check, Info, Lock, Scale } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { JURISDICTIONS, describeAppFee, maxAppFee, STATE_CODES, type StateCode } from "@/lib/compliance";
import { AppFeeBanner, Banner } from "@/components/compliance/Banner";
import { Button, Card, CardHeader, Field, Input, PageHeader, PageShell, Pill, Select } from "@/components/shared/Primitives";
import { StepHeader, StepPanel } from "@/components/shared/StepWizard";
import { ProofUpload } from "@/components/shared/ProofUpload";
import { VerificationWaitingPanel } from "@/components/shared/EscrowFlowAnimation";
import { downloadAppFeeReceipt, downloadRentalApplication, downloadLease } from "@/lib/pdf";

export const Route = createFileRoute("/app-fee")({
  head: () => ({
    meta: [
      { title: "Application Fees — HOA Rent Services" },
      { name: "description", content: "Process background screening and tenant screening fees in compliance with state-specific limits." },
    ],
  }),
  component: AppFeePage,
});

const STEPS = ["About You", "Review & Consent", "Identity Verification", "Complete Fee", "Receipt & Documents"];

function AppFeePage() {
  const activeState = useAppStore((s) => s.activeState);
  const setActiveState = useAppStore((s) => s.setActiveState);
  const logPayment = useAppStore((s) => s.logPayment);
  const pageSettings = useAppStore((s) => s.pageSettings);
  const payments = useAppStore((s) => s.payments);
  const j = JURISDICTIONS[activeState];
  const banned = j.appFeeRule.type === "banned" || j.appFeeRule.type === "broker_only";

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [recentCheck, setRecentCheck] = useState(false);
  const [consent, setConsent] = useState(false);
  const [tab, setTab] = useState<"digital" | "upload">("digital");
  const [processor, setProcessor] = useState<string | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cashapp" | "venmo" | "chime" | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "uploading" | "waiting" | "confirmed">("idle");
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]);

  const pendingPayment = pendingPaymentId ? payments.find((p) => p.id === pendingPaymentId) : null;
  useEffect(() => {
    if (pendingPayment && pendingPayment.status === "completed") {
      if (paymentStatus !== "confirmed") {
        setPaymentStatus("confirmed");
        setVerificationLogs((prev) => [
          ...prev,
          "Payment verified & accepted by Administrator!",
          "Application screening is active.",
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

  // Standard Rental Application REV 9.1 fields (all required now)
  const [dob, setDob] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [cellPhone, setCellPhone] = useState("");

  const [residenceStreet, setResidenceStreet] = useState("");
  const [residenceCity, setResidenceCity] = useState("");
  const [residenceState, setResidenceState] = useState("");
  const [residenceZip, setResidenceZip] = useState("");
  const [lastRentPaid, setLastRentPaid] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");

  const [employerName, setEmployerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [monthlyGrossPay, setMonthlyGrossPay] = useState("");

  const [numAdults, setNumAdults] = useState(1);
  const [numPets, setNumPets] = useState(0);

  const [dlFrontFile, setDlFrontFile] = useState<string | null>(null);
  const [dlBackFile, setDlBackFile] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<string | null>(null);
  const idVerified = dlFrontFile !== null && dlBackFile !== null && selfieFile !== null;

  const [refName, setRefName] = useState("");
  const [refPhone, setRefPhone] = useState("");
  const [refRel, setRefRel] = useState("");

  const [smoke, setSmoke] = useState("No");
  const [bankruptcy, setBankruptcy] = useState("No");
  const [felony, setFelony] = useState("No");
  const [eviction, setEviction] = useState("No");

  const [copied, setCopied] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<string | null>(null);

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
        classification: "application_fee", 
        status: "pending", 
        processor: (paymentMethod ? paymentMethod.toUpperCase() : "Uploaded_Screenshot") as any, 
        state: activeState,
        tenantName: name || "Avery Tenant",
        unitAddress: zip ? `ZIP: ${zip}` : "US Hub",
        proofImage: fileName
      });
      setPendingPaymentId(logged.id);
    }, 6000);
  };

  const calculatedAmount = useMemo(() => {
    if (banned) return 0;
    const perAdult = activeState === "NY" ? 29.99 : 99.99;
    return perAdult * numAdults;
  }, [banned, activeState, numAdults]);

  const [manualFeeOverride, setManualFeeOverride] = useState<number | null>(null);
  const amount = manualFeeOverride !== null ? manualFeeOverride : calculatedAmount;

  // Validation: ensure all core fields of the standard rental application are filled out
  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      email.includes("@") &&
      zip.length >= 5 &&
      !banned &&
      dob !== "" &&
      driverLicense.trim().length > 0 &&
      cellPhone.trim().length > 0 &&
      residenceStreet.trim().length > 0 &&
      residenceCity.trim().length > 0 &&
      residenceState.trim().length > 0 &&
      residenceZip.trim().length > 0 &&
      employerName.trim().length > 0 &&
      occupation.trim().length > 0 &&
      monthlyGrossPay.trim().length > 0
    );
  }, [
    name, email, zip, banned, dob, driverLicense, cellPhone,
    residenceStreet, residenceCity, residenceState, residenceZip,
    employerName, occupation, monthlyGrossPay
  ]);

  // Compliance auditing for actual calculated application fee
  const auditReport = useMemo(() => {
    const limit = maxAppFee(j);
    
    if (banned) {
      return {
        compliant: false,
        title: `🚨 Application Fee — Banned in ${j.name}`,
        message: `${j.name} landlord-tenant laws prohibit landlords from charging tenant application fees. HOA Rent Services has auto-adjusted the charge to $0.00.`,
      };
    }
    
    if (j.appFeeRule.type === "capped" && calculatedAmount > limit) {
      return {
        compliant: false,
        title: `🚨 Non-Compliant Fee ($${calculatedAmount.toFixed(2)}) — Capped in ${j.name}`,
        message: `${j.name} statutory code caps tenant screening fees at $${limit.toFixed(2)} per adult. The calculated fee of $${calculatedAmount.toFixed(2)} exceeds this cap. HOA Rent Services has automatically adjusted the invoice to the legal limit of $${limit.toFixed(2)}.`,
      };
    }
    
    return {
      compliant: true,
      title: `✅ Compliant Fee ($${calculatedAmount.toFixed(2)}) — Approved in ${j.name}`,
      message: `The $${calculatedAmount.toFixed(2)} screening fee is compliant with local limits in ${j.name} (Cap: ${limit ? `$${limit.toFixed(2)}` : "Cost reimbursement limit"}).`,
    };
  }, [j, banned, calculatedAmount]);

  return (
    <PageShell>
      <PageHeader
        title="Fair Application Fees"
        subtitle="Complete your application details transparently. We dynamically honor local legal limits to protect you."
        icon={<Receipt className="h-5 w-5" />}
        right={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Jurisdiction</span>
            <Select value={activeState} onChange={(e) => setActiveState(e.target.value as StateCode)} className="w-24">
              {STATE_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        }
      />

      <div className="mb-6"><AppFeeBanner state={activeState} /></div>

      <Card className="mb-6 relative overflow-hidden">
        {/* Large Transparent Background Logo — Fixed */}
        <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-0 overflow-hidden">
          <svg className="w-[420px] h-[420px] text-indigo-500/[0.06]" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M3 21h18v-2H3v2zm0-4h18v-9l-9-7-9 7v9zm2-2v-5.5l7-5.44 7 5.44V15H5z" />
            <path d="M7 10h10v1H7zM7 6l5-4 5 4" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </svg>
          <div className="mt-2 text-[48px] font-black text-slate-300/[0.06] tracking-[0.25em] select-none leading-none text-center">
            HOA RENT SERVICES
          </div>
        </div>
        <div className="border-b border-slate-100 p-5">
          <StepHeader steps={STEPS} current={step} />
        </div>
        <div className="p-6 relative z-10">
          <StepPanel keyId={step}>
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-3">
                    <Info className="h-4 w-4 text-indigo-600 shrink-0" />
                    <h3 className="font-display text-sm font-semibold tracking-wider text-slate-800">Basic Information</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full Legal Name"><Input id="field-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Renter" /></Field>
                    <Field label="Email"><Input id="field-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@example.com" /></Field>
                    <Field label="ZIP"><Input id="field-zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="10024" /></Field>
                    <Field label="State">
                      <Select value={activeState} onChange={(e) => setActiveState(e.target.value as StateCode)}>
                        {STATE_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </Select>
                    </Field>
                    {j.appFeeRule.type === "capped" && j.appFeeRule.waivable && (
                      <label className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <input type="checkbox" checked={recentCheck} onChange={(e) => setRecentCheck(e.target.checked)} className="mt-0.5" />
                        <span className="text-sm text-slate-700">
                          I will provide a recent (≤30 day) background check.{" "}
                          <span className="font-semibold text-emerald-700">Fee waived under {j.code} law.</span>
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-6 border-t border-slate-100 pt-6">
                  <div>
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-3">
                      <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                      <h3 className="font-display text-sm font-semibold tracking-wider text-slate-800">Household</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Number of Adults"><Input type="number" min="1" value={numAdults} onChange={(e) => setNumAdults(Math.max(1, Number(e.target.value)))} /></Field>
                      <Field label="Number of Pets"><Input type="number" min="0" value={numPets} onChange={(e) => setNumPets(Math.max(0, Number(e.target.value)))} /></Field>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-3">
                      <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                      <h3 className="font-display text-sm font-semibold tracking-wider text-slate-800">Personal Details</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Date of Birth"><Input id="field-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
                      <Field label="Driver's License #"><Input id="field-dl" placeholder="DL-12345678" value={driverLicense} onChange={(e) => setDriverLicense(e.target.value)} /></Field>
                      <Field label="Cell Phone"><Input id="field-phone" placeholder="(555) 000-0000" value={cellPhone} onChange={(e) => setCellPhone(e.target.value)} /></Field>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-3">
                      <Home className="h-4 w-4 text-indigo-600 shrink-0" />
                      <h3 className="font-display text-sm font-semibold tracking-wider text-slate-800">Home & Rental History</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field label="Street Address"><Input id="field-street" placeholder="123 Main St" value={residenceStreet} onChange={(e) => setResidenceStreet(e.target.value)} /></Field>
                      </div>
                      <Field label="City"><Input id="field-city" placeholder="New York" value={residenceCity} onChange={(e) => setResidenceCity(e.target.value)} /></Field>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="State"><Input id="field-rstate" placeholder="NY" value={residenceState} onChange={(e) => setResidenceState(e.target.value)} /></Field>
                        <Field label="ZIP"><Input id="field-rzip" placeholder="10001" value={residenceZip} onChange={(e) => setResidenceZip(e.target.value)} /></Field>
                      </div>
                      <Field label="Last Rent Amount Paid"><Input type="number" placeholder="2500" value={lastRentPaid} onChange={(e) => setLastRentPaid(e.target.value)} /></Field>
                      <Field label="Owner/Manager Phone"><Input placeholder="(555) 999-9999" value={landlordPhone} onChange={(e) => setLandlordPhone(e.target.value)} /></Field>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-3">
                      <Briefcase className="h-4 w-4 text-indigo-600 shrink-0" />
                      <h3 className="font-display text-sm font-semibold tracking-wider text-slate-800">Work & Earnings</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Employer Name"><Input id="field-employer" placeholder="Acme Inc" value={employerName} onChange={(e) => setEmployerName(e.target.value)} /></Field>
                      <Field label="Company Name"><Input placeholder="Acme Corp LLC" value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></Field>
                      <Field label="Occupation"><Input id="field-occupation" placeholder="Software Engineer" value={occupation} onChange={(e) => setOccupation(e.target.value)} /></Field>
                      <Field label="Monthly Gross Pay ($)"><Input id="field-pay" type="number" placeholder="8000" value={monthlyGrossPay} onChange={(e) => setMonthlyGrossPay(e.target.value)} /></Field>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-3">
                      <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                      <h3 className="font-display text-sm font-semibold tracking-wider text-slate-800">Personal References (Optional)</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Name"><Input placeholder="Jane Doe" value={refName} onChange={(e) => setRefName(e.target.value)} /></Field>
                      <Field label="Relationship"><Input placeholder="Mother" value={refRel} onChange={(e) => setRefRel(e.target.value)} /></Field>
                      <Field label="Phone"><Input placeholder="(555) 888-8888" value={refPhone} onChange={(e) => setRefPhone(e.target.value)} /></Field>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-3">
                      <HelpCircle className="h-4 w-4 text-indigo-600 shrink-0" />
                      <h3 className="font-display text-sm font-semibold tracking-wider text-slate-800">Background Questionnaire</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Do any occupants smoke?">
                        <Select value={smoke} onChange={(e) => setSmoke(e.target.value)}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </Select>
                      </Field>
                      <Field label="Have you ever filed for bankruptcy?">
                        <Select value={bankruptcy} onChange={(e) => setBankruptcy(e.target.value)}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </Select>
                      </Field>
                      <Field label="Have you ever been convicted of a felony?">
                        <Select value={felony} onChange={(e) => setFelony(e.target.value)}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </Select>
                      </Field>
                      <Field label="Have you ever been evicted?">
                        <Select value={eviction} onChange={(e) => setEviction(e.target.value)}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </Select>
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <Button onClick={() => {
                    if (!canSubmit) {
                      const fields = [
                        { val: name, id: 'field-name' },
                        { val: email, id: 'field-email' },
                        { val: zip, id: 'field-zip' },
                        { val: dob, id: 'field-dob' },
                        { val: driverLicense, id: 'field-dl' },
                        { val: cellPhone, id: 'field-phone' },
                        { val: residenceStreet, id: 'field-street' },
                        { val: residenceCity, id: 'field-city' },
                        { val: residenceState, id: 'field-rstate' },
                        { val: residenceZip, id: 'field-rzip' },
                        { val: employerName, id: 'field-employer' },
                        { val: occupation, id: 'field-occupation' },
                        { val: monthlyGrossPay, id: 'field-pay' },
                      ];
                      const missing = fields.find(f => !f.val || (typeof f.val === 'string' && f.val.trim().length === 0));
                      if (missing) {
                        const el = document.getElementById(missing.id);
                        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
                      }
                      return;
                    }
                    setStep(1);
                  }}>Continue</Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                {/* Form REV 9.1 Compliance Audit Banner */}
                <div className={`rounded-xl border p-4 flex gap-3 ${auditReport.compliant ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
                  <div className="text-xl">
                    {auditReport.compliant ? "✅" : "⚠️"}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{auditReport.title}</div>
                    <div className="text-xs mt-0.5 leading-relaxed">{auditReport.message}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-700">Itemized Invoice</div>
                    <Pill tone="indigo">{activeState}</Pill>
                  </div>
                  <div className="mt-3 divide-y divide-slate-200 text-sm">
                    <div className="flex justify-between py-2">
                      <span>{numAdults} adult(s) × ${activeState === "NY" ? "29.99" : "99.99"}/adult</span>
                      <span>${amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Credit & reference verification</span>
                      <span>included</span>
                    </div>
                    <div className="flex justify-between py-2 font-semibold text-slate-900">
                      <span>Total due</span>
                      <span>${amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span>Please double-check your application details</span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Section 1: Applicant Details */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold tracking-wider text-indigo-700">
                        <User className="h-3.5 w-3.5" />
                        <span>Your Personal Profile</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div>
                          <span className="block font-semibold text-slate-500">Full Legal Name</span>
                          <span className="text-slate-800 font-medium">{name || "—"}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Email Address</span>
                          <span className="text-slate-800 font-medium break-all">{email || "—"}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Date of Birth</span>
                          <span className="text-slate-800 font-medium">{dob || "—"}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Cell Phone</span>
                          <span className="text-slate-800 font-medium">{cellPhone || "—"}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Driver's License #</span>
                          <span className="text-slate-800 font-medium">{driverLicense || "—"}</span>
                        </div>

                      </div>
                    </div>

                    {/* Section 2: Residence History */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold tracking-wider text-indigo-700">
                        <Home className="h-3.5 w-3.5" />
                        <span>Your Residential History</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="col-span-2">
                          <span className="block font-semibold text-slate-500">Street Address</span>
                          <span className="text-slate-800 font-medium">{residenceStreet || "—"}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">City / State / ZIP</span>
                          <span className="text-slate-800 font-medium">
                            {residenceCity && residenceState && residenceZip 
                              ? `${residenceCity}, ${residenceState} ${residenceZip}` 
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Last Rent Amount</span>
                          <span className="text-slate-800 font-medium">
                            {lastRentPaid ? `$${parseFloat(lastRentPaid).toLocaleString()}` : "—"}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="block font-semibold text-slate-500">Landlord/Manager Phone</span>
                          <span className="text-slate-800 font-medium">{landlordPhone || "—"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Employment & Income */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold tracking-wider text-indigo-700">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>Your Employment & Earnings</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div>
                          <span className="block font-semibold text-slate-500">Employer Name</span>
                          <span className="text-slate-800 font-medium">{employerName || "—"}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Company Name</span>
                          <span className="text-slate-800 font-medium">{companyName || "—"}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Occupation</span>
                          <span className="text-slate-800 font-medium">{occupation || "—"}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Monthly Gross Income</span>
                          <span className="text-slate-800 font-medium">
                            {monthlyGrossPay ? `$${parseFloat(monthlyGrossPay).toLocaleString()}` : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">ZIP / State</span>
                          <span className="text-slate-800 font-medium">{zip} / {activeState}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Relative Reference */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold tracking-wider text-indigo-700">
                        <Users className="h-3.5 w-3.5" />
                        <span>Your Personal References (Optional)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div>
                          <span className="block font-semibold text-slate-500">Reference Name</span>
                          <span className="text-slate-800 font-medium">{refName || "—"}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Relationship</span>
                          <span className="text-slate-800 font-medium">{refRel || "—"}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="block font-semibold text-slate-500">Phone Number</span>
                          <span className="text-slate-800 font-medium">{refPhone || "—"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 5: General Disclosures / Questionnaire */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 md:col-span-2">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold tracking-wider text-indigo-700">
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>Background Questionnaire Responses</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
                        <div>
                          <span className="block font-semibold text-slate-500">Any Occupants Smoke?</span>
                          <span className={`font-semibold ${smoke === "Yes" ? "text-amber-600" : "text-emerald-600"}`}>{smoke}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Filed for Bankruptcy?</span>
                          <span className={`font-semibold ${bankruptcy === "Yes" ? "text-amber-600" : "text-emerald-600"}`}>{bankruptcy}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Convicted of a Felony?</span>
                          <span className={`font-semibold ${felony === "Yes" ? "text-amber-600" : "text-emerald-600"}`}>{felony}</span>
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-500">Ever been Evicted?</span>
                          <span className={`font-semibold ${eviction === "Yes" ? "text-amber-600" : "text-emerald-600"}`}>{eviction}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-5">
                  <div className="mb-2 text-sm font-semibold text-slate-800">Understanding Our Selection Criteria</div>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Pursuant to {j.name} law, applicants are evaluated on income (≥2.5× rent), credit history, prior tenancy references,
                    and verifiable identity. Adverse decisions trigger a written notice and right to dispute. {j.notes ?? ""}
                  </p>
                  <label className="mt-4 flex items-start gap-3">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                    <span className="text-sm text-slate-700">I have read and electronically agree to the selection criteria disclosure above.</span>
                  </label>
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                  <Button onClick={() => {
                    if (!consent) {
                      const el = document.querySelector('input[type="checkbox"]') as HTMLElement;
                      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
                      return;
                    }
                    setStep(2);
                  }}>Continue to payment</Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-base font-semibold text-slate-800">Identity Verification</h3>
                  <p className="text-xs text-slate-500 mt-1">Please upload the following documents to verify your identity before proceeding to payment.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="text-sm font-semibold text-slate-700">Driver's License (Front)</div>
                    {dlFrontFile ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg"><CheckCircle2 className="h-4 w-4" /> Uploaded</div>
                    ) : (
                      <ProofUpload label="Upload driver's license (front)" onComplete={(fname) => setDlFrontFile(fname)} />
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="text-sm font-semibold text-slate-700">Driver's License (Back)</div>
                    {dlBackFile ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg"><CheckCircle2 className="h-4 w-4" /> Uploaded</div>
                    ) : (
                      <ProofUpload label="Upload driver's license (back)" onComplete={(fname) => setDlBackFile(fname)} />
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="text-sm font-semibold text-slate-700">Selfie Photo</div>
                    {selfieFile ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg"><CheckCircle2 className="h-4 w-4" /> Uploaded</div>
                    ) : (
                      <ProofUpload label="Upload selfie photo" onComplete={(fname) => setSelfieFile(fname)} />
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => {
                    if (!idVerified) {
                      const uploads = document.querySelectorAll('.rounded-xl.border.border-slate-200.p-4');
                      for (let i = 0; i < uploads.length; i++) {
                        const hasUploaded = uploads[i].querySelector('.text-emerald-700');
                        if (!hasUploaded) { uploads[i].scrollIntoView({ behavior: 'smooth', block: 'center' }); break; }
                      }
                      return;
                    }
                    setStep(3);
                  }}>Continue to Payment</Button>
                </div>
              </div>
            )}

            {step === 3 && (
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
                {amount === 0 ? (
                  <Banner tone="ok" title="No payment required">
                    Under current {j.name} rules, no application fee is due. You may proceed directly to receipt.
                  </Banner>
                ) : (
                  <>
                    {paymentStatus === "idle" && (
                      <div className="space-y-5">
                        <div className="text-center">
                          <h3 className="text-sm font-semibold text-slate-800">Choose your preferred payment method</h3>
                          <p className="text-xs text-slate-500 mt-1">Screening Fee: <strong className="text-indigo-600">${amount.toFixed(2)}</strong>. Choose a method below to view QR and details.</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <label className="text-xs font-semibold text-slate-600">Adjust Fee:</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={amount}
                              onChange={(e) => setManualFeeOverride(Math.max(0, Number(e.target.value)))}
                              className="w-28 h-8 pl-6 pr-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
                            />
                          </div>
                          {manualFeeOverride !== null && (
                            <button
                              onClick={() => setManualFeeOverride(null)}
                              className="text-[10px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                            >
                              Reset to ${calculatedAmount.toFixed(2)}
                            </button>
                          )}
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
                              <div className="relative w-56 h-56 border-2 border-indigo-100 rounded-xl p-2 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
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
                                <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-100 rounded-lg p-3 mt-1">
                                  <span className="font-mono text-base font-bold text-slate-700 truncate select-all">
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
                              <ProofUpload label="Upload your payment screenshot" onComplete={(fname) => startPaymentVerification(fname)} />
                            </div>

                            <div className="border-t border-slate-100 pt-3 mt-3">
                              <div className="text-xs font-semibold text-slate-600 mb-1">Payment Note</div>
                              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg italic">
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
                        subtitle="We're verifying your uploaded receipt to activate your application right away."
                      />
                    )}

                    {paymentStatus === "confirmed" && (
                      <div className="text-center py-8 space-y-4 max-w-md mx-auto">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-800">Payment received & verified!</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Thank you! Your application has been successfully verified and is ready to process.
                          </p>
                        </div>
                        <Button className="w-full" variant="success" onClick={() => setStep(4)}>
                          Continue to Receipt & PDF
                        </Button>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  {paymentStatus === "idle" && <Button variant="ghost" onClick={() => { setPaymentMethod(null); setStep(2); }}>Back</Button>}
                  {amount === 0 && <Button onClick={() => { setProcessor("Waived"); setStep(4); }}>Generate receipt</Button>}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <Banner tone="ok" title="Your process is complete">
                  Thank you for connecting with us. Your application has been successfully processed.
                </Banner>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <div className="p-5 font-sans">
                      <div className="flex items-center gap-2 text-slate-700"><FileText className="h-4 w-4" /><span className="text-sm font-semibold">Download Receipt</span></div>
                      <p className="mt-1 text-xs text-slate-500">Customized invoice with regional disclosures.</p>
                      <Button className="mt-4 w-full" onClick={() => downloadAppFeeReceipt({ name, email, state: j.code, zip, amount, processor: processor ?? "—", disclosure: describeAppFee(j) + " " + (j.notes ?? "") })}>
                        <Download className="h-4 w-4" /> Receipt PDF
                      </Button>
                    </div>
                  </Card>

                  <Card>
                    <div className="p-5 font-sans">
                      <div className="flex items-center gap-2 text-slate-700"><FileText className="h-4 w-4" /><span className="text-sm font-semibold">Download Rental Application</span></div>
                      <p className="mt-1 text-xs text-slate-500">Standard Form REV 9.1 filled with your credentials.</p>
                      <Button className="mt-4 w-full" variant="success" onClick={() => downloadRentalApplication({
                        name, email, dob, driverLicense, cellPhone,
                        residenceStreet, residenceCity, residenceState, residenceZip, lastRentPaid, landlordPhone,
                        employerName, companyName, occupation, monthlyGrossPay,
                        refName, refPhone, refRel,
                        smoke, bankruptcy, felony, eviction
                      })}>
                        <Download className="h-4 w-4" /> Application PDF
                      </Button>
                    </div>
                  </Card>


                </div>

                <Card className="mt-6 border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white">
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2 text-slate-800">
                      <HelpCircle className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-semibold">HOA Rent Services Support Desk</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Need help with your screening application, transaction disputes, or compliance documentation? 
                      Reach out directly to our support agents via these official channels:
                    </p>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {/* WhatsApp */}
                      <a
                        href={`https://wa.me/${(pageSettings.supportWhatsApp || '+15550199').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 transition hover:bg-emerald-50 hover:border-emerald-200 group"
                      >
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500 text-white shadow-sm group-hover:scale-105 transition-transform">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">WhatsApp</div>
                          <div className="text-xs font-semibold text-slate-700 truncate">{pageSettings.supportWhatsApp || '+1 (555) 0199'}</div>
                        </div>
                      </a>

                      {/* Telegram */}
                      <a
                        href={`https://t.me/${(pageSettings.supportTelegram || '@hoarentservices_support').replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/40 p-3.5 transition hover:bg-sky-50 hover:border-sky-200 group"
                      >
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500 text-white shadow-sm group-hover:scale-105 transition-transform">
                          <Send className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-800">Telegram</div>
                          <div className="text-xs font-semibold text-slate-700 truncate">{pageSettings.supportTelegram || '@hoarentservices_support'}</div>
                        </div>
                      </a>

                      {/* Cell Phone */}
                      <a
                        href={`tel:${(pageSettings.supportCellPhone || '+15550100').replace(/\D/g, '')}`}
                        className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 transition hover:bg-indigo-50 hover:border-indigo-200 group"
                      >
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-500 text-white shadow-sm group-hover:scale-105 transition-transform">
                          <Phone className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">Cell Phone</div>
                          <div className="text-xs font-semibold text-slate-700 truncate">{pageSettings.supportCellPhone || '+1 (555) 0100'}</div>
                        </div>
                      </a>
                    </div>
                  </div>
                </Card>
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <Button variant="ghost" onClick={() => { setStep(0); setName(""); setEmail(""); setZip(""); setConsent(false); setProcessor(null); }}>Start new application</Button>
                  <Link to="/holding-fee">
                    <Button variant="primary">Proceed to Holding Fee →</Button>
                  </Link>
                </div>
              </div>
            )}
          </StepPanel>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryStat icon={<Receipt className="h-4 w-4" />} label="State rule" value={j.appFeeRule.type.replace("_", " ")} />
        <SummaryStat icon={<ShieldCheck className="h-4 w-4" />} label="Max collectible" value={amount === 0 ? "$0.00" : `$${maxAppFee(j).toFixed(2)}`} />
        <SummaryStat icon={<Sparkles className="h-4 w-4" />} label="Refund deadline" value={`${j.refundDeadline.days} ${j.refundDeadline.unit} days`} />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-100 p-5 bg-gradient-to-r from-slate-50/50 to-white">
          <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-slate-800">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <span className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
              Trust Protocol & How It Works
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Learn how our automated systems protect security deposits, enforce fair legal limits, and maintain a compliance audit trail.
          </p>
        </div>
        <div className="p-5 sm:p-6 bg-white">
          <div className="grid gap-6 lg:grid-cols-12 items-center">
            {/* Steps / Rules explanation */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 border border-indigo-100">1</div>
                <div>
                  <h4 className="text-xs font-bold tracking-wider text-slate-700">Dynamic state rate compliance</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Our platform queries statutory codes for all 50 US states. Rent caps, application fee limits (such as California's cap of $65.21 or New York's $20 cap), and deposit limits are auto-enforced at invoice generation.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 border border-indigo-100">2</div>
                <div>
                  <h4 className="text-xs font-bold tracking-wider text-slate-700">Transparent digital pre-authorization</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Pre-authorization holds are executed for reserving a unit. No funds are cleared or captured into bank ledger balances until electronic lease execution under ESIGN Act rules.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 border border-indigo-100">3</div>
                <div>
                  <h4 className="text-xs font-bold tracking-wider text-slate-700">PCI-DSS safe escrow segregation</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Security deposits are held in interest-bearing tenant escrow accounts, segregated from operational landlord funds, conforming strictly to separate-account laws.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 border border-indigo-100">4</div>
                <div>
                  <h4 className="text-xs font-bold tracking-wider text-slate-700">Tamper-proof audit trail ledger</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Every rental application fee, escrow deposit, and roommate split payment is timestamped and recorded into an immutable audit ledger, which can be exported anytime.
                  </p>
                </div>
              </div>
            </div>

            {/* Animated Trust Showcase */}
            <div className="lg:col-span-5 flex flex-col items-center w-full">
              <TrustVisualAnimation />
            </div>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}

function SummaryStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-500 sm:text-[10px]">{icon}{label}</div>
        <div className="mt-0.5 font-display text-xs font-semibold capitalize text-slate-900 sm:text-sm lg:text-base">{value}</div>
      </div>
    </Card>
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

function TrustVisualAnimation() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/80 bg-gradient-to-br from-slate-50/60 via-white to-emerald-50/20 p-5 md:p-6 shadow-lg flex flex-col justify-between group/main">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes circuitCenter {
          0% { stroke-dashoffset: 80; }
          100% { stroke-dashoffset: -80; }
        }
        @keyframes circuitLeft {
          0% { stroke-dashoffset: 140; }
          100% { stroke-dashoffset: -140; }
        }
        @keyframes circuitRight {
          0% { stroke-dashoffset: 140; }
          100% { stroke-dashoffset: -140; }
        }
        @keyframes shieldShine {
          0% { left: -100%; }
          50%, 100% { left: 150%; }
        }
        .shield-shine-anim {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transform: skewX(-20deg);
          animation: shieldShine 4s infinite ease-in-out;
        }
        .circuit-line-center-anim {
          stroke-dasharray: 12 28;
          animation: circuitCenter 4s infinite linear;
        }
        .circuit-line-left-anim {
          stroke-dasharray: 12 38;
          animation: circuitLeft 5s infinite linear;
        }
        .circuit-line-right-anim {
          stroke-dasharray: 12 38;
          animation: circuitRight 5s infinite linear;
        }
      `}} />

      {/* Grid Pattern Backdrop */}
      <div 
        className="absolute inset-0 opacity-[0.12] pointer-events-none z-0" 
        style={{ 
          backgroundImage: 'radial-gradient(#818cf8 1px, transparent 1px), linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)',
          backgroundSize: '16px 16px, 80px 80px, 80px 80px'
        }} 
      />

      {/* Decorative Glowing Spotlights */}
      <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-indigo-300/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-emerald-300/10 blur-2xl pointer-events-none" />

      {/* Header section of the certificate */}
      <div className="relative flex justify-between items-center z-10 border-b border-slate-100 pb-2 mb-2">
        <div>
          <div className="text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 uppercase tracking-wider">HOA RENT SERVICES</div>
        </div>
        <div className="text-right">
          <div className="text-[8px] font-mono text-emerald-600 font-bold flex items-center justify-end gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            ACTIVE ID: #HOA-77A
          </div>
        </div>
      </div>

      {/* Centerpiece & Circuit Lines */}
      <div className="relative flex flex-col items-center justify-center w-full min-h-[90px] z-10">
        {/* Animated circuit lines linking shield to cards (only on desktop screen layout) */}
        <div className="absolute inset-0 pointer-events-none hidden sm:block z-0">
          <svg className="w-full h-full" viewBox="0 0 360 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background static circuit paths */}
            <path d="M 180 35 L 180 90" stroke="#f1f5f9" strokeWidth="2" />
            <path d="M 180 35 C 180 60, 60 60, 60 90" stroke="#f1f5f9" strokeWidth="2" />
            <path d="M 180 35 C 180 60, 300 60, 300 90" stroke="#f1f5f9" strokeWidth="2" />
            
            {/* Animated glowing flows */}
            <path d="M 180 35 L 180 90" stroke="url(#circuitGradCenter)" strokeWidth="2" className="circuit-line-center-anim" />
            <path d="M 180 35 C 180 60, 60 60, 60 90" stroke="url(#circuitGradLeft)" strokeWidth="2" className="circuit-line-left-anim" />
            <path d="M 180 35 C 180 60, 300 60, 300 90" stroke="url(#circuitGradRight)" strokeWidth="2" className="circuit-line-right-anim" />

            <defs>
              <linearGradient id="circuitGradCenter" x1="0" y1="0" x2="0" y2="100%" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0" />
                <stop offset="50%" stopColor="#4f46e5" stopOpacity="1" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="circuitGradLeft" x1="0" y1="0" x2="0" y2="100%" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="circuitGradRight" x1="0" y1="0" x2="0" y2="100%" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Certified Badge emblem */}
        <div className="relative z-10 flex justify-center items-center h-20 my-1">
          <div className="absolute h-16 w-16 rounded-full bg-emerald-500/5 blur-xl animate-pulse" />
          <div className="absolute h-16 w-16 rounded-full border border-dashed border-emerald-500/20 animate-spin" style={{ animationDuration: '30s' }} />
          <div className="absolute h-14 w-14 rounded-full border border-emerald-500/10 animate-ping" style={{ animationDuration: '4s' }} />
          
          <div className="relative h-12 w-12 bg-gradient-to-b from-white to-slate-50 border border-emerald-500/30 rounded-xl flex flex-col items-center justify-center shadow-md overflow-hidden group-hover/main:border-emerald-500/50 transition-colors">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="shield-shine-anim" />
            <ShieldCheck className="h-5 w-5 text-emerald-500 drop-shadow-[0_2px_4px_rgba(16,185,129,0.2)]" />
            <span className="text-[6px] font-extrabold text-emerald-600 tracking-wider uppercase mt-0.5">CERTIFIED</span>
          </div>
        </div>
      </div>

      {/* Three Detailed Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full z-10 relative mt-2">
        {/* Digital Compliance Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 border border-slate-200 hover:bg-white hover:border-emerald-400 hover:shadow-[0_4px_20px_rgba(16,185,129,0.08)] transition-all duration-300 hover:-translate-y-0.5 group/card">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover/card:scale-110 transition-transform">
              <Scale className="h-3.5 w-3.5" />
            </div>
            <span className="text-[8px] font-bold text-slate-700 tracking-wider uppercase">Digital Compliance</span>
          </div>
          <div className="border-b border-slate-100 my-2" />
          <ul className="space-y-1.5">
            <li className="flex items-start gap-1.5 text-[8px] text-slate-500 leading-tight">
              <Check className="h-2.5 w-2.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span>Secure Document Management</span>
            </li>
            <li className="flex items-start gap-1.5 text-[8px] text-slate-500 leading-tight">
              <Check className="h-2.5 w-2.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span>HOA Regulations Adherence</span>
            </li>
            <li className="flex items-start gap-1.5 text-[8px] text-slate-500 leading-tight">
              <Check className="h-2.5 w-2.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span>Validated Digital Signatures</span>
            </li>
          </ul>
        </div>

        {/* Secure Payments Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 border border-slate-200 hover:bg-white hover:border-blue-400 hover:shadow-[0_4px_20px_rgba(59,130,246,0.08)] transition-all duration-300 hover:-translate-y-0.5 group/card">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover/card:scale-110 transition-transform">
              <Lock className="h-3.5 w-3.5" />
            </div>
            <span className="text-[8px] font-bold text-slate-700 tracking-wider uppercase">Secure Payments</span>
          </div>
          <div className="border-b border-slate-100 my-2" />
          <ul className="space-y-1.5">
            <li className="flex items-start gap-1.5 text-[8px] text-slate-500 leading-tight">
              <Check className="h-2.5 w-2.5 text-blue-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span>Data Encryption Standard</span>
            </li>
            <li className="flex items-start gap-1.5 text-[8px] text-slate-500 leading-tight">
              <Check className="h-2.5 w-2.5 text-blue-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span>256-bit Secure Transport</span>
            </li>
            <li className="flex items-start gap-1.5 text-[8px] text-slate-500 leading-tight">
              <Check className="h-2.5 w-2.5 text-blue-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span>Automated Transactions</span>
            </li>
            <li className="flex items-start gap-1.5 text-[8px] text-slate-500 leading-tight">
              <Check className="h-2.5 w-2.5 text-blue-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span>Immutable Ledger History</span>
            </li>
          </ul>
        </div>

        {/* Member Confidence Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 border border-slate-200 hover:bg-white hover:border-amber-400 hover:shadow-[0_4px_20px_rgba(245,158,11,0.08)] transition-all duration-300 hover:-translate-y-0.5 group/card">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover/card:scale-110 transition-transform">
              <Users className="h-3.5 w-3.5" />
            </div>
            <span className="text-[8px] font-bold text-slate-700 tracking-wider uppercase">Member Confidence</span>
          </div>
          <div className="border-b border-slate-100 my-2" />
          <ul className="space-y-1.5">
            <li className="flex items-start gap-1.5 text-[8px] text-slate-500 leading-tight">
              <Check className="h-2.5 w-2.5 text-amber-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span>Verified Community Trust</span>
            </li>
            <li className="flex items-start gap-1.5 text-[8px] text-slate-500 leading-tight">
              <Check className="h-2.5 w-2.5 text-amber-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span>Accurate Record Keeping</span>
            </li>
            <li className="flex items-start gap-1.5 text-[8px] text-slate-500 leading-tight">
              <Check className="h-2.5 w-2.5 text-amber-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span>Transparent Lease Auditing</span>
            </li>
            <li className="flex items-start gap-1.5 text-[8px] text-slate-500 leading-tight">
              <Check className="h-2.5 w-2.5 text-amber-500 shrink-0 mt-0.5" strokeWidth={3} />
              <span>Enhanced Resident Care</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer statistics indicator */}
      <div className="relative border-t border-slate-100 pt-4 flex flex-wrap gap-3 justify-between items-center z-10 text-[9px] font-semibold text-slate-400 mt-4">
        <span className="flex items-center gap-1.5 text-slate-500">
          <svg className="h-3 w-4.5 rounded-[1px] shadow-sm shrink-0" viewBox="0 0 74 39">
            <rect width="74" height="39" fill="#B22234"/>
            <path d="M0,3h74M0,9h74M0,15h74M0,21h74M0,27h74M0,33h74" stroke="#fff" strokeWidth="3"/>
            <rect width="30" height="21" fill="#3C3B6E"/>
            <circle cx="5" cy="4" r="0.6" fill="#fff" /><circle cx="11" cy="4" r="0.6" fill="#fff" /><circle cx="17" cy="4" r="0.6" fill="#fff" /><circle cx="23" cy="4" r="0.6" fill="#fff" />
            <circle cx="8" cy="8" r="0.6" fill="#fff" /><circle cx="14" cy="8" r="0.6" fill="#fff" /><circle cx="20" cy="8" r="0.6" fill="#fff" />
            <circle cx="5" cy="12" r="0.6" fill="#fff" /><circle cx="11" cy="12" r="0.6" fill="#fff" /><circle cx="17" cy="12" r="0.6" fill="#fff" /><circle cx="23" cy="12" r="0.6" fill="#fff" />
            <circle cx="8" cy="16" r="0.6" fill="#fff" /><circle cx="14" cy="16" r="0.6" fill="#fff" /><circle cx="20" cy="16" r="0.6" fill="#fff" />
          </svg>
          US COMPLIANT PORTAL
        </span>
        <div className="flex gap-2 text-[8px] font-bold tracking-wider">
          <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-100/50">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            SSL SECURE
          </span>
          <span className="flex items-center gap-1 text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100/50">
            <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
            ENCRYPTED
          </span>
          <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100/50">
            <span className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse" />
            VERIFIED
          </span>
        </div>
      </div>
    </div>
  );
}

