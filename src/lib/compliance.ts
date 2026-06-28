export type StateCode =
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "GA"
  | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY" | "LA" | "ME" | "MD"
  | "MA" | "MI" | "MN" | "MS" | "MO" | "MT" | "NE" | "NV" | "NH" | "NJ"
  | "NM" | "NY" | "NC" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI" | "SC"
  | "SD" | "TN" | "TX" | "UT" | "VT" | "VA" | "WA" | "WV" | "WI" | "WY";

export type AppFeeRule =
  | { type: "capped"; max: number; waivable?: boolean }
  | { type: "cost_reimbursement"; max?: number; portableReportWaiver?: boolean }
  | { type: "banned" }
  | { type: "broker_only" };

export interface EscrowRequirement {
  separateAccount: boolean;
  unitThreshold?: number;
  inStateBank: boolean;
  commingleAllowed: boolean;
}

export type InterestRate =
  | { type: "none" }
  | { type: "fixed"; value: number }
  | { type: "bank_minus_fee"; fee: number }
  | { type: "local_savings"; minLeaseMonths?: number }
  | { type: "dynamic"; label: string };

export interface RefundDeadline {
  days: number;
  unit: "calendar" | "business";
  maxIfLeaseSpecifies?: number;
}

export interface Jurisdiction {
  code: StateCode;
  name: string;
  appFeeRule: AppFeeRule;
  securityDepositCapMonths: number; // Infinity if uncapped
  seniorOverrideMonths?: number; // e.g. CT age 62+
  escrowRequirement: EscrowRequirement;
  interestRate: InterestRate;
  refundDeadline: RefundDeadline;
  lateFeeGraceDays: number;
  notes?: string;
}

export const JURISDICTIONS: Record<StateCode, Jurisdiction> = {
  AL: {
    code: "AL",
    name: "Alabama",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 60, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  AK: {
    code: "AK",
    name: "Alaska",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 2,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 14, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  AZ: {
    code: "AZ",
    name: "Arizona",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1.5,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 14, unit: "business" },
    lateFeeGraceDays: 5,
  },
  AR: {
    code: "AR",
    name: "Arkansas",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 2,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 60, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  CA: {
    code: "CA",
    name: "California",
    appFeeRule: { type: "cost_reimbursement", max: 65.21 },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 21, unit: "calendar" },
    lateFeeGraceDays: 3,
    notes: "AB 12 caps security deposit at 1 month. Renter has priority over landlord creditors.",
  },
  CO: {
    code: "CO",
    name: "Colorado",
    appFeeRule: { type: "cost_reimbursement", portableReportWaiver: true },
    securityDepositCapMonths: 2,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar", maxIfLeaseSpecifies: 60 },
    lateFeeGraceDays: 7,
    notes: "Free application fee if a portable screening report is provided.",
  },
  CT: {
    code: "CT",
    name: "Connecticut",
    appFeeRule: { type: "capped", max: 50 },
    securityDepositCapMonths: 2,
    seniorOverrideMonths: 1,
    escrowRequirement: { separateAccount: true, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "dynamic", label: "CT Banking Commissioner rate" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 9,
  },
  DE: {
    code: "DE",
    name: "Delaware",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: true, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "none" },
    refundDeadline: { days: 20, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  FL: {
    code: "FL",
    name: "Florida",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: true, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "fixed", value: 5 },
    refundDeadline: { days: 15, unit: "calendar", maxIfLeaseSpecifies: 30 },
    lateFeeGraceDays: 5,
  },
  GA: {
    code: "GA",
    name: "Georgia",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: true, inStateBank: false, commingleAllowed: false },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  HI: {
    code: "HI",
    name: "Hawaii",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 14, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  ID: {
    code: "ID",
    name: "Idaho",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 21, unit: "calendar", maxIfLeaseSpecifies: 30 },
    lateFeeGraceDays: 5,
  },
  IL: {
    code: "IL",
    name: "Illinois",
    appFeeRule: { type: "cost_reimbursement", portableReportWaiver: true },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: true, unitThreshold: 25, inStateBank: false, commingleAllowed: false },
    interestRate: { type: "local_savings", minLeaseMonths: 6 },
    refundDeadline: { days: 45, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  IN: {
    code: "IN",
    name: "Indiana",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 45, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  IA: {
    code: "IA",
    name: "Iowa",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 2,
    escrowRequirement: { separateAccount: true, inStateBank: false, commingleAllowed: false },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  KS: {
    code: "KS",
    name: "Kansas",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  KY: {
    code: "KY",
    name: "Kentucky",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: true, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar", maxIfLeaseSpecifies: 60 },
    lateFeeGraceDays: 5,
  },
  LA: {
    code: "LA",
    name: "Louisiana",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  ME: {
    code: "ME",
    name: "Maine",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 2,
    escrowRequirement: { separateAccount: true, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "none" },
    refundDeadline: { days: 21, unit: "calendar", maxIfLeaseSpecifies: 30 },
    lateFeeGraceDays: 5,
  },
  MD: {
    code: "MD",
    name: "Maryland",
    appFeeRule: { type: "capped", max: 25 },
    securityDepositCapMonths: 2,
    escrowRequirement: { separateAccount: true, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "fixed", value: 3 },
    refundDeadline: { days: 45, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  MA: {
    code: "MA",
    name: "Massachusetts",
    appFeeRule: { type: "broker_only" },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: true, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "fixed", value: 5 },
    refundDeadline: { days: 14, unit: "business" },
    lateFeeGraceDays: 30,
    notes: "Landlords may not charge application fees; brokers only.",
  },
  MI: {
    code: "MI",
    name: "Michigan",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1.5,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  MN: {
    code: "MN",
    name: "Minnesota",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "fixed", value: 1 },
    refundDeadline: { days: 21, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  MS: {
    code: "MS",
    name: "Mississippi",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 45, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  MO: {
    code: "MO",
    name: "Missouri",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 2,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  MT: {
    code: "MT",
    name: "Montana",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 10, unit: "calendar", maxIfLeaseSpecifies: 30 },
    lateFeeGraceDays: 5,
  },
  NE: {
    code: "NE",
    name: "Nebraska",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 14, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  NV: {
    code: "NV",
    name: "Nevada",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 3,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  NH: {
    code: "NH",
    name: "New Hampshire",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: true, inStateBank: false, commingleAllowed: false },
    interestRate: { type: "local_savings" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  NJ: {
    code: "NJ",
    name: "New Jersey",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1.5,
    escrowRequirement: { separateAccount: true, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "local_savings" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  NM: {
    code: "NM",
    name: "New Mexico",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  NY: {
    code: "NY",
    name: "New York",
    appFeeRule: { type: "capped", max: 29.99, waivable: true },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: true, unitThreshold: 6, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "bank_minus_fee", fee: 1 },
    refundDeadline: { days: 14, unit: "calendar" },
    lateFeeGraceDays: 5,
    notes: "App fee waived if tenant provides a recent (30-day) background check.",
  },
  NC: {
    code: "NC",
    name: "North Carolina",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 2,
    escrowRequirement: { separateAccount: true, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar", maxIfLeaseSpecifies: 60 },
    lateFeeGraceDays: 5,
  },
  ND: {
    code: "ND",
    name: "North Dakota",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  OH: {
    code: "OH",
    name: "Ohio",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "fixed", value: 5 },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  OK: {
    code: "OK",
    name: "Oklahoma",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: true, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "none" },
    refundDeadline: { days: 45, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  OR: {
    code: "OR",
    name: "Oregon",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 31, unit: "calendar" },
    lateFeeGraceDays: 4,
  },
  PA: {
    code: "PA",
    name: "Pennsylvania",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 2,
    escrowRequirement: { separateAccount: true, unitThreshold: 3, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "local_savings" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  RI: {
    code: "RI",
    name: "Rhode Island",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 20, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  SC: {
    code: "SC",
    name: "South Carolina",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  SD: {
    code: "SD",
    name: "South Dakota",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: 1,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 14, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  TN: {
    code: "TN",
    name: "Tennessee",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: true, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  TX: {
    code: "TX",
    name: "Texas",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 1,
  },
  UT: {
    code: "UT",
    name: "Utah",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  VT: {
    code: "VT",
    name: "Vermont",
    appFeeRule: { type: "banned" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 14, unit: "calendar" },
    lateFeeGraceDays: 0,
    notes: "Vermont prohibits landlord-charged application fees outright.",
  },
  VA: {
    code: "VA",
    name: "Virginia",
    appFeeRule: { type: "cost_reimbursement", max: 50 },
    securityDepositCapMonths: 2,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 45, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  WA: {
    code: "WA",
    name: "Washington",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: true, inStateBank: true, commingleAllowed: false },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  WV: {
    code: "WV",
    name: "West Virginia",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 60, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  WI: {
    code: "WI",
    name: "Wisconsin",
    appFeeRule: { type: "capped", max: 25 },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 21, unit: "calendar" },
    lateFeeGraceDays: 5,
  },
  WY: {
    code: "WY",
    name: "Wyoming",
    appFeeRule: { type: "cost_reimbursement" },
    securityDepositCapMonths: Infinity,
    escrowRequirement: { separateAccount: false, inStateBank: false, commingleAllowed: true },
    interestRate: { type: "none" },
    refundDeadline: { days: 30, unit: "calendar", maxIfLeaseSpecifies: 60 },
    lateFeeGraceDays: 5,
  },
};

export const STATE_CODES = Object.keys(JURISDICTIONS) as StateCode[];

// Override dynamic rules to align with user requirement:
// NY: $29.99 per adult, all other states: $99.99 per adult.
for (const state of STATE_CODES) {
  if (state === "NY") {
    JURISDICTIONS[state].appFeeRule = { type: "capped", max: 29.99, waivable: true };
    JURISDICTIONS[state].notes = "Application fee is capped at $29.99 per adult. Waived with recent screening report.";
  } else {
    JURISDICTIONS[state].appFeeRule = { type: "capped", max: 99.99 };
    JURISDICTIONS[state].notes = "Application fee is $99.99 per adult.";
  }
}

export function describeAppFee(j: Jurisdiction): string {
  if (j.code === "NY") {
    return "Maximum $29.99 per adult (waived with recent screening report).";
  }
  return "Maximum $99.99 per adult.";
}

export function maxAppFee(j: Jurisdiction): number {
  return j.code === "NY" ? 29.99 : 99.99;
}

export function describeInterest(j: Jurisdiction): string {
  switch (j.interestRate.type) {
    case "none":
      return "No interest accrual required.";
    case "fixed":
      return `${j.interestRate.value}% simple interest (or bank rate).`;
    case "bank_minus_fee":
      return `Bank interest minus ${j.interestRate.fee}% landlord fee.`;
    case "local_savings":
      return `Local bank savings rate${
        j.interestRate.minLeaseMonths ? ` (${j.interestRate.minLeaseMonths}+ month lease)` : ""
      }.`;
    case "dynamic":
      return j.interestRate.label;
  }
}

export function effectiveAPR(j: Jurisdiction): number {
  switch (j.interestRate.type) {
    case "fixed":
      return j.interestRate.value / 100;
    case "bank_minus_fee":
      return Math.max(0, 4.5 - j.interestRate.fee) / 100; // assume 4.5% bank
    case "local_savings":
      return 4.0 / 100;
    case "dynamic":
      return 3.75 / 100;
    default:
      return 0;
  }
}
