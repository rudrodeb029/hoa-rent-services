import type { StateCode } from "./compliance";

export type UserRole = "tenant" | "landlord" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Property {
  id: string;
  name: string;
  street: string;
  city: string;
  state: StateCode;
  zip: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  baseRent: number;
  bedrooms: number;
  bathrooms: number;
  available: boolean;
}

export interface RentApplication {
  id: string;
  tenantId: string;
  unitId: string;
  consentDate?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  reusableScreening: boolean;
}

export interface EscrowLedger {
  id: string;
  landlordId: string;
  tenantId: string;
  trustBankName: string;
  bankAddress: string;
  principal: number;
  accruedInterest: number;
  apr: number;
  state: StateCode;
}

export type PaymentClassification = "application_fee" | "holding_fee" | "security_deposit" | "rent" | "home_insurance" | "special_offer";
export type PaymentProcessor = "Stripe_Card" | "Dwolla_ACH" | "Uploaded_Screenshot" | "Cash_App" | "Venmo" | "Chime";
export type PaymentStatus = "pending" | "completed" | "failed" | "held";

export interface Payment {
  id: string;
  applicationId?: string;
  amount: number;
  classification: PaymentClassification;
  status: PaymentStatus;
  processor: PaymentProcessor;
  state: StateCode;
  timestamp: string;
  tenantName?: string;
  unitAddress?: string;
  proofImage?: string;
}
