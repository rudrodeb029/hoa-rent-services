import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Building2,
  ClipboardCheck,
  FileSignature,
  Receipt,
  ShieldCheck,
  Shield,
  Wallet,
  Menu,
  ChevronLeft,
  Settings,
  X,
  Gift,
  DollarSign,
  Sparkles,
  CheckCircle2,
  Headphones,
  MessageCircle,
  Send,
  Phone,
} from "lucide-react";

import appCss from "../styles.css?url";
import "../lib/fonts";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useAppStore } from "../lib/store";
import { JURISDICTIONS, STATE_CODES, type StateCode } from "../lib/compliance";

const NAV = [
  { to: "/app-fee", label: "Application Fee", icon: Receipt },
  { to: "/holding-fee", label: "Holding Fee", icon: ClipboardCheck },
  { to: "/lease-signing", label: "Lease & Inspection", icon: FileSignature },
  { to: "/security-deposit", label: "Security Deposit", icon: ShieldCheck },
  { to: "/home-insurance", label: "Home Insurance", icon: Shield },
  { to: "/rent-ledger", label: "Rent & Roommates", icon: Wallet },
  { to: "/admin-compliance", label: "Admin Compliance", icon: Building2 },
] as const;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-slate-800">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-slate-800">Page not found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-slate-800">This page didn't load</h1>
        <p className="mt-2 text-sm text-slate-500">Something went wrong. Try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HOA Rent Services — US Rental Compliance Platform" },
      { name: "description", content: "Location-aware US residential rental compliance: application fees, holding deposits, escrow, leases, and rent." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function Sidebar({ collapsed, onToggle, onClickLink }: { collapsed: boolean; onToggle: () => void; onClickLink?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeState = useAppStore((s) => s.activeState);
  const setActiveState = useAppStore((s) => s.setActiveState);
  const j = JURISDICTIONS[activeState];

  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    { text: "Verified local rental caps automatically.", author: "Fair Fee Compliance" },
    { text: "Times New Roman PDFs are ESIGN compliant.", author: "Legal Signature Vault" },
    { text: "Payments processed via secure direct portals.", author: "PCI-DSS Protected Escrow" },
    { text: "Helped me verify my lease in under 5 minutes!", author: "Avery T., Renter" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            {/* Custom Brand Logo */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm">
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M3 10v11M21 10v11M12 2v20M7 6l5-4 5 4M7 10h10" />
              </svg>
            </div>
            <span className="font-display text-base font-bold tracking-tight text-slate-800">HOA Rent Services</span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm">
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M3 10v11M21 10v11M12 2v20M7 6l5-4 5 4M7 10h10" />
            </svg>
          </div>
        )}
        <button onClick={onToggle} className="hidden rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:block" aria-label="Toggle sidebar">
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={onClickLink}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mx-3 my-2 p-3 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 border border-indigo-100/50 rounded-xl relative overflow-hidden shadow-sm group">
          {/* Background elements */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-2 translate-y-2">
            <ShieldCheck className="h-16 w-16 text-indigo-700 animate-pulse" />
          </div>
          
          <div className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-ping" />
            HOA Escrow Security
          </div>
          
          <div className="mt-1.5 relative h-12 overflow-hidden">
            {slides.map((s, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-500 ease-in-out transform ${
                  idx === activeSlide
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                }`}
              >
                <p className="text-[11px] text-slate-700 font-medium leading-normal italic">"{s.text}"</p>
                <span className="block text-[9px] font-semibold text-slate-500 mt-1">— {s.author}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/50 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <svg className="h-3 w-4.5 rounded-[1px] shadow-sm shrink-0" viewBox="0 0 74 39">
              <rect width="74" height="39" fill="#B22234"/>
              <path d="M0,3h74M0,9h74M0,15h74M0,21h74M0,27h74M0,33h74" stroke="#fff" strokeWidth="3"/>
              <rect width="30" height="21" fill="#3C3B6E"/>
              <circle cx="5" cy="4" r="0.6" fill="#fff" />
              <circle cx="11" cy="4" r="0.6" fill="#fff" />
              <circle cx="17" cy="4" r="0.6" fill="#fff" />
              <circle cx="23" cy="4" r="0.6" fill="#fff" />
              <circle cx="8" cy="8" r="0.6" fill="#fff" />
              <circle cx="14" cy="8" r="0.6" fill="#fff" />
              <circle cx="20" cy="8" r="0.6" fill="#fff" />
              <circle cx="5" cy="12" r="0.6" fill="#fff" />
              <circle cx="11" cy="12" r="0.6" fill="#fff" />
              <circle cx="17" cy="12" r="0.6" fill="#fff" />
              <circle cx="23" cy="12" r="0.6" fill="#fff" />
              <circle cx="8" cy="16" r="0.6" fill="#fff" />
              <circle cx="14" cy="16" r="0.6" fill="#fff" />
              <circle cx="20" cy="16" r="0.6" fill="#fff" />
            </svg>
            <span className="text-[9px] font-extrabold tracking-widest text-slate-500 uppercase leading-none">US Federal Portal</span>
          </div>
        )}
        {!collapsed ? (
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Active jurisdiction</div>
            <div className="mt-1 font-display text-base font-semibold text-slate-800">{j.name}</div>
            <select
              value={activeState}
              onChange={(e) => setActiveState(e.target.value as StateCode)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              {STATE_CODES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid h-10 place-items-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-700">{activeState}</div>
        )}
      </div>
    </aside>
  );
}

function MobileBar({ onOpen }: { onOpen: () => void }) {
  const activeState = useAppStore((s) => s.activeState);
  return (
    <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
      <button onClick={onOpen} className="rounded-md p-2 text-slate-600 hover:bg-slate-100"><Menu className="h-5 w-5" /></button>
      <div className="flex items-center gap-2 font-display text-base font-semibold text-slate-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M3 10v11M21 10v11M12 2v20M7 6l5-4 5 4M7 10h10" />
          </svg>
        </div>
        <span>HOA Rent Services</span>
      </div>
      <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{activeState}</span>
    </div>
  );
}

function LiveSupportFAB() {
  const [open, setOpen] = useState(false);
  const pageSettings = useAppStore((s) => s.pageSettings);

  const whatsapp = pageSettings.supportWhatsApp || "+15550199";
  const telegram = pageSettings.supportTelegram || "@hoarentservices_support";
  const phone = pageSettings.supportCellPhone || "+15550100";

  const items = [
    {
      label: "WhatsApp",
      href: `https://wa.me/${whatsapp.replace(/\D/g, "")}`,
      bg: "bg-emerald-500",
      shadow: "shadow-emerald-500/30",
      icon: <MessageCircle className="h-5 w-5" />,
    },
    {
      label: "Telegram",
      href: `https://t.me/${telegram.replace("@", "")}`,
      bg: "bg-sky-500",
      shadow: "shadow-sky-500/30",
      icon: <Send className="h-5 w-5" />,
    },
    {
      label: "Call Us",
      href: `tel:${phone.replace(/\D/g, "")}`,
      bg: "bg-violet-500",
      shadow: "shadow-violet-500/30",
      icon: <Phone className="h-5 w-5" />,
    },
  ];

  // Radial positions: fan out in a quarter-circle arc (upward-left from bottom-right)
  // Angles: 180° (left), 135° (upper-left), 90° (up)
  const radius = 72; // distance from center
  const angles = [180, 135, 90]; // degrees

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Sub-icons in circular arc */}
      {items.map((item, i) => {
        const angle = angles[i];
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;

        return (
          <a
            key={item.label}
            href={item.href}
            target={item.label !== "Call Us" ? "_blank" : undefined}
            rel={item.label !== "Call Us" ? "noopener noreferrer" : undefined}
            className={`group absolute transition-all duration-300 ease-out ${
              open
                ? "opacity-100 scale-100"
                : "opacity-0 scale-0 pointer-events-none"
            }`}
            style={{
              bottom: `${7 + y}px`,
              right: `${7 - x}px`,
              transitionDelay: open ? `${i * 70}ms` : "0ms",
            }}
            onClick={() => setOpen(false)}
          >
            {/* Tooltip */}
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {item.label}
            </span>
            {/* Icon button */}
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full ${item.bg} text-white shadow-lg ${item.shadow} transition-transform hover:scale-110 cursor-pointer`}
            >
              {item.icon}
            </div>
          </a>
        );
      })}

      {/* Main FAB button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-105 cursor-pointer ${
          open ? "rotate-[135deg]" : "rotate-0"
        }`}
        aria-label="Live Support"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <Headphones className="h-6 w-6" />
        )}
      </button>

      {/* Pulse ring when closed */}
      {!open && (
        <div className="absolute bottom-0 right-0 h-14 w-14 rounded-full bg-indigo-500/20 animate-ping pointer-events-none" />
      )}
    </div>
  );
}

function SpecialOfferModal() {
  const [show, setShow] = useState(false);
  const [offerStep, setOfferStep] = useState<"offer" | "payment" | "complete">("offer");
  const [rentAmount, setRentAmount] = useState("");
  const [utilitiesAmount, setUtilitiesAmount] = useState("");
  const logPayment = useAppStore((s) => s.logPayment);
  const activeState = useAppStore((s) => s.activeState);

  useEffect(() => {
    // Show on every visit
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const totalOffer = (parseFloat(rentAmount) || 0) + (parseFloat(utilitiesAmount) || 0);
  const canProceed = totalOffer > 0;

  const handleComplete = () => {
    logPayment({
      amount: totalOffer,
      classification: "special_offer",
      status: "pending",
      processor: "Uploaded_Screenshot",
      state: activeState,
      tenantName: "Special Offer Participant",
      unitAddress: "Advance Payment",
    });
    setOfferStep("complete");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button onClick={() => setShow(false)} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 z-10">
          <X className="h-4 w-4" />
        </button>

        {offerStep === "offer" && (
          <>
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-3">
                <Gift className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold">Special Offer!</h2>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-sm font-medium text-white/90">Limited Time Promotion</span>
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Pay your <strong>2nd month's rent + utilities</strong> in advance and receive:
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 justify-center text-sm text-emerald-700 font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> 1 Month FREE Rent
                  </div>
                  <div className="flex items-center gap-2 justify-center text-sm text-emerald-700 font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> FREE Utilities for 1 Month
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Rent Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      value={rentAmount}
                      onChange={(e) => setRentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Utilities Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      value={utilitiesAmount}
                      onChange={(e) => setUtilitiesAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShow(false)}
                  className="flex-1 h-10 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Maybe Later
                </button>
                <button
                  disabled={!canProceed}
                  onClick={handleComplete}
                  className="flex-1 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-white hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Accept Offer
                </button>
              </div>
            </div>
          </>
        )}

        {offerStep === "complete" && (
          <div className="p-8 text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Your process is complete.</h3>
            <p className="text-sm text-slate-500">Thank you for connecting with us.</p>
            <button
              onClick={() => setShow(false)}
              className="mt-4 h-10 w-full rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const initializeStore = useAppStore((s) => s.initializeStore);
  const syncDatabase = useAppStore((s) => s.syncDatabase);
  const state = useRouterState();
  const isAdminRoute = state.location.pathname === "/admin" || state.location.pathname.startsWith("/admin/");

  useEffect(() => {
    initializeStore();

    // Poll the database every 4 seconds to sync transactions/settings across clients
    const interval = setInterval(() => {
      syncDatabase();
    }, 4000);

    return () => clearInterval(interval);
  }, [initializeStore, syncDatabase]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-screen bg-slate-50/70 overflow-x-hidden">
        {/* Dynamic, premium background mesh gradients */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/3 blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-violet-500/2.5 blur-[150px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] rounded-full bg-emerald-500/2 blur-[100px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '10s' }} />

        {/* High-tech trust blueprint background grid */}
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none -z-10" 
          style={{ 
            backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)',
            backgroundSize: '20px 20px, 100px 100px, 100px 100px'
          }} 
        />

        {/* Drifting watermarks of trusted symbols in the background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-10 opacity-[0.012] hidden lg:block">
          <div className="absolute top-[12%] left-[30%] animate-float" style={{ animationDuration: '9s' }}>
            <ShieldCheck className="h-16 w-16 text-indigo-900" />
          </div>
          <div className="absolute top-[45%] left-[75%] animate-float" style={{ animationDuration: '14s' }}>
            <Building2 className="h-24 w-24 text-indigo-900" />
          </div>
          <div className="absolute top-[75%] left-[25%] animate-float" style={{ animationDuration: '11s' }}>
            <Wallet className="h-20 w-20 text-indigo-900" />
          </div>
          <div className="absolute top-[20%] left-[82%] animate-float" style={{ animationDuration: '13s' }}>
            <FileSignature className="h-20 w-20 text-indigo-900" />
          </div>
          <div className="absolute top-[60%] left-[40%] animate-float" style={{ animationDuration: '10s' }}>
            <ClipboardCheck className="h-16 w-16 text-indigo-900" />
          </div>
        </div>

        {/* Mobile overlay */}
        {mobileOpen && !isAdminRoute && (
          <div className="fixed inset-0 z-30 bg-slate-900/40 md:hidden" onClick={() => setMobileOpen(false)} />
        )}
        {!isAdminRoute && (
          <div className={`${mobileOpen ? "block" : "hidden"} md:block`}>
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} onClickLink={() => setMobileOpen(false)} />
          </div>
        )}
        <div className={`flex min-h-screen flex-col transition-all duration-200 ${isAdminRoute ? "" : (collapsed ? "md:pl-16" : "md:pl-64")}`}>
          {!isAdminRoute && <MobileBar onOpen={() => setMobileOpen(true)} />}
          <main className="flex-1 relative z-10">
            <Outlet />
          </main>
        </div>

        {/* Special Offer Popup - appears on every visit */}
        {!isAdminRoute && <SpecialOfferModal />}

        {/* Floating Live Support Button */}
        {!isAdminRoute && <LiveSupportFAB />}
      </div>
    </QueryClientProvider>
  );
}
