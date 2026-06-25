import { create } from "zustand";
import type { StateCode } from "./compliance";
import type { Payment, Property, Unit, User } from "./types";

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

interface AppState {
  activeState: StateCode;
  setActiveState: (s: StateCode) => void;

  users: User[];
  properties: Property[];
  units: Unit[];
  payments: Payment[];

  logPayment: (p: Omit<Payment, "id" | "timestamp">) => Payment;
}

const seedUsers: User[] = [
  { id: "u_tenant", name: "Avery Tenant", email: "avery@example.com", role: "tenant" },
  { id: "u_landlord", name: "Morgan Landlord", email: "morgan@example.com", role: "landlord" },
  { id: "u_admin", name: "Riley Admin", email: "riley@example.com", role: "admin" },
];

const seedProperties: Property[] = [
  { id: "p_1", name: "Hudson Heights", street: "120 Riverside Dr", city: "New York", state: "NY", zip: "10024" },
  { id: "p_2", name: "Sunset Terrace", street: "880 La Brea Ave", city: "Los Angeles", state: "CA", zip: "90036" },
];

const seedUnits: Unit[] = [
  { id: "un_1", propertyId: "p_1", unitNumber: "4B", baseRent: 3200, bedrooms: 1, bathrooms: 1, available: true },
  { id: "un_2", propertyId: "p_2", unitNumber: "210", baseRent: 2750, bedrooms: 2, bathrooms: 2, available: true },
];

export const useAppStore = create<AppState>((set, get) => ({
  activeState: "NY",
  setActiveState: (s) => set({ activeState: s }),

  users: seedUsers,
  properties: seedProperties,
  units: seedUnits,
  payments: [
    {
      id: "seed-pay-0001",
      amount: 20,
      classification: "application_fee",
      status: "completed",
      processor: "Stripe_Card",
      state: "NY",
      timestamp: "2026-06-21T14:32:00.000Z",
    },
    {
      id: "seed-pay-0002",
      amount: 3200,
      classification: "security_deposit",
      status: "held",
      processor: "Dwolla_ACH",
      state: "NY",
      timestamp: "2026-06-22T09:15:00.000Z",
    },
  ],

  logPayment: (p) => {
    const payment: Payment = { ...p, id: uid(), timestamp: new Date().toISOString() };
    set({ payments: [payment, ...get().payments] });
    return payment;
  },
}));
