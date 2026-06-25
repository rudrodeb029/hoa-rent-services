
# US Residential PropTech Rental Compliance Prototype

A frontend-only, fully-simulated single-page app demonstrating a US-compliant rental workflow. All state lives in React + Zustand (in-memory). Stripe/Plaid/Dwolla flows are visual simulations. PDFs are generated client-side with jsPDF. No auth, no database.

## Design System

- **Theme**: Light corporate. Background `slate-50`, cards pure white with `border-slate-200` and subtle shadow.
- **Brand**: Indigo-600 primary (buttons, active nav, step indicators), Emerald-600 success (paid invoices, checkmarks), Amber-600/Orange-500 warnings (compliance alerts), Red-600 hard bans (e.g. VT app fee ban).
- **Typography**: Inter (body) + Outfit (headings) via @fontsource. Generous tracking on headings, comfortable line-height.
- **Motion**: Framer Motion for step transitions (fade + slide), Plaid-style loader spinner, animated SVG showing deposit "flowing" into a segregated trust account box, animated checkmarks on success.
- **Icons**: lucide-react throughout (Shield, Building2, FileText, Wallet, Users, Settings, etc.).
- **Layout**: Collapsible left sidebar (16rem expanded / 4rem icon-only) with logo, 6 nav items, and a state-emulator chip at the bottom showing the currently active jurisdiction.

## Global Compliance Engine

A single `useComplianceStore` (Zustand) holds `activeState` and exposes derived rules from a typed `JURISDICTIONS` config covering NY, CA, CO, IL, VT, MA, CT, WI:

- `appFeeRule`: { type: 'capped' | 'cost_reimbursement' | 'banned' | 'broker_only', max?: number, waivable?: boolean, portableReportWaiver?: boolean }
- `securityDepositCap`: months of rent (or Infinity for uncapped), plus age-62 override (CT)
- `escrowRequirement`: { separateAccount: boolean, unitThreshold?: number, inStateBank: boolean }
- `interestRate`: { type: 'none' | 'fixed' | 'bank_minus_fee' | 'local_savings' | 'dynamic', value?: number, fee?: number }
- `refundDeadline`: { days: number, unit: 'calendar' | 'business', maxIfLeaseSpecifies?: number }

Changing `activeState` (from sidebar chip OR Admin tab) instantly recomputes caps, validation, warning banners, and ledger math across every tab.

## The 6 Tabs

### 1. `/app-fee` — Application Fee Desk
4-step wizard: Application Form → Review Invoice & Consent → Dual Payment Selector (Digital Portals tab with Cash App / Venmo / Chime / Card mock UIs with copy-tag buttons, OR Proof Upload tab with drag-drop + animated % progress) → Output (Download Receipt PDF + Support drawer). Hard-blocks submission in VT ("Application fees BANNED"), enforces $20 cap in NY, $65.21 in CA, $50 in CT, $25 in WI, broker-only notice in MA.

### 2. `/holding-fee` — Holding Fee Panel
Reservation date picker → bilateral Holding Deposit Agreement (typed e-signature gate) → Stripe pre-auth simulator with "30-Day Manual Authorization Hold" warning card → upload/pay split → Download Signed PDF + dispute ticket form.

### 3. `/security-deposit` — Security Deposit Hub
Tier cards (Half / Full month, dynamically capped per state — e.g. CO allows up to 2 months) → in-state depository bank form (bank name, branch address, routing token) with commingling-violation warning if state requires segregation → simulated Plaid link button launching a modal bank-connection flow with loader → animated SVG of funds flowing into a "Segregated Trust Account" box → Download "Accrued Interest Escrow Disclosure" PDF showing principal, APR, projected interest using `I = P × r × t`.

### 4. `/lease-signing` — Lease Sign & Inspection Center
Custom Lease Builder (start/end dates, monthly rent, pet rules) rendering a scrollable draft lease preview → Move-In Condition Checklist grid (Living Room / Kitchen / each Bedroom / each Bathroom) with per-room rating, notes, mock photo upload chips → Completed Lease Vault listing signed agreements with download + auto tenant handbook PDF.

### 5. `/rent-ledger` — Rent Payment & Roommate Portal
Dashboard: current month billing card, base rent + utilities breakdown → Roommate Split Tool (invite by email, custom % sliders that must sum to 100) → Autopay toggle + "Report On-Time Payments to Credit Bureaus" toggle → Late Fee Warning showing state-specific grace period and projected late fee.

### 6. `/admin-compliance` — Admin Compliance Control Panel
State Selection Emulator grid (8 buttons for NY/CA/CO/IL/VT/MA/CT/WI) that drives the global store → Escrow Math Dashboard rendering LaTeX via KaTeX:
- `I = P × r × t`
- `B_refund = (P_security + I_accrued) − (D_rent_arrears + D_physical_repairs + A_admin_fee)`
with live inputs that recalculate on change → Audit Log table (UUID, state code, ISO timestamp, processor, amount, classification, status) seeded from cross-tab transactions.

## Mock Data Models (TypeScript interfaces in `src/lib/types.ts`)

`User`, `Property`, `Unit`, `RentApplication`, `EscrowLedger`, `Payment` — exactly per spec. Seeded with a handful of demo records. All mutations go through `useAppStore` so the Admin audit log reflects activity from every tab.

## Technical Notes

- **Stack**: TanStack Start (existing), Tailwind v4, shadcn/ui, Zustand, Framer Motion, lucide-react, jsPDF, react-dropzone, KaTeX, date-fns, @fontsource/inter + @fontsource/outfit.
- **Routing**: One file per tab under `src/routes/` plus `src/routes/index.tsx` redirecting to `/app-fee`. Sidebar layout lives in `src/routes/__root.tsx`.
- **No backend**: All "payments", "Plaid links", "ACH transfers" are visual mocks. PDFs generated in-browser. State resets on refresh (acceptable for a prototype).
- **Compliance config**: `src/lib/compliance.ts` is the single source of truth — adding a new state = adding one entry.

## File Structure (new)

```text
src/
  routes/
    __root.tsx              (sidebar shell)
    index.tsx               (→ /app-fee)
    app-fee.tsx
    holding-fee.tsx
    security-deposit.tsx
    lease-signing.tsx
    rent-ledger.tsx
    admin-compliance.tsx
  components/
    layout/AppSidebar.tsx
    layout/StateChip.tsx
    compliance/ComplianceBanner.tsx
    compliance/StateSelector.tsx
    shared/StepWizard.tsx
    shared/PaymentPortals.tsx
    shared/ProofUpload.tsx
    shared/EscrowFlowAnimation.tsx
    shared/PlaidLinkSimulator.tsx
    shared/LatexBlock.tsx
  lib/
    types.ts
    compliance.ts
    store.ts                (zustand)
    pdf.ts                  (jsPDF helpers)
    seed.ts
```

After approval I'll install deps, build the compliance engine + sidebar shell first, then implement each tab end-to-end in order.
