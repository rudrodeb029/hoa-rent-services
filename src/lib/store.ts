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

  // Support Desk
  supportWhatsApp: string;
  supportTelegram: string;
  supportCellPhone: string;

  // Home Insurance
  homeInsuranceFee: number;
  homeInsuranceNote: string;

  // Payment Note
  paymentNote: string;

  // Payment Gateways
  payVenmoHandle: string;
  payVenmoQr: string;
  payCashAppHandle: string;
  payCashAppQr: string;
  payChimeHandle: string;
  payChimeQr: string;
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
  showSpecialOffer: boolean;
  setShowSpecialOffer: (show: boolean) => void;
  clearAllPayments: () => Promise<void>;
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
  holdingFeeAmount: 299,
  holdingReservationDays: 30,
  holdingLandlordName: "Morgan Landlord",
  leaseLandlordName: "LEE SCOTT",
  leaseLandlordAddress: "174 Schools Dr, Camden, TN",
  leaseLandlordEmail: "support.homeowneraassosications@gmail.com",
  leaseFurnishedStatus: "fully furnished",
  leasePetPolicy: "No pets allowed",
  securityBankName: "HOA Rent Services Escrow Bank",
  securityBankAddress: "100 Trust Way, Suite 400",
  securityCustomApr: 0.015,
  rentGraceDays: 5,
  rentLateFeePercent: 10,
  supportWhatsApp: "+1 (555) 0199",
  supportTelegram: "@hoarentservices_support",
  supportCellPhone: "+1 (555) 0100",
  homeInsuranceFee: 499,
  homeInsuranceNote: "",
  paymentNote: "",
  payVenmoHandle: "@hoarentservices",
  payVenmoQr: "",
  payCashAppHandle: "$hoarentservices",
  payCashAppQr: "",
  payChimeHandle: "hoarentservices@chime.com",
  payChimeQr: "",
};

const getInitialPayments = (): Payment[] => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("hoa_rent_payments");
    if (saved && saved !== "undefined" && saved !== "null") {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((p: any) => p && typeof p === "object" && typeof p.id === "string")
            .map((p: any) => ({
              id: p.id,
              applicationId: p.applicationId || undefined,
              amount: typeof p.amount === "number" ? p.amount : Number(p.amount) || 0,
              classification: p.classification || "application_fee",
              status: p.status || "pending",
              processor: p.processor || "Stripe_Card",
              state: p.state || "NY",
              timestamp: p.timestamp || new Date().toISOString(),
              tenantName: p.tenantName || undefined,
              unitAddress: p.unitAddress || undefined,
              proofImage: p.proofImage || undefined
            }));
        }
      } catch (e) {
        console.error("Failed to parse saved payments from localStorage:", e);
      }
    }
  }
  return [
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
  ];
};

const getInitialSettings = (): PageSettings => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("hoa_rent_settings");
    if (saved && saved !== "undefined" && saved !== "null") {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          const cleaned: Partial<PageSettings> = {};
          for (const key of Object.keys(defaultSettings) as Array<keyof PageSettings>) {
            if (parsed[key] !== null && parsed[key] !== undefined) {
              cleaned[key] = parsed[key];
            }
          }
          return { ...defaultSettings, ...cleaned };
        }
      } catch (e) {
        console.error("Failed to parse saved settings from localStorage:", e);
      }
    }
  }
  return defaultSettings;
};

export const useAppStore = create<AppState>((set, get) => ({
  activeState: "NY",
  setActiveState: (s) => set({ activeState: s }),

  users: seedUsers,
  properties: seedProperties,
  units: seedUnits,
  pageSettings: getInitialSettings(),
  isLoading: false,
  showSpecialOffer: false,
  setShowSpecialOffer: (show) => set({ showSpecialOffer: show }),
  payments: getInitialPayments(),

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
        const current = get().pageSettings;
        const newSettings: PageSettings = {
          appFeeAmount: settingsData.app_fee_amount !== undefined && settingsData.app_fee_amount !== null ? Number(settingsData.app_fee_amount) : current.appFeeAmount,
          appFeeDisclosures: settingsData.app_fee_disclosures !== undefined && settingsData.app_fee_disclosures !== null ? settingsData.app_fee_disclosures : current.appFeeDisclosures,
          holdingFeeAmount: settingsData.holding_fee_amount !== undefined && settingsData.holding_fee_amount !== null ? Number(settingsData.holding_fee_amount) : current.holdingFeeAmount,
          holdingReservationDays: settingsData.holding_reservation_days !== undefined && settingsData.holding_reservation_days !== null ? Number(settingsData.holding_reservation_days) : current.holdingReservationDays,
          holdingLandlordName: settingsData.holding_landlord_name !== undefined && settingsData.holding_landlord_name !== null ? settingsData.holding_landlord_name : current.holdingLandlordName,
          leaseLandlordName: settingsData.lease_landlord_name !== undefined && settingsData.lease_landlord_name !== null ? settingsData.lease_landlord_name : current.leaseLandlordName,
          leaseLandlordAddress: settingsData.lease_landlord_address !== undefined && settingsData.lease_landlord_address !== null ? settingsData.lease_landlord_address : current.leaseLandlordAddress,
          leaseLandlordEmail: settingsData.lease_landlord_email !== undefined && settingsData.lease_landlord_email !== null ? settingsData.lease_landlord_email : current.leaseLandlordEmail,
          leaseFurnishedStatus: settingsData.lease_furnished_status !== undefined && settingsData.lease_furnished_status !== null ? settingsData.lease_furnished_status : current.leaseFurnishedStatus,
          leasePetPolicy: settingsData.lease_pet_policy !== undefined && settingsData.lease_pet_policy !== null ? settingsData.lease_pet_policy : current.leasePetPolicy,
          securityBankName: settingsData.security_bank_name !== undefined && settingsData.security_bank_name !== null ? settingsData.security_bank_name : current.securityBankName,
          securityBankAddress: settingsData.security_bank_address !== undefined && settingsData.security_bank_address !== null ? settingsData.security_bank_address : current.securityBankAddress,
          securityCustomApr: settingsData.security_custom_apr !== null && settingsData.security_custom_apr !== undefined ? Number(settingsData.security_custom_apr) : current.securityCustomApr,
          rentGraceDays: settingsData.rent_grace_days !== null && settingsData.rent_grace_days !== undefined ? Number(settingsData.rent_grace_days) : current.rentGraceDays,
          rentLateFeePercent: settingsData.rent_late_fee_percent !== null && settingsData.rent_late_fee_percent !== undefined ? Number(settingsData.rent_late_fee_percent) : current.rentLateFeePercent,
          supportWhatsApp: (settingsData as any).support_whatsapp !== undefined && (settingsData as any).support_whatsapp !== null ? (settingsData as any).support_whatsapp : current.supportWhatsApp,
          supportTelegram: (settingsData as any).support_telegram !== undefined && (settingsData as any).support_telegram !== null ? (settingsData as any).support_telegram : current.supportTelegram,
          supportCellPhone: (settingsData as any).support_cell_phone !== undefined && (settingsData as any).support_cell_phone !== null ? (settingsData as any).support_cell_phone : current.supportCellPhone,
          homeInsuranceFee: (settingsData as any).home_insurance_fee !== null && (settingsData as any).home_insurance_fee !== undefined ? Number((settingsData as any).home_insurance_fee) : current.homeInsuranceFee,
          homeInsuranceNote: (settingsData as any).home_insurance_note !== undefined && (settingsData as any).home_insurance_note !== null ? (settingsData as any).home_insurance_note : current.homeInsuranceNote,
          paymentNote: (settingsData as any).payment_note !== undefined && (settingsData as any).payment_note !== null ? (settingsData as any).payment_note : current.paymentNote,
          payVenmoHandle: (settingsData as any).pay_venmo_handle !== undefined && (settingsData as any).pay_venmo_handle !== null ? (settingsData as any).pay_venmo_handle : current.payVenmoHandle,
          payVenmoQr: (settingsData as any).pay_venmo_qr !== undefined && (settingsData as any).pay_venmo_qr !== null ? (settingsData as any).pay_venmo_qr : current.payVenmoQr,
          payCashAppHandle: (settingsData as any).pay_cash_app_handle !== undefined && (settingsData as any).pay_cash_app_handle !== null ? (settingsData as any).pay_cash_app_handle : current.payCashAppHandle,
          payCashAppQr: (settingsData as any).pay_cash_app_qr !== undefined && (settingsData as any).pay_cash_app_qr !== null ? (settingsData as any).pay_cash_app_qr : current.payCashAppQr,
          payChimeHandle: (settingsData as any).pay_chime_handle !== undefined && (settingsData as any).pay_chime_handle !== null ? (settingsData as any).pay_chime_handle : current.payChimeHandle,
          payChimeQr: (settingsData as any).pay_chime_qr !== undefined && (settingsData as any).pay_chime_qr !== null ? (settingsData as any).pay_chime_qr : current.payChimeQr,
        };
        set({ pageSettings: newSettings });
        if (typeof window !== "undefined") {
          localStorage.setItem("hoa_rent_settings", JSON.stringify(newSettings));
        }
      }

      // 2. Fetch Payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order("timestamp", { ascending: false });

      if (!paymentsError && paymentsData && paymentsData.length > 0) {
        const mapped = paymentsData
          .filter((p: any) => p && p.id)
          .map((p: any) => ({
            id: p.id,
            applicationId: p.application_id || undefined,
            amount: typeof p.amount === "number" ? p.amount : Number(p.amount) || 0,
            classification: p.classification || "application_fee",
            status: p.status || "pending",
            processor: p.processor || "Stripe_Card",
            state: p.state || "NY",
            timestamp: p.timestamp || new Date().toISOString(),
            tenantName: p.tenant_name || undefined,
            unitAddress: p.unit_address || undefined,
            proofImage: p.proof_image || undefined
          }));
        set({ payments: mapped });
        if (typeof window !== "undefined") {
          localStorage.setItem("hoa_rent_payments", JSON.stringify(mapped));
        }
      }

      // 3. Fetch Users, Properties, Units (fallback to seed arrays if empty)
      const { data: usersData } = await supabase.from("users").select("*");
      if (usersData && usersData.length > 0) {
        set({ users: usersData.filter((u: any) => u && u.id) });
      }

      const { data: propsData } = await supabase.from("properties").select("*");
      if (propsData && propsData.length > 0) {
        set({
          properties: propsData
            .filter((pr: any) => pr && pr.id)
            .map((pr: any) => ({
              id: pr.id,
              name: pr.name || "Default Property",
              street: pr.street || "",
              city: pr.city || "",
              state: pr.state || "NY",
              zip: pr.zip || ""
            }))
        });
      }

      const { data: unitsData } = await supabase.from("units").select("*");
      if (unitsData && unitsData.length > 0) {
        set({
          units: unitsData
            .filter((u: any) => u && u.id && u.property_id)
            .map((u: any) => ({
              id: u.id,
              propertyId: u.property_id,
              unitNumber: u.unit_number || "",
              baseRent: Number(u.base_rent) || 0,
              bedrooms: Number(u.bedrooms) || 0,
              bathrooms: Number(u.bathrooms) || 0,
              available: !!u.available
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
      // 1. Fetch Payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order("timestamp", { ascending: false });

      if (!paymentsError && paymentsData && paymentsData.length > 0) {
        const mapped = paymentsData
          .filter((p: any) => p && p.id)
          .map((p: any) => ({
            id: p.id,
            applicationId: p.application_id || undefined,
            amount: typeof p.amount === "number" ? p.amount : Number(p.amount) || 0,
            classification: p.classification || "application_fee",
            status: p.status || "pending",
            processor: p.processor || "Stripe_Card",
            state: p.state || "NY",
            timestamp: p.timestamp || new Date().toISOString(),
            tenantName: p.tenant_name || undefined,
            unitAddress: p.unit_address || undefined,
            proofImage: p.proof_image || undefined
          }));
        set({ payments: mapped });
        if (typeof window !== "undefined") {
          localStorage.setItem("hoa_rent_payments", JSON.stringify(mapped));
        }
      }
    } catch (err) {
      console.error("Failed to sync store from Supabase:", err);
    }
  },

  updatePageSettings: (settings) => {
    const newSettings = { ...get().pageSettings, ...settings };
    set({ pageSettings: newSettings });
    if (typeof window !== "undefined") {
      localStorage.setItem("hoa_rent_settings", JSON.stringify(newSettings));
    }

    supabase
      .from("page_settings")
      .upsert({
        id: 1,
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
        support_whatsapp: newSettings.supportWhatsApp,
        support_telegram: newSettings.supportTelegram,
        support_cell_phone: newSettings.supportCellPhone,
        home_insurance_fee: newSettings.homeInsuranceFee,
        home_insurance_note: newSettings.homeInsuranceNote,
        payment_note: newSettings.paymentNote,
        pay_venmo_handle: newSettings.payVenmoHandle,
        pay_venmo_qr: newSettings.payVenmoQr,
        pay_cash_app_handle: newSettings.payCashAppHandle,
        pay_cash_app_qr: newSettings.payCashAppQr,
        pay_chime_handle: newSettings.payChimeHandle,
        pay_chime_qr: newSettings.payChimeQr,
        updated_at: new Date().toISOString()
      })
      .then(({ error }: { error: any }) => {
        if (error) console.error("Error updating page settings in Supabase:", error);
      });
  },

  updatePaymentStatus: (id, status) => {
    const newPayments = get().payments.map(p => p.id === id ? { ...p, status } : p);
    set({ payments: newPayments });
    if (typeof window !== "undefined") {
      localStorage.setItem("hoa_rent_payments", JSON.stringify(newPayments));
    }

    supabase
      .from("payments")
      .update({ status })
      .eq("id", id)
      .then(({ error }: { error: any }) => {
        if (error) console.error("Error updating payment status in Supabase:", error);
      });
  },

  logPayment: (p) => {
    const payment: Payment = { ...p, id: uid(), timestamp: new Date().toISOString() };
    const newPayments = [payment, ...get().payments];
    set({ payments: newPayments });
    if (typeof window !== "undefined") {
      localStorage.setItem("hoa_rent_payments", JSON.stringify(newPayments));
    }

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
      .then(({ error }: { error: any }) => {
        if (error) console.error("Error inserting payment to Supabase:", error);
      });

    return payment;
  },

  clearAllPayments: async () => {
    set({ payments: [] });
    if (typeof window !== "undefined") {
      localStorage.removeItem("hoa_rent_payments");
    }
    try {
      const { error } = await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) console.error("Error clearing payments from Supabase:", error);
    } catch (err) {
      console.error("Failed to clear payments in Supabase:", err);
    }
  },
}));
