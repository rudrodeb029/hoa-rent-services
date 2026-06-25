import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { 
  Settings, 
  ShieldAlert, 
  Check, 
  X, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Image as ImageIcon,
  DollarSign, 
  Building2, 
  Calendar, 
  Briefcase, 
  ArrowRight,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  Receipt,
  ClipboardCheck,
  FileSignature,
  Wallet
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Payment, PaymentStatus } from "@/lib/types";
import { PageShell, PageHeader, Card, CardHeader, Button, Field, Input, Select, Textarea, Pill } from "@/components/shared/Primitives";
import { JURISDICTIONS } from "@/lib/compliance";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const activeState = useAppStore((s) => s.activeState);
  const pageSettings = useAppStore((s) => s.pageSettings);
  const payments = useAppStore((s) => s.payments);
  const updatePageSettings = useAppStore((s) => s.updatePageSettings);
  const updatePaymentStatus = useAppStore((s) => s.updatePaymentStatus);

  const [activeTab, setActiveTab] = useState<"settings" | "payments">("payments");
  const [selectedProofPayment, setSelectedProofPayment] = useState<Payment | null>(null);

  // Setting inputs state
  const [appFeeAmount, setAppFeeAmount] = useState(pageSettings.appFeeAmount);
  const [appFeeDisclosures, setAppFeeDisclosures] = useState(pageSettings.appFeeDisclosures);
  const [holdingFeeAmount, setHoldingFeeAmount] = useState(pageSettings.holdingFeeAmount);
  const [holdingReservationDays, setHoldingReservationDays] = useState(pageSettings.holdingReservationDays);
  const [holdingLandlordName, setHoldingLandlordName] = useState(pageSettings.holdingLandlordName);
  const [leaseLandlordName, setLeaseLandlordName] = useState(pageSettings.leaseLandlordName);
  const [leaseLandlordAddress, setLeaseLandlordAddress] = useState(pageSettings.leaseLandlordAddress);
  const [leaseLandlordEmail, setLeaseLandlordEmail] = useState(pageSettings.leaseLandlordEmail);
  const [leaseFurnishedStatus, setLeaseFurnishedStatus] = useState(pageSettings.leaseFurnishedStatus);
  const [leasePetPolicy, setLeasePetPolicy] = useState(pageSettings.leasePetPolicy);
  const [securityBankName, setSecurityBankName] = useState(pageSettings.securityBankName);
  const [securityBankAddress, setSecurityBankAddress] = useState(pageSettings.securityBankAddress);
  const [securityCustomApr, setSecurityCustomApr] = useState(pageSettings.securityCustomApr * 100); // format to percent
  const [rentGraceDays, setRentGraceDays] = useState(pageSettings.rentGraceDays);
  const [rentLateFeePercent, setRentLateFeePercent] = useState(pageSettings.rentLateFeePercent);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const pendingPayments = useMemo(() => payments.filter((p) => p.status === "pending"), [payments]);
  const historicalPayments = useMemo(() => payments.filter((p) => p.status !== "pending"), [payments]);

  // Keep local fields in sync with store changes
  useEffect(() => {
    setAppFeeAmount(pageSettings.appFeeAmount);
    setAppFeeDisclosures(pageSettings.appFeeDisclosures);
    setHoldingFeeAmount(pageSettings.holdingFeeAmount);
    setHoldingReservationDays(pageSettings.holdingReservationDays);
    setHoldingLandlordName(pageSettings.holdingLandlordName);
    setLeaseLandlordName(pageSettings.leaseLandlordName);
    setLeaseLandlordAddress(pageSettings.leaseLandlordAddress);
    setLeaseLandlordEmail(pageSettings.leaseLandlordEmail);
    setLeaseFurnishedStatus(pageSettings.leaseFurnishedStatus);
    setLeasePetPolicy(pageSettings.leasePetPolicy);
    setSecurityBankName(pageSettings.securityBankName);
    setSecurityBankAddress(pageSettings.securityBankAddress);
    setSecurityCustomApr(pageSettings.securityCustomApr * 100);
    setRentGraceDays(pageSettings.rentGraceDays);
    setRentLateFeePercent(pageSettings.rentLateFeePercent);
  }, [pageSettings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");
    setTimeout(() => {
      updatePageSettings({
        appFeeAmount: Number(appFeeAmount),
        appFeeDisclosures,
        holdingFeeAmount: Number(holdingFeeAmount),
        holdingReservationDays: Number(holdingReservationDays),
        holdingLandlordName,
        leaseLandlordName,
        leaseLandlordAddress,
        leaseLandlordEmail,
        leaseFurnishedStatus,
        leasePetPolicy,
        securityBankName,
        securityBankAddress,
        securityCustomApr: Number(securityCustomApr) / 100, // format back to fractional decimal
        rentGraceDays: Number(rentGraceDays),
        rentLateFeePercent: Number(rentLateFeePercent),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    }, 800);
  };

  const handleApprove = (pId: string, classification: string) => {
    const finalStatus: PaymentStatus = classification === "security_deposit" ? "held" : "completed";
    updatePaymentStatus(pId, finalStatus);
    if (selectedProofPayment?.id === pId) {
      setSelectedProofPayment(null);
    }
  };

  const handleReject = (pId: string) => {
    updatePaymentStatus(pId, "failed");
    if (selectedProofPayment?.id === pId) {
      setSelectedProofPayment(null);
    }
  };

  return (
    <PageShell>
      <PageHeader 
        title="Admin Control Center" 
        subtitle="Manage page details, review incoming digital assets, and verify direct compliance payments." 
        icon={<Settings className="h-5 w-5 animate-spin" style={{ animationDuration: '6s' }} />}
        right={
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setActiveTab("payments")}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "payments" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Payments ({pendingPayments.length})
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                activeTab === "settings" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Page Settings
            </button>
          </div>
        }
      />

      {activeTab === "payments" ? (
        <div className="space-y-6">
          {/* Pending Approval Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-indigo-600" />
                Pending Payments needing Verification ({pendingPayments.length})
              </h2>
              {pendingPayments.length > 0 && (
                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
              )}
            </div>

            {pendingPayments.length === 0 ? (
              <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-slate-200">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Clear Ledger</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">No pending screening fees or deposits currently awaiting administrative approval.</p>
              </Card>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {pendingPayments.map((p) => (
                  <Card key={p.id} className="flex flex-col md:flex-row overflow-hidden border-slate-200/80 transition-all duration-300 hover:shadow-md hover:border-indigo-100">
                    {/* Left: payment details */}
                    <div className="p-5 flex-1 space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <Pill tone={
                            p.classification === "application_fee" ? "indigo" :
                            p.classification === "holding_fee" ? "amber" :
                            p.classification === "security_deposit" ? "emerald" : "slate"
                          }>
                            {p.classification.replace("_", " ")}
                          </Pill>
                          <span className="text-[10px] font-mono text-slate-400">ID: {p.id.slice(0, 8)}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">{p.tenantName || "Avery Tenant"}</h3>
                          <p className="text-xs text-slate-500">{p.unitAddress || "US Regional Office"}</p>
                        </div>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3 divide-y divide-slate-100 space-y-2 text-xs">
                        <div className="flex justify-between pb-2">
                          <span className="text-slate-500 font-medium">Gateway:</span>
                          <span className="text-slate-800 font-bold">{p.processor}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-slate-500 font-medium">Amount:</span>
                          <span className="text-indigo-600 font-extrabold">${p.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                          <span className="text-slate-500 font-medium">Timestamp:</span>
                          <span className="text-slate-700 font-medium">{new Date(p.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button 
                          variant="success" 
                          onClick={() => handleApprove(p.id, p.classification)}
                          className="flex-1 text-xs py-1.5"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button 
                          variant="danger" 
                          onClick={() => handleReject(p.id)}
                          className="text-xs py-1.5"
                        >
                          <X className="h-3.5 w-3.5" /> Decline
                        </Button>
                      </div>
                    </div>

                    {/* Right: Screenshot preview mock */}
                    <div className="w-full md:w-48 bg-slate-900 flex flex-col items-center justify-center p-4 border-t md:border-t-0 md:border-l border-slate-800 relative shrink-0">
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-950/60 rounded px-1.5 py-0.5 text-[9px] text-indigo-300 font-semibold border border-indigo-500/20">
                        <ImageIcon className="h-2.5 w-2.5" />
                        {p.proofImage ? p.proofImage : "receipt.png"}
                      </div>
                      
                      {/* Simulated Receipt inside phone frame */}
                      <div 
                        onClick={() => setSelectedProofPayment(p)}
                        className="w-36 h-56 rounded-xl bg-white border-2 border-slate-700 shadow-lg overflow-hidden flex flex-col justify-between p-2.5 cursor-pointer transform transition hover:scale-105 relative"
                      >
                        {p.proofImage && p.proofImage.startsWith("http") ? (
                          <img 
                            src={p.proofImage} 
                            alt="Payment Proof" 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            {/* Top App bar */}
                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                              <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-widest">{p.processor}</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </div>
                            
                            {/* Body Details */}
                            <div className="text-center my-auto space-y-1">
                              <div className="mx-auto w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Check className="h-4 w-4" />
                              </div>
                              <div className="text-[10px] font-bold text-slate-500">Transaction Complete</div>
                              <div className="text-sm font-extrabold text-slate-800">${p.amount.toFixed(2)}</div>
                              <div className="text-[7px] text-slate-400">Paid to: HOA Rent Services</div>
                            </div>

                            {/* Footer reference */}
                            <div className="pt-1.5 border-t border-slate-50 flex justify-between items-center text-[6px] text-slate-400">
                              <span>Ref: tx_{p.id.slice(0,6)}</span>
                              <span>Click to Zoom</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Historical Logs Section */}
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <h2 className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="h-4.5 w-4.5 text-slate-600" />
              Verified Payment Logs ({historicalPayments.length})
            </h2>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Tenant / Context</th>
                      <th className="px-5 py-3">Document / Type</th>
                      <th className="px-5 py-3">Method</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Proof File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                    {historicalPayments.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-800">{h.tenantName || "Seed Database Record"}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {h.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-700 capitalize">{h.classification.replace("_", " ")}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest">{h.state} Juris</div>
                        </td>
                        <td className="px-5 py-4 font-medium">{h.processor}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">${h.amount.toFixed(2)}</td>
                        <td className="px-5 py-4 text-slate-500">{new Date(h.timestamp).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          <Pill tone={
                            h.status === "completed" ? "emerald" :
                            h.status === "held" ? "indigo" :
                            h.status === "failed" ? "red" : "amber"
                          }>
                            {h.status}
                          </Pill>
                        </td>
                        <td className="px-5 py-4 text-right text-[10px] font-mono text-indigo-600">
                          {h.proofImage ? (
                            <button 
                              onClick={() => setSelectedProofPayment(h)}
                              className="hover:underline cursor-pointer flex items-center gap-1 justify-end ml-auto"
                            >
                              <ImageIcon className="h-3 w-3" />
                              {h.proofImage}
                            </button>
                          ) : (
                            <span className="text-slate-400">Database Seed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Settings Tab */
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Application Fee Card */}
            <Card>
              <CardHeader title="1. Application Fee Page Details" icon={<Receipt className="h-4.5 w-4.5" />} />
              <div className="p-5 space-y-4">
                <Field label="Default Screening Fee (USD)" hint="This amount will override the regional cap on the Application page.">
                  <Input type="number" value={appFeeAmount} onChange={(e) => setAppFeeAmount(Number(e.target.value))} />
                </Field>
                <Field label="Regional Disclosure Template" hint="Shown to the user at the bottom of the fee receipt.">
                  <Textarea rows={4} value={appFeeDisclosures} onChange={(e) => setAppFeeDisclosures(e.target.value)} />
                </Field>
              </div>
            </Card>

            {/* Holding Fee Card */}
            <Card>
              <CardHeader title="2. Holding Fee Page Details" icon={<ClipboardCheck className="h-4.5 w-4.5" />} />
              <div className="p-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Reservation Deposit (USD)">
                    <Input type="number" value={holdingFeeAmount} onChange={(e) => setHoldingFeeAmount(Number(e.target.value))} />
                  </Field>
                  <Field label="Active Reservation Days">
                    <Input type="number" value={holdingReservationDays} onChange={(e) => setHoldingReservationDays(Number(e.target.value))} />
                  </Field>
                </div>
                <Field label="Signing Landlord Name" hint="Printed on the holding deposit agreement document.">
                  <Input value={holdingLandlordName} onChange={(e) => setHoldingLandlordName(e.target.value)} />
                </Field>
              </div>
            </Card>

            {/* Lease Signing Card */}
            <Card>
              <CardHeader title="3. Lease Agreement Defaults" icon={<FileSignature className="h-4.5 w-4.5" />} />
              <div className="p-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Landlord Legal Name">
                    <Input value={leaseLandlordName} onChange={(e) => setLeaseLandlordName(e.target.value)} />
                  </Field>
                  <Field label="Notice Email Address">
                    <Input type="email" value={leaseLandlordEmail} onChange={(e) => setLeaseLandlordEmail(e.target.value)} />
                  </Field>
                </div>
                <Field label="Notice Mailing Address">
                  <Input value={leaseLandlordAddress} onChange={(e) => setLeaseLandlordAddress(e.target.value)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Furnished Status">
                    <Select value={leaseFurnishedStatus} onChange={(e) => setLeaseFurnishedStatus(e.target.value)}>
                      <option value="fully furnished">Fully Furnished</option>
                      <option value="furnished">Partially Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </Select>
                  </Field>
                  <Field label="Allowed Pet Policy">
                    <Input value={leasePetPolicy} onChange={(e) => setLeasePetPolicy(e.target.value)} />
                  </Field>
                </div>
              </div>
            </Card>

            {/* Security Deposit Card */}
            <Card>
              <CardHeader title="4. Security Deposit & Escrow" icon={<ShieldCheck className="h-4.5 w-4.5" />} />
              <div className="p-5 space-y-4">
                <Field label="Segregated Trust Bank Name">
                  <Input value={securityBankName} onChange={(e) => setSecurityBankName(e.target.value)} />
                </Field>
                <Field label="Bank Branch Address">
                  <Input value={securityBankAddress} onChange={(e) => setSecurityBankAddress(e.target.value)} />
                </Field>
                <Field label="Custom Escrow Annual Percentage Rate (APR %)" hint="Custom interest growth rate on deposits. Overrides the state default.">
                  <Input type="number" step="0.01" value={securityCustomApr} onChange={(e) => setSecurityCustomApr(Number(e.target.value))} />
                </Field>
              </div>
            </Card>

            {/* Rent & Roommates Card */}
            <Card>
              <CardHeader title="5. Rent Ledger & Roommates" icon={<Wallet className="h-4.5 w-4.5" />} />
              <div className="p-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Rent Grace Period (Days)" hint="Days allowed before late fees apply.">
                    <Input type="number" value={rentGraceDays} onChange={(e) => setRentGraceDays(Number(e.target.value))} />
                  </Field>
                  <Field label="Late Fee Rate (%)" hint="Percentage of rent charged as late fee.">
                    <Input type="number" value={rentLateFeePercent} onChange={(e) => setRentLateFeePercent(Number(e.target.value))} />
                  </Field>
                </div>
              </div>
            </Card>

            {/* Compliance Override Note */}
            <Card>
              <CardHeader title="6. Admin Compliance Rules" icon={<Building2 className="h-4.5 w-4.5" />} />
              <div className="p-5 space-y-4 text-xs text-slate-500 leading-relaxed space-y-2">
                <p>
                  State-specific rental caps, grace periods, and interest deadlines are automatically calculated on the <strong>Admin Compliance</strong> dashboard.
                </p>
                <p>
                  These values are bound to local landlord-tenant regulations across all 50 states. Custom adjustments in the tabs above will override user-facing page calculations immediately, maintaining seamless testing and demonstration flows.
                </p>
                <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-3 text-indigo-900 flex items-start gap-2 mt-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    ESIGN and Regulation Z compliance checks are automatically passed upon admin transaction validation.
                  </span>
                </div>
              </div>
            </Card>

          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
            {saveStatus === "saved" && (
              <span className="text-emerald-600 font-semibold text-xs animate-pulse flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Config saved successfully!
              </span>
            )}
            <Button type="submit" disabled={saveStatus !== "idle"} className="px-6 font-bold shadow-[0_4px_12px_rgba(79,70,229,0.2)]">
              {saveStatus === "saving" ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      )}

      {/* Screenshot Zoom Modal */}
      {selectedProofPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white border border-slate-200/80 shadow-2xl p-6 flex flex-col items-center">
            <button 
              type="button"
              onClick={() => setSelectedProofPayment(null)}
              className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="w-full text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="font-display text-base font-bold text-slate-800">Transaction Receipt Proof</h3>
              </div>

              {/* Transaction Device Frame */}
              <div className="w-full rounded-2xl border-4 border-slate-800 shadow-xl bg-slate-50 overflow-hidden flex flex-col p-4 text-left">
                {/* Status Bar */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-[8px] font-bold text-slate-400">
                  <span>SYSTEM PORTAL</span>
                  <span>10:00 AM</span>
                  <span className="flex items-center gap-1">100% <ShieldCheck className="h-2 w-2 text-emerald-500" /></span>
                </div>

                {selectedProofPayment.proofImage && selectedProofPayment.proofImage.startsWith("http") && (
                  <div className="mt-2 w-full h-48 border border-slate-200 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                    <img 
                      src={selectedProofPayment.proofImage} 
                      alt="Uploaded Receipt" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Receipt Interior */}
                <div className="space-y-4 py-4 text-xs">
                  <div className="text-center space-y-1">
                    <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="inline-block bg-emerald-50 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Approved Payment</span>
                    <h2 className="text-xl font-black text-slate-800 mt-1">${selectedProofPayment.amount.toFixed(2)}</h2>
                  </div>

                  <div className="space-y-2 divide-y divide-slate-100">
                    <div className="flex justify-between pt-1 text-[11px]">
                      <span className="text-slate-500 font-semibold">Tenant Account</span>
                      <span className="text-slate-800 font-bold">{selectedProofPayment.tenantName || "Avery Tenant"}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-[11px]">
                      <span className="text-slate-500 font-semibold">Context / Unit</span>
                      <span className="text-slate-800 font-bold">{selectedProofPayment.unitAddress || "US Hub"}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-[11px]">
                      <span className="text-slate-500 font-semibold">Document Type</span>
                      <span className="text-slate-800 font-bold capitalize">{selectedProofPayment.classification.replace("_", " ")}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-[11px]">
                      <span className="text-slate-500 font-semibold">Gateway</span>
                      <span className="text-slate-800 font-bold">{selectedProofPayment.processor}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-[11px]">
                      <span className="text-slate-500 font-semibold">Receipt File</span>
                      <span className="text-indigo-600 font-mono font-bold truncate max-w-xs">{selectedProofPayment.proofImage || "receipt.png"}</span>
                    </div>
                  </div>
                </div>

                {/* Footer seal */}
                <div className="pt-2 border-t border-slate-200 text-center text-[7px] font-bold tracking-widest text-slate-400 uppercase">
                  HOA RENT SERVICES SECURE ESCROW
                </div>
              </div>

              {selectedProofPayment.status === "pending" && (
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="success" 
                    className="flex-1 text-xs"
                    onClick={() => handleApprove(selectedProofPayment.id, selectedProofPayment.classification)}
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button 
                    variant="danger"
                    className="text-xs"
                    onClick={() => handleReject(selectedProofPayment.id)}
                  >
                    <X className="h-3.5 w-3.5" /> Decline
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </PageShell>
  );
}
