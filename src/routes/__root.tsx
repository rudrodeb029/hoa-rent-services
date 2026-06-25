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
  Wallet,
  Menu,
  ChevronLeft,
  Settings,
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        {mobileOpen && (
          <div className="fixed inset-0 z-30 bg-slate-900/40 md:hidden" onClick={() => setMobileOpen(false)} />
        )}
        <div className={`${mobileOpen ? "block" : "hidden"} md:block`}>
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} onClickLink={() => setMobileOpen(false)} />
        </div>
        <div className={`flex min-h-screen flex-col transition-all duration-200 ${collapsed ? "md:pl-16" : "md:pl-64"}`}>
          <MobileBar onOpen={() => setMobileOpen(true)} />
          <main className="flex-1 relative z-10">
            <Outlet />
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
