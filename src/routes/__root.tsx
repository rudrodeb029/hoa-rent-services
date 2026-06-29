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
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { ProofUpload } from "../components/shared/ProofUpload";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useAppStore } from "../lib/store";
import { JURISDICTIONS, STATE_CODES, type StateCode } from "../lib/compliance";

const NAV = [
  { to: "/app-fee", label: "Application Fee", icon: Receipt },
  { to: "/holding-fee", label: "Holding Fee", icon: ClipboardCheck },
  { to: "/lease-signing", label: "Lease & Rent", icon: FileSignature },
  { to: "/security-deposit", label: "Security Deposit", icon: ShieldCheck },
  { to: "/home-insurance", label: "Home Insurance", icon: Shield },
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
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }
    ],
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
  const show = useAppStore((s) => s.showSpecialOffer);
  const setShow = useAppStore((s) => s.setShowSpecialOffer);
  const [offerStep, setOfferStep] = useState<"offer" | "payment" | "verifying" | "complete">("offer");
  const [rentAmount, setRentAmount] = useState("");
  const [utilitiesAmount, setUtilitiesAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"venmo" | "cashapp" | "chime" | null>(null);
  const [copied, setCopied] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const logPayment = useAppStore((s) => s.logPayment);
  const payments = useAppStore((s) => s.payments);
  const activeState = useAppStore((s) => s.activeState);
  const pageSettings = useAppStore((s) => s.pageSettings);

  const allStepsCompleted = useMemo(() => {
    const requiredClassifications = ["application_fee", "holding_fee", "security_deposit", "home_insurance"];
    return requiredClassifications.every((c) =>
      payments.some((p) => p.classification === c && (p.status === "completed" || p.status === "held" || p.status === "pending"))
    );
  }, [payments]);

  useEffect(() => {
    if (!allStepsCompleted) return;
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, [allStepsCompleted, setShow]);

  const totalOffer = (parseFloat(rentAmount) || 0) + (parseFloat(utilitiesAmount) || 0);
  const canProceed = totalOffer > 0;

  const copyTag = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const getTag = () => {
    if (paymentMethod === "venmo") return pageSettings.payVenmoHandle || "@hoarentservices";
    if (paymentMethod === "cashapp") return pageSettings.payCashAppHandle || "$hoarentservices";
    return pageSettings.payChimeHandle || "hoarentservices@chime.com";
  };

  const getGateway = () => {
    if (paymentMethod === "venmo") return "Venmo Gateway";
    if (paymentMethod === "cashapp") return "Cash App Gateway";
    return "Chime Digital Portal";
  };

  const handleUploadComplete = (fname: string) => {
    setOfferStep("verifying");
    let p = 0;
    const iv = setInterval(() => {
      p += 2;
      setVerifyProgress(p);
      if (p >= 100) {
        clearInterval(iv);
        logPayment({
          amount: totalOffer,
          classification: "special_offer",
          status: "pending",
          processor: (paymentMethod ? paymentMethod.toUpperCase() : "Uploaded_Screenshot") as any,
          state: activeState,
          tenantName: "Special Offer Participant",
          unitAddress: "Advance Payment",
          proofImage: fname,
        });
        setTimeout(() => setOfferStep("complete"), 500);
      }
    }, 60);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        <button onClick={() => setShow(false)} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 z-10">
          <X className="h-4 w-4" />
        </button>

        {offerStep === "offer" && (
          <>
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-5 text-white text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-2 animate-bounce">
                <Gift className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold">We Have Something Special for You</h2>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Sparkles className="h-3 w-3" />
                <span className="text-[11px] font-medium text-white/90">A thank-you for choosing us</span>
                <Sparkles className="h-3 w-3" />
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-center">
                <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                  Pay your 2nd month's rent & utilities in advance to receive:
                </p>
                <div className="mt-2.5 inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-semibold px-4.5 py-2 rounded-full border border-emerald-100/60 shadow-sm mx-auto">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Next month's rent & utilities completely free!</span>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Rent Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="number"
                      value={rentAmount}
                      onChange={(e) => setRentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Utilities Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="number"
                      value={utilitiesAmount}
                      onChange={(e) => setUtilitiesAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
              </div>

              {canProceed && (
                <div className="text-center text-[11px] text-slate-500">
                  Total: <strong className="text-indigo-600">${totalOffer.toFixed(2)}</strong>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShow(false)}
                  className="flex-1 h-9 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Maybe Later
                </button>
                <button
                  disabled={!canProceed}
                  onClick={() => setOfferStep("payment")}
                  className="flex-1 h-9 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-semibold text-white hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Accept Offer
                </button>
              </div>
            </div>
          </>
        )}

        {offerStep === "payment" && (
          <div className="p-5 space-y-4">
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes scan { 0%, 100% { top: 0%; } 50% { top: 100%; } }
              .so-scanner { height: 2px; background: linear-gradient(90deg, transparent, #22c55e, transparent); position: absolute; width: 100%; animation: scan 2.5s infinite linear; }
            `}} />

            <div className="text-center">
              <h3 className="text-sm font-semibold text-slate-800">Complete Your Payment</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Amount: <strong className="text-indigo-600">${totalOffer.toFixed(2)}</strong></p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod("venmo")}
                className={`flex items-center justify-center rounded-lg border p-2.5 transition-all cursor-pointer ${
                  paymentMethod === "venmo"
                    ? "border-blue-500 bg-blue-500 text-white shadow-lg"
                    : "border-slate-200 text-[#008CFF] hover:border-blue-400 hover:bg-blue-50/30"
                }`}
              >
                <span className="text-xs font-bold">Venmo</span>
              </button>
              <button
                onClick={() => setPaymentMethod("cashapp")}
                className={`flex items-center justify-center rounded-lg border p-2.5 transition-all cursor-pointer ${
                  paymentMethod === "cashapp"
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-lg"
                    : "border-slate-200 text-[#00D632] hover:border-emerald-400 hover:bg-emerald-50/30"
                }`}
              >
                <span className="text-xs font-bold">Cash App</span>
              </button>
              <button
                onClick={() => setPaymentMethod("chime")}
                className={`flex items-center justify-center rounded-lg border p-2.5 transition-all cursor-pointer ${
                  paymentMethod === "chime"
                    ? "border-teal-500 bg-teal-500 text-white shadow-lg"
                    : "border-slate-200 text-[#25C974] hover:border-teal-400 hover:bg-teal-50/30"
                }`}
              >
                <span className="text-xs font-bold">Chime</span>
              </button>
            </div>

            {paymentMethod && (
              <div className="space-y-3">
                <div className="flex flex-col items-center gap-3">
                  {/* QR Code */}
                  <div className="relative w-40 h-40 border-2 border-indigo-100 rounded-xl p-2 bg-slate-50 flex items-center justify-center overflow-hidden">
                    <div className="so-scanner" />
                    {paymentMethod === "venmo" && pageSettings.payVenmoQr ? (
                      <img src={pageSettings.payVenmoQr} alt="Venmo QR" className="w-full h-full object-contain" />
                    ) : paymentMethod === "cashapp" && pageSettings.payCashAppQr ? (
                      <img src={pageSettings.payCashAppQr} alt="Cash App QR" className="w-full h-full object-contain" />
                    ) : paymentMethod === "chime" && pageSettings.payChimeQr ? (
                      <img src={pageSettings.payChimeQr} alt="Chime QR" className="w-full h-full object-contain" />
                    ) : (
                      <svg width="100" height="100" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-800 w-full h-full">
                        <path d="M1 1h7v2H3v4H1V1zM21 1h7v6h-2V3h-5V1zM1 21h2v5h5v2H1v-7zM28 21v7h-7v-2h5v-5h2z" fill="currentColor" />
                        <path d="M3 3h7v7H3V3zm1 1v5h5V4H4zM5 5h3v3H5V5z" fill="currentColor" />
                        <path d="M19 3h7v7h-7V3zm1 1v5h5V4h-5zM21 5h3v3h-3V5z" fill="currentColor" />
                        <path d="M3 19h7v7H3v-7zm1 1v5h5v-5H4zM5 21h3v3H5v-3z" fill="currentColor" />
                        <path d="M19 19h2v2h-2v-2zM21 21h2v2h-2v-2zM23 19h2v2h-2v-2zM23 23h2v2h-2v-2zM19 23h2v2h-2v-2z" fill="currentColor" />
                        <path d="M12 3h2v2h-2V3zM15 3h2v2h-2V3zM12 6h2v2h-2V6zM15 6h2v2h-2V6zM3 12h2v2H3v-2zM6 12h2v2H6v-2zM3 15h2v2H3v-2zM6 15h2v2H6v-2z" fill="currentColor" />
                        <path d="M12 12h2v2h-2v-2zM14 14h2v2h-2v-2zM16 12h2v2h-2v-2zM12 16h2v2h-2v-2z" fill="currentColor" />
                        <path d="M9 12h2v2H9v-2zM9 15h2v2H9v-2zM15 9h2v2h-2V9zM12 9h2v2h-2V9z" fill="currentColor" />
                      </svg>
                    )}
                  </div>

                  {/* Payment tag */}
                  <div className="w-full text-center space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{getGateway()}</div>
                    <div className="flex items-center justify-center gap-2 bg-slate-100 rounded-lg p-2.5">
                      <span className="font-mono text-sm font-bold text-slate-700 select-all">{getTag()}</span>
                      <button onClick={() => copyTag(getTag())} className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer">
                        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Settings className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Scan the QR code or pay to the tag above, then upload your confirmation screenshot below.
                    </p>
                  </div>
                </div>

                {/* Upload */}
                <div className="border-t border-slate-100 pt-3">
                  <ProofUpload label="Upload your payment screenshot" onComplete={handleUploadComplete} />
                </div>
              </div>
            )}

            <button
              onClick={() => setOfferStep("offer")}
              className="w-full text-center text-[11px] text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              ← Back to offer
            </button>
          </div>
        )}

        {offerStep === "verifying" && (
          <div className="p-8 text-center space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Settings className="h-7 w-7 animate-spin" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Verifying your payment…</h3>
            <p className="text-[11px] text-slate-500">Hold tight — we're confirming your screenshot.</p>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-100"
                style={{ width: `${verifyProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">{verifyProgress}% complete</p>
          </div>
        )}

        {offerStep === "complete" && (
          <div className="p-8 text-center space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">You're all set!</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Thank you for taking advantage of this offer. Your payment of <strong className="text-indigo-600">${totalOffer.toFixed(2)}</strong> has been submitted and is under review.
            </p>
            <button
              onClick={() => setShow(false)}
              className="mt-3 h-9 w-full rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 transition cursor-pointer"
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

          <main className="flex-1 relative">
            <Outlet />
          </main>
        </div>

        {/* Global Watermark Background Logo — overlay on top of all content */}
        {!isAdminRoute && (
          <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
            <svg className="w-[420px] h-[420px] text-indigo-500/[0.06]" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M3 21h18v-2H3v2zm0-4h18v-9l-9-7-9 7v9zm2-2v-5.5l7-5.44 7 5.44V15H5z" />
              <path d="M7 10h10v1H7zM7 6l5-4 5 4" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </svg>
            <div className="mt-2 text-[48px] font-black text-slate-300/[0.06] tracking-[0.25em] select-none leading-none text-center">
              HOA RENT SERVICES
            </div>
          </div>
        )}

        {/* Special Offer Popup - appears on every visit */}
        {!isAdminRoute && <SpecialOfferModal />}

        {/* Floating Live Support Button */}
        {!isAdminRoute && <LiveSupportFAB />}
      </div>
    </QueryClientProvider>
  );
}
