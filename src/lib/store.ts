import { create } from "zustand";
import type { StateCode } from "./compliance";
import type { Payment, Property, Unit, User, PaymentStatus } from "./types";
import { supabase } from "./supabase";

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export interface PageSettings {
  // App Fee
  appFeeAmount: number;
  appFeeDisclosures: string;
  
  // Holding Fee
  holdingFeeAmount: number;
  holdingReservationDays: number;
  holdingLandlordName: string;
  
  // Lease
  leaseLandlordName: string;
  leaseLandlordAddress: string;
  leaseLandlordEmail: string;
  leaseFurnishedStatus: string;
  leasePetPolicy: string;
  
  // Security Deposit
  securityBankName: string;
  securityBankAddress: string;
  securityCustomApr: number; // e.g. 0.015 for 1.5%
  
  // Rent
  rentGraceDays: number;
  rentLateFeePercent: number;
}

interface AppState {
  activeState: StateCode;
  setActiveState: (s: StateCode) => void;

  users: User[];
  properties: Property[];
  units: Unit[];
  payments: Payment[];

  pageSettings: PageSettings;
  updatePageSettings: (settings: Partial<PageSettings>) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus) => void;

  logPayment: (p: Omit<Payment, "id" | "timestamp">) => Payment;
  
  isLoading: boolean;
  initializeStore: () => Promise<void>;
  syncDatabase: () => Promise<void>;
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

const defaultSettings: PageSettings = {
  appFeeAmount: 40,
  appFeeDisclosures: "Regional background check fees are capped by local state landlord-tenant regulations. A refund receipt is generated for your transaction.",
  holdingFeeAmount: 250,
  holdingReservationDays: 30,
  holdingLandlordName: "Morgan Landlord",
  leaseLandlordName: "LEE SCOTT",
  leaseLandlordAddress: "174 Schools Dr, Camden, TN",
  leaseLandlordEmail: "leescott11225@gmail.com",
  leaseFurnishedStatus: "fully furnished",
  leasePetPolicy: "No pets allowed",
  securityBankName: "HOA Rent Services Escrow Bank",
  securityBankAddress: "100 Trust Way, Suite 400",
  securityCustomApr: 0.015,
  rentGraceDays: 5,
  rentLateFeePercent: 10,
};

export const useAppStore = create<AppState>((set, get) => ({
  activeState: "NY",
  setActiveState: (s) => set({ activeState: s }),

  users: seedUsers,
  properties: seedProperties,
  units: seedUnits,
  pageSettings: defaultSettings,
  isLoading: false,
  
  payments: [
    {
      id: "seed-pay-0001",
      amount: 40,
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

  initializeStore: async () => {
    set({ isLoading: true });
    try {
      // 1. Fetch Page Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("page_settings")
        .select("*")
        .eq("id", 1)
        .single();
      
      if (!settingsError && settingsData) {
        set({
          pageSettings: {
            appFeeAmount: Number(settingsData.app_fee_amount),
            appFeeDisclosures: settingsData.app_fee_disclosures,
            holdingFeeAmount: Number(settingsData.holding_fee_amount),
            holdingReservationDays: Number(settingsData.holding_reservation_days),
            holdingLandlordName: settingsData.holding_landlord_name,
            leaseLandlordName: settingsData.lease_landlord_name,
            leaseLandlordAddress: settingsData.lease_landlord_address,
            leaseLandlordEmail: settingsData.lease_landlord_email,
            leaseFurnishedStatus: settingsData.lease_furnished_status,
            leasePetPolicy: settingsData.lease_pet_policy,
            securityBankName: settingsData.security_bank_name,
            securityBankAddress: settingsData.security_bank_address,
            securityCustomApr: Number(settingsData.security_custom_apr),
            rentGraceDays: Number(settingsData.rent_grace_days),
            rentLateFeePercent: Number(settingsData.rent_late_fee_percent),
          }
        });
      }

      // 2. Fetch Payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order("timestamp", { ascending: false });

      if (!paymentsError && paymentsData && paymentsData.length > 0) {
        set({
          payments: paymentsData.map((p: any) => ({
            id: p.id,
            applicationId: p.application_id || undefined,
            amount: Number(p.amount),
            classification: p.classification,
            status: p.status,
            processor: p.processor,
            state: p.state,
            timestamp: p.timestamp,
            tenantName: p.tenant_name || undefined,
            unitAddress: p.unit_address || undefined,
            proofImage: p.proof_image || undefined
          }))
        });
      }

      // 3. Fetch Users, Properties, Units (fallback to seed arrays if empty)
      const { data: usersData } = await supabase.from("users").select("*");
      if (usersData && usersData.length > 0) {
        set({ users: usersData });
      }

      const { data: propsData } = await supabase.from("properties").select("*");
      if (propsData && propsData.length > 0) {
        set({
          properties: propsData.map((pr: any) => ({
            id: pr.id,
            name: pr.name,
            street: pr.street,
            city: pr.city,
            state: pr.state,
            zip: pr.zip
          }))
        });
      }

      const { data: unitsData } = await supabase.from("units").select("*");
      if (unitsData && unitsData.length > 0) {
        set({
          units: unitsData.map((u: any) => ({
            id: u.id,
            propertyId: u.property_id,
            unitNumber: u.unit_number,
            baseRent: Number(u.base_rent),
            bedrooms: Number(u.bedrooms),
            bathrooms: Number(u.bathrooms),
            available: u.available
          }))
        });
      }

    } catch (err) {
      console.error("Failed to initialize store from Supabase:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  syncDatabase: async () => {
    try {
      // 1. Fetch Page Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("page_settings")
        .select("*")
        .eq("id", 1)
        .single();
      
      if (!settingsError && settingsData) {
        set({
          pageSettings: {
            appFeeAmount: Number(settingsData.app_fee_amount),
            appFeeDisclosures: settingsData.app_fee_disclosures,
            holdingFeeAmount: Number(settingsData.holding_fee_amount),
            holdingReservationDays: Number(settingsData.holding_reservation_days),
            holdingLandlordName: settingsData.holding_landlord_name,
            leaseLandlordName: settingsData.lease_landlord_name,
            leaseLandlordAddress: settingsData.lease_landlord_address,
            leaseLandlordEmail: settingsData.lease_landlord_email,
            leaseFurnishedStatus: settingsData.lease_furnished_status,
            leasePetPolicy: settingsData.lease_pet_policy,
            securityBankName: settingsData.security_bank_name,
            securityBankAddress: settingsData.security_bank_address,
            securityCustomApr: Number(settingsData.security_custom_apr),
            rentGraceDays: Number(settingsData.rent_grace_days),
            rentLateFeePercent: Number(settingsData.rent_late_fee_percent),
          }
        });
      }

      // 2. Fetch Payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order("timestamp", { ascending: false });

      if (!paymentsError && paymentsData && paymentsData.length > 0) {
        set({
          payments: paymentsData.map((p: any) => ({
            id: p.id,
            applicationId: p.application_id || undefined,
            amount: Number(p.amount),
            classification: p.classification,
            status: p.status,
            processor: p.processor,
            state: p.state,
            timestamp: p.timestamp,
            tenantName: p.tenant_name || undefined,
            unitAddress: p.unit_address || undefined,
            proofImage: p.proof_image || undefined
          }))
        });
      }
    } catch (err) {
      console.error("Failed to sync store from Supabase:", err);
    }
  },

  updatePageSettings: (settings) => {
    const newSettings = { ...get().pageSettings, ...settings };
    set({ pageSettings: newSettings });

    supabase
      .from("page_settings")
      .update({
        app_fee_amount: newSettings.appFeeAmount,
        app_fee_disclosures: newSettings.appFeeDisclosures,
        holding_fee_amount: newSettings.holdingFeeAmount,
        holding_reservation_days: newSettings.holdingReservationDays,
        holding_landlord_name: newSettings.holdingLandlordName,
        lease_landlord_name: newSettings.leaseLandlordName,
        lease_landlord_address: newSettings.leaseLandlordAddress,
        lease_landlord_email: newSettings.leaseLandlordEmail,
        lease_furnished_status: newSettings.leaseFurnishedStatus,
        lease_pet_policy: newSettings.leasePetPolicy,
        security_bank_name: newSettings.securityBankName,
        security_bank_address: newSettings.securityBankAddress,
        security_custom_apr: newSettings.securityCustomApr,
        rent_grace_days: newSettings.rentGraceDays,
        rent_late_fee_percent: newSettings.rentLateFeePercent,
        updated_at: new Date().toISOString()
      })
      .eq("id", 1)
      .then(({ error }) => {
        if (error) console.error("Error updating page settings in Supabase:", error);
      });
  },

  updatePaymentStatus: (id, status) => {
    set({
      payments: get().payments.map(p => p.id === id ? { ...p, status } : p)
    });

    supabase
      .from("payments")
      .update({ status })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Error updating payment status in Supabase:", error);
      });
  },

  logPayment: (p) => {
    const payment: Payment = { ...p, id: uid(), timestamp: new Date().toISOString() };
    set({ payments: [payment, ...get().payments] });

    supabase
      .from("payments")
      .insert({
        id: payment.id,
        application_id: payment.applicationId || null,
        amount: payment.amount,
        classification: payment.classification,
        status: payment.status,
        processor: payment.processor,
        state: payment.state,
        timestamp: payment.timestamp,
        tenant_name: payment.tenantName || null,
        unit_address: payment.unitAddress || null,
        proof_image: payment.proofImage || null
      })
      .then(({ error }) => {
        if (error) console.error("Error inserting payment to Supabase:", error);
      });

    return payment;
  },
}));
