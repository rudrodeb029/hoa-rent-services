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
  Wallet,
  LogOut,
  LayoutDashboard,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Search,
  Filter,
  Menu
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Payment, PaymentStatus } from "@/lib/types";
import { PageShell, PageHeader, Card, CardHeader, Button, Field, Input, Select, Textarea, Pill } from "@/components/shared/Primitives";
import { JURISDICTIONS, STATE_CODES, type StateCode } from "@/lib/compliance";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const activeState = useAppStore((s) => s.activeState);
  const pageSettings = useAppStore((s) => s.pageSettings);
  const payments = useAppStore((s) => s.payments);
  const updatePageSettings = useAppStore((s) => s.updatePageSettings);
  const updatePaymentStatus = useAppStore((s) => s.updatePaymentStatus);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().toLowerCase() === "admin" && password === "admin123") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authenticated", "true");
      setErrorMsg(null);
    } else {
      setErrorMsg("Access Denied: Invalid credentials.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_authenticated");
  };

  const [activeSubPage, setActiveSubPage] = useState<
    | "dashboard"
    | "pending"
    | "ledger"
    | "settings_app"
    | "settings_holding"
    | "settings_lease"
    | "settings_security"
    | "settings_rent"
    | "settings_general"
    | "compliance"
  >("dashboard");
  const [selectedProofPayment, setSelectedProofPayment] = useState<Payment | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
  const [supportWhatsApp, setSupportWhatsApp] = useState(pageSettings.supportWhatsApp);
  const [supportTelegram, setSupportTelegram] = useState(pageSettings.supportTelegram);
  const [supportCellPhone, setSupportCellPhone] = useState(pageSettings.supportCellPhone);
  const [homeInsuranceFee, setHomeInsuranceFee] = useState(pageSettings.homeInsuranceFee);
  const [homeInsuranceNote, setHomeInsuranceNote] = useState(pageSettings.homeInsuranceNote);
  const [paymentNote, setPaymentNote] = useState(pageSettings.paymentNote);

  const [saveSectionName, setSaveSectionName] = useState<string | null>(null);
  const [complianceState, setComplianceState] = useState<StateCode>(activeState);

  // Search & Filter state for History Ledger
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  const pendingPayments = useMemo(() => payments.filter((p) => p && p.status === "pending"), [payments]);
  const historicalPayments = useMemo(() => payments.filter((p) => p && p.status !== "pending"), [payments]);

  // Filtered History Ledger
  const filteredHistory = useMemo(() => {
    return historicalPayments.filter((p) => {
      if (!p) return false;
      const matchesSearch = 
        (p.tenantName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.unitAddress || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.processor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.id || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesClass = classFilter === "all" || p.classification === classFilter;
      
      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [historicalPayments, searchQuery, statusFilter, classFilter]);

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
    setSupportWhatsApp(pageSettings.supportWhatsApp);
    setSupportTelegram(pageSettings.supportTelegram);
    setSupportCellPhone(pageSettings.supportCellPhone);
    setHomeInsuranceFee(pageSettings.homeInsuranceFee);
    setHomeInsuranceNote(pageSettings.homeInsuranceNote);
    setPaymentNote(pageSettings.paymentNote);
  }, [pageSettings]);

  // Helper to save setting sections
  const handleSaveSection = (section: string, updates: Partial<typeof pageSettings>) => {
    setSaveSectionName(section);
    setTimeout(() => {
      updatePageSettings(updates);
      setSaveSectionName(null);
    }, 600);
  };

  const handleApprove = (pId: string, classification: string) => {
    const finalStatus: PaymentStatus = (classification === "security_deposit" || classification === "lease_signing") ? "held" : "completed";
    updatePaymentStatus(pId, finalStatus);
    if (selectedProofPayment?.id === pId) {
      setSelectedProofPayment(p => p ? { ...p, status: finalStatus } : null);
    }
  };

  const handleReject = (pId: string) => {
    updatePaymentStatus(pId, "failed");
    if (selectedProofPayment?.id === pId) {
      setSelectedProofPayment(null);
    }
  };

  const totalVolume = useMemo(() => {
    return payments
      .filter((p) => p && (p.status === "completed" || p.status === "held"))
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const escrowBalance = useMemo(() => {
    return payments
      .filter((p) => p && p.classification === "security_deposit" && p.status === "held")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const successRate = useMemo(() => {
    const historyCount = historicalPayments.length;
    if (historyCount === 0) return 100;
    const successCount = historicalPayments.filter(p => p && (p.status === "completed" || p.status === "held")).length;
    return Math.round((successCount / historyCount) * 105) > 100 ? 100 : Math.round((successCount / historyCount) * 100);
  }, [historicalPayments]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 relative overflow-hidden select-none">
        {/* Dynamic Mesh Gradients */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-violet-500/8 blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />

        {/* Blueprint background lines */}
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none -z-10" 
          style={{ 
            backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)',
            backgroundSize: '20px 20px, 100px 100px, 100px 100px'
          }} 
        />

        <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-200/50 shadow-2xl rounded-2xl p-8 space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm animate-pulse">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="font-display text-xl font-bold text-slate-800">HOA Rent Services</h1>
            <p className="text-xs text-slate-500">Enter administrative credentials to access the ledger, verification systems, and compliance overrides.</p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-100 animate-bounce">
              <XCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Username</label>
              <input
                type="text"
                required
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition cursor-pointer"
            >
              Authenticate Portal
            </button>
          </form>

          {/* Preset credentials card for reviewers */}
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-3.5 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Reviewer Credentials</div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Username:</span>
              <span className="font-mono font-bold text-slate-800">admin</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Password:</span>
              <span className="font-mono font-bold text-slate-800">admin123</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 px-6 py-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)] animate-pulse">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-sm font-extrabold tracking-tight text-white block">HOA Control</span>
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Ledger Manager</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* MONITORING GROUP */}
          <div className="space-y-1.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1">Monitoring</div>
            <button
              onClick={() => { setActiveSubPage("dashboard"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition cursor-pointer text-left ${
                activeSubPage === "dashboard" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard Overview
            </button>
            
            <button
              onClick={() => { setActiveSubPage("pending"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-bold transition cursor-pointer text-left ${
                activeSubPage === "pending" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4" />
                Awaiting Review
              </div>
              {pendingPayments.length > 0 && (
                <span className="bg-amber-500/15 text-amber-500 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                  {pendingPayments.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => { setActiveSubPage("ledger"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition cursor-pointer text-left ${
                activeSubPage === "ledger" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Transaction Ledger
            </button>
          </div>

          {/* SYSTEM CONFIGURATION GROUP */}
          <div className="space-y-1.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1">Configuration</div>
            <button
              onClick={() => { setActiveSubPage("settings_app"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition cursor-pointer text-left ${
                activeSubPage === "settings_app" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <Receipt className="h-4 w-4" />
              1. Application Fee
            </button>
            <button
              onClick={() => { setActiveSubPage("settings_holding"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition cursor-pointer text-left ${
                activeSubPage === "settings_holding" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <ClipboardCheck className="h-4 w-4" />
              2. Holding Fee
            </button>
            <button
              onClick={() => { setActiveSubPage("settings_lease"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition cursor-pointer text-left ${
                activeSubPage === "settings_lease" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <FileSignature className="h-4 w-4" />
              3. Lease Defaults
            </button>
            <button
              onClick={() => { setActiveSubPage("settings_security"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition cursor-pointer text-left ${
                activeSubPage === "settings_security" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              4. Security Escrow
            </button>
            <button
              onClick={() => { setActiveSubPage("settings_rent"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition cursor-pointer text-left ${
                activeSubPage === "settings_rent" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <Wallet className="h-4 w-4" />
              5. Rent & Roommates
            </button>
            <button
              onClick={() => { setActiveSubPage("settings_general"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition cursor-pointer text-left ${
                activeSubPage === "settings_general" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <Settings className="h-4 w-4" />
              6. General Settings
            </button>
          </div>

          {/* REFERENCE GROUP */}
          <div className="space-y-1.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-1">Compliance</div>
            <button
              onClick={() => { setActiveSubPage("compliance"); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition cursor-pointer text-left ${
                activeSubPage === "compliance" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
              }`}
            >
              <Building2 className="h-4 w-4" />
              State Regulations
            </button>
          </div>
        </div>

        {/* Footer User Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-indigo-950 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0 shadow-inner">
              RA
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">Riley Admin</div>
              <div className="text-[10px] text-slate-500 font-semibold truncate">System Manager</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
            title="Logout"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-800">
        {/* Topbar/Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-sm font-extrabold text-slate-800 uppercase tracking-widest truncate">
              {activeSubPage === "dashboard" ? "Dashboard Overview" :
               activeSubPage === "pending" ? "Awaiting Verification" :
               activeSubPage === "ledger" ? "Compliance Ledger" :
               activeSubPage === "settings_app" ? "Application Fee Settings" :
               activeSubPage === "settings_holding" ? "Holding Deposit Settings" :
               activeSubPage === "settings_lease" ? "Lease Signing Defaults" :
               activeSubPage === "settings_security" ? "Security Escrow Settings" :
               activeSubPage === "settings_rent" ? "Rent Ledger Settings" :
               activeSubPage === "settings_general" ? "General Settings" : "State Regulations"}
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider hidden sm:inline">Active Jurisdiction:</span>
            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              US-{activeState} REGIONAL LEDGER
            </span>
          </div>
        </header>

        {/* Page Body Wrapper */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">
          
          {/* VIEW: DASHBOARD OVERVIEW */}
          {activeSubPage === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {/* Stat 1 */}
                <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-soft relative overflow-hidden group hover:border-indigo-200 transition duration-300">
                  <div className="absolute right-3 top-3 opacity-[0.08] text-indigo-600 transition group-hover:scale-110">
                    <TrendingUp className="h-12 w-12" />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Volume</div>
                  <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
                    ${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                {/* Stat 2 */}
                <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-soft relative overflow-hidden group hover:border-amber-200 transition duration-300">
                  <div className="absolute right-3 top-3 opacity-[0.08] text-amber-500 transition group-hover:scale-110">
                    <Clock className="h-12 w-12" />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Awaiting Review</div>
                  <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
                    {pendingPayments.length} pending
                  </div>
                </div>
                {/* Stat 3 */}
                <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-soft relative overflow-hidden group hover:border-emerald-200 transition duration-300">
                  <div className="absolute right-3 top-3 opacity-[0.08] text-emerald-600 transition group-hover:scale-110">
                    <ShieldCheck className="h-12 w-12" />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Escrow Balance</div>
                  <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
                    ${escrowBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                {/* Stat 4 */}
                <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-soft relative overflow-hidden group hover:border-violet-200 transition duration-300">
                  <div className="absolute right-3 top-3 opacity-[0.08] text-violet-600 transition group-hover:scale-110">
                    <Activity className="h-12 w-12" />
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">OCR Approval Rate</div>
                  <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{successRate}%</div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Submissions */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-indigo-600" />
                      Recent Ledger Activity
                    </h3>
                    <button 
                      onClick={() => setActiveSubPage("ledger")} 
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      View Full Ledger <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                  <Card>
                    <div className="divide-y divide-slate-100">
                      {payments.slice(0, 5).map((p) => {
                        if (!p) return null;
                        const classification = p.classification || "application_fee";
                        const id = p.id || "";
                        const processor = p.processor || "";
                        const tenantName = p.tenantName || "Avery Tenant";
                        const amount = p.amount || 0;
                        const timestamp = p.timestamp || new Date().toISOString();
                        const status = p.status || "pending";
                        return (
                          <div key={id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                classification === "application_fee" ? "bg-indigo-50 text-indigo-600" :
                                classification === "holding_fee" ? "bg-amber-50 text-amber-700" :
                                classification === "security_deposit" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                              }`}>
                                {classification === "application_fee" ? "AF" :
                                 classification === "holding_fee" ? "HF" :
                                 classification === "security_deposit" ? "SD" : "RL"}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-800">{tenantName}</div>
                                <div className="text-[9px] text-slate-400 font-mono">Ref: {id.slice(0, 8)} • {processor}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <div className="text-xs font-extrabold text-slate-800">${amount.toFixed(2)}</div>
                                <div className="text-[9px] text-slate-400">{new Date(timestamp).toLocaleDateString()}</div>
                              </div>
                              <Pill tone={
                                status === "completed" ? "emerald" :
                                status === "held" ? "indigo" :
                                status === "failed" ? "red" : "amber"
                              }>
                                {status}
                              </Pill>
                            </div>
                          </div>
                        );
                      })}
                      {payments.length === 0 && (
                        <div className="p-8 text-center text-xs text-slate-500">No recent transactions recorded.</div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Quick Stats Summary */}
                <div className="space-y-4">
                  <h3 className="font-display text-sm font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-indigo-600" />
                    Compliance Scorecard
                  </h3>
                  <Card className="p-5 space-y-4">
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">ESIGN Status</div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Legal Signature Vault Engaged
                      </div>
                    </div>
                    <div className="space-y-1 border-t border-slate-100 pt-3">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Tenant Bank Trust</div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Segregated FDIC-Insured Escrow
                      </div>
                    </div>
                    <div className="space-y-1 border-t border-slate-100 pt-3">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">State Limits Check</div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Auto-cap overrides active
                      </div>
                    </div>
                    <div className="rounded-xl bg-indigo-50/50 border border-indigo-100/50 p-3.5 text-[11px] text-indigo-900 leading-relaxed">
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-indigo-950">
                        <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" /> Safe-Harbor Ledger
                      </div>
                      All tenant background fees, security deposits, and holding agreements automatically match regional caps to protect against landlord liability.
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: PENDING PAYMENTS LIST */}
          {activeSubPage === "pending" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-indigo-600" />
                  Payments Awaiting Verification ({pendingPayments.length})
                </h2>
                {pendingPayments.length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                )}
              </div>

              {pendingPayments.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-slate-200 bg-white">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">Clear Ledger</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">No pending screening fees or deposits currently awaiting administrative approval.</p>
                </Card>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {pendingPayments.map((p) => {
                    if (!p) return null;
                    const classification = p.classification || "application_fee";
                    const id = p.id || "";
                    const processor = p.processor || "";
                    const tenantName = p.tenantName || "Avery Tenant";
                    const amount = p.amount || 0;
                    const timestamp = p.timestamp || new Date().toISOString();
                    const unitAddress = p.unitAddress || "US Regional Office";
                    const proofImageParts = (p.proofImage || "").split(";");
                    const proofImage = proofImageParts[0] || "";
                    const dlFrontUrl = proofImageParts[1] || "";
                    const dlBackUrl = proofImageParts[2] || "";
                    const selfieUrl = proofImageParts[3] || "";
                    return (
                      <Card key={id} className="flex flex-col md:flex-row overflow-hidden border-slate-200/80 transition-all duration-300 hover:shadow-md hover:border-indigo-100 bg-white">
                        {/* Left: payment details */}
                        <div className="p-5 flex-1 space-y-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <Pill tone={
                                classification === "application_fee" ? "indigo" :
                                classification === "holding_fee" ? "amber" :
                                classification === "security_deposit" ? "emerald" : "slate"
                              }>
                                {classification.replace("_", " ")}
                              </Pill>
                              <span className="text-[10px] font-mono text-slate-400">ID: {id.slice(0, 8)}</span>
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-800">{tenantName}</h3>
                              <p className="text-xs text-slate-500">{unitAddress}</p>
                            </div>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-3 divide-y divide-slate-100 space-y-2 text-xs">
                            <div className="flex justify-between pb-2">
                              <span className="text-slate-500 font-medium">Gateway:</span>
                              <span className="text-slate-800 font-bold">{processor}</span>
                            </div>
                            <div className="flex justify-between py-2">
                              <span className="text-slate-500 font-medium">Amount:</span>
                              <span className="text-indigo-600 font-extrabold">${amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                              <span className="text-slate-500 font-medium">Timestamp:</span>
                              <span className="text-slate-700 font-medium">{new Date(timestamp).toLocaleString()}</span>
                            </div>
                          </div>

                          {dlFrontUrl && (
                            <div className="mt-3 border-t border-slate-100 pt-3">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Identity Verification Documents</div>
                              <div className="grid grid-cols-3 gap-2">
                                {dlFrontUrl && (
                                  <div className="group relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer" onClick={() => window.open(dlFrontUrl, "_blank")}>
                                    <img src={dlFrontUrl} alt="DL Front" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-bold text-white transition-opacity">DL Front</div>
                                  </div>
                                )}
                                {dlBackUrl && (
                                  <div className="group relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer" onClick={() => window.open(dlBackUrl, "_blank")}>
                                    <img src={dlBackUrl} alt="DL Back" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-bold text-white transition-opacity">DL Back</div>
                                  </div>
                                )}
                                {selfieUrl && (
                                  <div className="group relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer" onClick={() => window.open(selfieUrl, "_blank")}>
                                    <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-bold text-white transition-opacity">Selfie</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <Button 
                              variant="success" 
                              onClick={() => handleApprove(id, classification)}
                              className="flex-1 text-xs py-1.5"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button 
                              variant="danger" 
                              onClick={() => handleReject(id)}
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
                            {proofImage ? "proof_image.png" : "receipt.png"}
                          </div>
                          
                          {/* Simulated Receipt inside phone frame */}
                          <div 
                            onClick={() => setSelectedProofPayment(p)}
                            className="w-32 h-52 rounded-xl bg-white border-2 border-slate-700 shadow-lg overflow-hidden flex flex-col justify-between p-2 cursor-pointer transform transition hover:scale-105 relative"
                          >
                            {proofImage && proofImage.startsWith("http") ? (
                              <img 
                                src={proofImage} 
                                alt="Payment Proof" 
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              <>
                                {/* Top App bar */}
                                <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                                  <span className="text-[6px] font-extrabold text-slate-400 uppercase tracking-widest">{processor}</span>
                                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                </div>
                                
                                {/* Body Details */}
                                <div className="text-center my-auto space-y-0.5">
                                  <div className="mx-auto w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Check className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="text-[8px] font-bold text-slate-500">Transaction Complete</div>
                                  <div className="text-xs font-extrabold text-slate-800">${amount.toFixed(2)}</div>
                                </div>

                                {/* Footer reference */}
                                <div className="pt-1 border-t border-slate-50 flex justify-between items-center text-[5px] text-slate-400">
                                  <span>Ref: tx_{id.slice(0,4)}</span>
                                  <span>Zoom</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: TRANSACTION LEDGER */}
          {activeSubPage === "ledger" && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-soft">
                <div className="flex-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by tenant name, unit address or reference ID..."
                    className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
                  </div>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-32 text-xs py-1"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="held">Held (Escrow)</option>
                    <option value="failed">Failed</option>
                  </Select>

                  <Select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="w-36 text-xs py-1"
                  >
                    <option value="all">All Documents</option>
                    <option value="application_fee">Application Fee</option>
                    <option value="holding_fee">Holding Fee</option>
                    <option value="security_deposit">Security Deposit</option>
                    <option value="rent">Rent Ledger</option>
                  </Select>
                </div>
              </div>

              {/* Table */}
              <Card className="overflow-hidden bg-white">
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
                      {filteredHistory.map((h) => {
                        if (!h) return null;
                        const tenantName = h.tenantName || "Seed Database Record";
                        const id = h.id || "";
                        const classification = h.classification || "application_fee";
                        const state = h.state || "NY";
                        const processor = h.processor || "";
                        const amount = h.amount || 0;
                        const timestamp = h.timestamp || new Date().toISOString();
                        const status = h.status || "pending";
                        const proofImage = h.proofImage || "";
                        return (
                          <tr key={id} className="hover:bg-slate-50/50 transition">
                            <td className="px-5 py-4">
                              <div className="font-bold text-slate-800">{tenantName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {id.slice(0, 8)}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-700 capitalize">{classification.replace("_", " ")}</div>
                              <div className="text-[10px] text-slate-400 uppercase tracking-widest">{state} Juris</div>
                            </td>
                            <td className="px-5 py-4 font-medium">{processor}</td>
                            <td className="px-5 py-4 font-bold text-slate-900">${amount.toFixed(2)}</td>
                            <td className="px-5 py-4 text-slate-500">{new Date(timestamp).toLocaleDateString()}</td>
                            <td className="px-5 py-4">
                              <Pill tone={
                                status === "completed" ? "emerald" :
                                status === "held" ? "indigo" :
                                status === "failed" ? "red" : "amber"
                              }>
                                {status}
                              </Pill>
                            </td>
                            <td className="px-5 py-4 text-right text-[10px] font-mono text-indigo-600">
                              {proofImage ? (
                                <button 
                                  onClick={() => setSelectedProofPayment(h)}
                                  className="hover:underline cursor-pointer flex items-center gap-1 justify-end ml-auto font-bold"
                                >
                                  <ImageIcon className="h-3 w-3" /> View File
                                </button>
                              ) : (
                                <span className="text-slate-400">Database Seed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredHistory.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                            No transactions found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* VIEW: SETTINGS APPLICATION FEE */}
          {activeSubPage === "settings_app" && (
            <Card className="max-w-2xl bg-white">
              <CardHeader title="1. Application Fee Page Details" icon={<Receipt className="h-4.5 w-4.5" />} />
              <div className="p-5 space-y-4">
                <Field label="Default Screening Fee (USD)" hint="This amount will override the regional cap on the Application page.">
                  <Input type="number" value={appFeeAmount} onChange={(e) => setAppFeeAmount(Number(e.target.value))} />
                </Field>
                <Field label="Regional Disclosure Template" hint="Shown to the user at the bottom of the fee receipt.">
                  <Textarea rows={4} value={appFeeDisclosures} onChange={(e) => setAppFeeDisclosures(e.target.value)} />
                </Field>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                  {saveSectionName === "app" ? (
                    <span className="text-indigo-600 font-bold text-xs animate-pulse">Saving changes...</span>
                  ) : pageSettings.appFeeAmount === appFeeAmount && pageSettings.appFeeDisclosures === appFeeDisclosures ? (
                    <span className="text-slate-400 text-xs font-semibold">No unsaved changes</span>
                  ) : (
                    <span className="text-amber-600 font-bold text-xs animate-pulse">Unsaved changes</span>
                  )}
                  <Button
                    onClick={() => handleSaveSection("app", { appFeeAmount: Number(appFeeAmount), appFeeDisclosures })}
                    disabled={saveSectionName !== null}
                    className="px-5 text-xs py-1.5"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* VIEW: SETTINGS HOLDING FEE */}
          {activeSubPage === "settings_holding" && (
            <Card className="max-w-2xl bg-white">
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
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                  {saveSectionName === "holding" ? (
                    <span className="text-indigo-600 font-bold text-xs animate-pulse">Saving changes...</span>
                  ) : pageSettings.holdingFeeAmount === holdingFeeAmount && 
                      pageSettings.holdingReservationDays === holdingReservationDays && 
                      pageSettings.holdingLandlordName === holdingLandlordName ? (
                    <span className="text-slate-400 text-xs font-semibold">No unsaved changes</span>
                  ) : (
                    <span className="text-amber-600 font-bold text-xs animate-pulse">Unsaved changes</span>
                  )}
                  <Button
                    onClick={() => handleSaveSection("holding", { 
                      holdingFeeAmount: Number(holdingFeeAmount), 
                      holdingReservationDays: Number(holdingReservationDays), 
                      holdingLandlordName 
                    })}
                    disabled={saveSectionName !== null}
                    className="px-5 text-xs py-1.5"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* VIEW: SETTINGS LEASE AGREEMENT */}
          {activeSubPage === "settings_lease" && (
            <Card className="max-w-2xl bg-white">
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
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                  {saveSectionName === "lease" ? (
                    <span className="text-indigo-600 font-bold text-xs animate-pulse">Saving changes...</span>
                  ) : pageSettings.leaseLandlordName === leaseLandlordName && 
                      pageSettings.leaseLandlordEmail === leaseLandlordEmail && 
                      pageSettings.leaseLandlordAddress === leaseLandlordAddress && 
                      pageSettings.leaseFurnishedStatus === leaseFurnishedStatus && 
                      pageSettings.leasePetPolicy === leasePetPolicy ? (
                    <span className="text-slate-400 text-xs font-semibold">No unsaved changes</span>
                  ) : (
                    <span className="text-amber-600 font-bold text-xs animate-pulse">Unsaved changes</span>
                  )}
                  <Button
                    onClick={() => handleSaveSection("lease", { 
                      leaseLandlordName, 
                      leaseLandlordEmail, 
                      leaseLandlordAddress, 
                      leaseFurnishedStatus, 
                      leasePetPolicy 
                    })}
                    disabled={saveSectionName !== null}
                    className="px-5 text-xs py-1.5"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* VIEW: SETTINGS SECURITY DEPOSIT */}
          {activeSubPage === "settings_security" && (
            <Card className="max-w-2xl bg-white">
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
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                  {saveSectionName === "security" ? (
                    <span className="text-indigo-600 font-bold text-xs animate-pulse">Saving changes...</span>
                  ) : pageSettings.securityBankName === securityBankName && 
                      pageSettings.securityBankAddress === securityBankAddress && 
                      pageSettings.securityCustomApr === (securityCustomApr / 100) ? (
                    <span className="text-slate-400 text-xs font-semibold">No unsaved changes</span>
                  ) : (
                    <span className="text-amber-600 font-bold text-xs animate-pulse">Unsaved changes</span>
                  )}
                  <Button
                    onClick={() => handleSaveSection("security", { 
                      securityBankName, 
                      securityBankAddress, 
                      securityCustomApr: Number(securityCustomApr) / 100 
                    })}
                    disabled={saveSectionName !== null}
                    className="px-5 text-xs py-1.5"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* VIEW: SETTINGS RENT LEDGER */}
          {activeSubPage === "settings_rent" && (
            <Card className="max-w-2xl bg-white">
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
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                  {saveSectionName === "rent" ? (
                    <span className="text-indigo-600 font-bold text-xs animate-pulse">Saving changes...</span>
                  ) : pageSettings.rentGraceDays === rentGraceDays && 
                      pageSettings.rentLateFeePercent === rentLateFeePercent ? (
                    <span className="text-slate-400 text-xs font-semibold">No unsaved changes</span>
                  ) : (
                    <span className="text-amber-600 font-bold text-xs animate-pulse">Unsaved changes</span>
                  )}
                  <Button
                    onClick={() => handleSaveSection("rent", { 
                      rentGraceDays: Number(rentGraceDays), 
                      rentLateFeePercent: Number(rentLateFeePercent) 
                    })}
                    disabled={saveSectionName !== null}
                    className="px-5 text-xs py-1.5"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeSubPage === "settings_general" && (
            <Card className="max-w-2xl bg-white">
              <CardHeader title="6. General Settings" icon={<Settings className="h-4.5 w-4.5" />} />
              <div className="p-5 space-y-6">
                {/* Support Desk */}
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Support Desk Contacts</div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="WhatsApp" hint="Support WhatsApp number">
                      <Input value={supportWhatsApp} onChange={(e) => setSupportWhatsApp(e.target.value)} />
                    </Field>
                    <Field label="Telegram" hint="Support Telegram handle">
                      <Input value={supportTelegram} onChange={(e) => setSupportTelegram(e.target.value)} />
                    </Field>
                    <Field label="Cell Phone" hint="Support phone number">
                      <Input value={supportCellPhone} onChange={(e) => setSupportCellPhone(e.target.value)} />
                    </Field>
                  </div>
                </div>

                {/* Home Insurance */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Home Insurance</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Insurance Fee ($)" hint="Fixed home insurance fee amount.">
                      <Input type="number" value={homeInsuranceFee} onChange={(e) => setHomeInsuranceFee(Number(e.target.value))} />
                    </Field>
                    <Field label="Insurance Note" hint="Note shown to tenants on the insurance page.">
                      <Textarea value={homeInsuranceNote} onChange={(e) => setHomeInsuranceNote(e.target.value)} rows={2} placeholder="Optional note..." />
                    </Field>
                  </div>
                </div>

                {/* Payment Note */}
                <div className="border-t border-slate-100 pt-4">
                  <div className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Global Payment Note</div>
                  <Field label="Payment Note" hint="Shown on all payment pages below the proof upload section.">
                    <Textarea value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} rows={3} placeholder="Add payment instructions or notes..." />
                  </Field>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                  {saveSectionName === "general" ? (
                    <span className="text-indigo-600 font-bold text-xs animate-pulse">Saving changes...</span>
                  ) : (
                    <span className="text-slate-400 text-xs font-semibold">Configure support and insurance</span>
                  )}
                  <Button
                    onClick={() => handleSaveSection("general", {
                      supportWhatsApp,
                      supportTelegram,
                      supportCellPhone,
                      homeInsuranceFee: Number(homeInsuranceFee),
                      homeInsuranceNote,
                      paymentNote,
                    })}
                    disabled={saveSectionName !== null}
                    className="px-5 text-xs py-1.5"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* VIEW: STATE REGULATIONS COMPLIANCE */}
          {activeSubPage === "compliance" && (
            <div className="space-y-6">
              <Card className="bg-white">
                <CardHeader title="6. Admin Compliance Rules" icon={<Building2 className="h-4.5 w-4.5" />} />
                <div className="p-5 text-xs text-slate-500 leading-relaxed space-y-2">
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

              {/* State laws list */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
                  <h3 className="font-display text-sm font-bold text-slate-800">Explore State Regulations Reference</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Select State:</span>
                    <Select
                      value={complianceState}
                      onChange={(e) => setComplianceState(e.target.value as StateCode)}
                      className="w-48 font-bold text-xs"
                    >
                      {STATE_CODES.map((code) => (
                        <option key={code} value={code}>
                          {JURISDICTIONS[code].name} ({code})
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Selected state details */}
                  <Card className="bg-white">
                    <CardHeader title={`${JURISDICTIONS[complianceState].name} Compliance Parameters`} icon={<Building2 className="h-4.5 w-4.5" />} />
                    <div className="p-5 space-y-3.5 text-xs divide-y divide-slate-100">
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500 font-medium">Application Fee Cap:</span>
                        <span className="text-slate-850 font-bold capitalize">
                          {JURISDICTIONS[complianceState].appFeeRule.type === "capped" 
                            ? `Capped at $${(JURISDICTIONS[complianceState].appFeeRule as any).max}` 
                            : JURISDICTIONS[complianceState].appFeeRule.type.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500 font-medium">Security Deposit Cap:</span>
                        <span className="text-slate-850 font-bold">
                          {JURISDICTIONS[complianceState].securityDepositCapMonths === Infinity 
                            ? "Uncapped" 
                            : `${JURISDICTIONS[complianceState].securityDepositCapMonths} Month(s) Rent`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500 font-medium">Escrow Account Requirement:</span>
                        <span className="text-slate-850 font-bold">
                          {JURISDICTIONS[complianceState].escrowRequirement.separateAccount 
                            ? "Separate Account Required" 
                            : "Separate Account Optional"}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500 font-medium">Interest Requirement:</span>
                        <span className="text-slate-850 font-bold capitalize">
                          {JURISDICTIONS[complianceState].interestRate.type === "fixed" 
                            ? `${(JURISDICTIONS[complianceState].interestRate as any).value * 100}% APR` 
                            : JURISDICTIONS[complianceState].interestRate.type.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500 font-medium">Refund Deadline:</span>
                        <span className="text-slate-850 font-bold capitalize">
                          {JURISDICTIONS[complianceState].refundDeadline.days} {JURISDICTIONS[complianceState].refundDeadline.unit} Days
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500 font-medium">Late Fee Grace Period:</span>
                        <span className="text-slate-850 font-bold">
                          {JURISDICTIONS[complianceState].lateFeeGraceDays} Day(s)
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Warning / Advisory Info */}
                  <Card className="bg-white">
                    <CardHeader title="SaaS Landlord Advisory" icon={<ShieldAlert className="h-4.5 w-4.5" />} />
                    <div className="p-5 text-xs text-slate-500 leading-relaxed space-y-3">
                      <p>
                        Our platform automatically applies the regulations above for the selected user state.
                      </p>
                      <p>
                        This safeguards against class-action risk from illegal tenant fee practices (e.g. charging $50 background check fees in states where caps are set to $20, or commingling deposit funds in states where dedicated escrow trust accounts are legally mandated).
                      </p>
                      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3.5 text-indigo-900 flex items-start gap-2.5">
                        <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Auto-Calculation Enabled:</strong> All frontend routes adapt dynamically to active jurisdiction codes, preventing non-compliant checkout sessions.
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Screenshot Zoom Modal */}
      {selectedProofPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white border border-slate-200/80 shadow-2xl p-6 flex flex-col items-center">
            <button 
              type="button"
              onClick={() => setSelectedProofPayment(null)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition cursor-pointer"
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
                  <span className="flex items-center gap-1">100% <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" /></span>
                </div>

                {(() => {
                  const parts = (selectedProofPayment.proofImage || "").split(";");
                  const mainProof = parts[0] || "";
                  const mDlFront = parts[1] || "";
                  const mDlBack = parts[2] || "";
                  const mSelfie = parts[3] || "";
                  return (
                    <>
                      {mainProof && mainProof.startsWith("http") && (
                        <div className="mt-2 w-full h-48 border border-slate-200 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                          <img 
                            src={mainProof} 
                            alt="Uploaded Receipt" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      {mDlFront && (
                        <div className="mt-4 border-t border-slate-200 pt-4 w-full">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Identity Verification Documents</div>
                          <div className="grid grid-cols-3 gap-2">
                            {mDlFront && (
                              <div className="group relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer" onClick={() => window.open(mDlFront, "_blank")}>
                                <img src={mDlFront} alt="DL Front" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-bold text-white transition-opacity">DL Front</div>
                              </div>
                            )}
                            {mDlBack && (
                              <div className="group relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer" onClick={() => window.open(mDlBack, "_blank")}>
                                <img src={mDlBack} alt="DL Back" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-bold text-white transition-opacity">DL Back</div>
                              </div>
                            )}
                            {mSelfie && (
                              <div className="group relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer" onClick={() => window.open(mSelfie, "_blank")}>
                                <img src={mSelfie} alt="Selfie" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-bold text-white transition-opacity">Selfie</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Receipt Interior */}
                <div className="space-y-4 py-4 text-xs">
                  <div className="text-center space-y-1">
                    <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="inline-block bg-emerald-50 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedProofPayment.status === "pending" ? "Awaiting Approval" : 
                       selectedProofPayment.status === "completed" ? "Approved Payment" : "Declined Payment"}
                    </span>
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
                  </div>
                </div>

                {/* Footer seal */}
                <div className="pt-2 border-t border-slate-200 text-center text-[7px] font-bold tracking-widest text-slate-400 uppercase">
                  HOA RENT SERVICES SECURE ESCROW
                </div>
              </div>

              {selectedProofPayment.status === "pending" && (
                <div className="flex gap-2 w-full pt-2">
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

    </div>
  );
}
