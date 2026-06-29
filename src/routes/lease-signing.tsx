import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Download, FileSignature, BookOpen, CheckCircle2, XCircle, AlertTriangle, Loader2, ShieldCheck, Check, Copy, Info, User, Home, Briefcase, FileText, Sparkles, Receipt } from "lucide-react";
import { Button, Card, Field, Input, PageHeader, PageShell, Pill, Select, Textarea } from "@/components/shared/Primitives";
import { downloadHandbook, downloadLease, getLeaseSections } from "@/lib/pdf";
import { useAppStore } from "@/lib/store";
import { StepHeader, StepPanel } from "@/components/shared/StepWizard";
import { JURISDICTIONS, STATE_CODES, type StateCode } from "@/lib/compliance";
import { Banner } from "@/components/compliance/Banner";
import { ProofUpload } from "@/components/shared/ProofUpload";
import { VerificationWaitingPanel } from "@/components/shared/EscrowFlowAnimation";

export const Route = createFileRoute("/lease-signing")({
  head: () => ({
    meta: [
      { title: "Your Lease Agreement — HOA Rent Services" },
      { name: "description", content: "Draft your lease agreement together and keep your records in one safe place." },
    ],
  }),
  component: LeasePage,
});

const BUILDER_STEPS = ["Lease Details", "Review & Consent", "Complete Fee", "Receipt & Documents"];
interface SignedLease {
  id: string;
  tenant: string;
  unit: string;
  start: string;
  end: string;
  rent: number;
  pets: string;
  signedAt: string;
  agreementDate?: string;
  landlordName?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  storageSpaces?: string;
  furnishedStatus?: string;
  termTotalRent?: number;
  rentDueDay?: string;
  paymentMethod?: string;
  securityDeposit?: number;
  landlordNoticeAddress?: string;
  landlordNoticeEmail?: string;
  tenantNoticeAddress?: string;
  tenantNoticeEmail?: string;
  governingState?: string;
  disputeCounty?: string;
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-amber-100/90 text-amber-900 border-b border-amber-300 font-sans px-1.5 py-0.5 rounded mx-0.5 inline-block text-[11px] font-semibold transition hover:bg-amber-200">
      {children}
    </span>
  );
}

function LeasePage() {
  const activeState = useAppStore((s) => s.activeState);
  const setActiveState = useAppStore((s) => s.setActiveState);
  const logPayment = useAppStore((s) => s.logPayment);
  const pageSettings = useAppStore((s) => s.pageSettings);
  const payments = useAppStore((s) => s.payments);
  const j = JURISDICTIONS[activeState];

  const [tenant, setTenant] = useState("");
  const [unit, setUnit] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [rent, setRent] = useState(0);
  const [pets, setPets] = useState("No pets allowed");
  
  // Advanced contract parameters matching current jurisdiction
  const [agreementDate, setAgreementDate] = useState("May 21, 2026");
  const [landlordName, setLandlordName] = useState(pageSettings.leaseLandlordName);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [parkingSpaces, setParkingSpaces] = useState(1);
  const [storageSpaces, setStorageSpaces] = useState("S-102");
  const [furnishedStatus, setFurnishedStatus] = useState(pageSettings.leaseFurnishedStatus);
  const [termTotalRent, setTermTotalRent] = useState(3900);
  const [rentDueDay, setRentDueDay] = useState("3rd");
  const [paymentMethod, setPaymentMethod] = useState("Venmo");
  const [securityDeposit, setSecurityDeposit] = useState(500);
  const [landlordNoticeAddress, setLandlordNoticeAddress] = useState(pageSettings.leaseLandlordAddress);
  const [landlordNoticeEmail, setLandlordNoticeEmail] = useState(pageSettings.leaseLandlordEmail);
  const [tenantNoticeAddress, setTenantNoticeAddress] = useState("174 Schools Dr, Camden, TN");
  const [tenantNoticeEmail, setTenantNoticeEmail] = useState("lucas.nix06@icloud.com");
  const [governingState, setGoverningState] = useState(j.name);
  const [disputeCounty, setDisputeCounty] = useState("Camden");

  useEffect(() => {
    setLandlordName(pageSettings.leaseLandlordName);
    setFurnishedStatus(pageSettings.leaseFurnishedStatus);
    setLandlordNoticeAddress(pageSettings.leaseLandlordAddress);
    setLandlordNoticeEmail(pageSettings.leaseLandlordEmail);
  }, [pageSettings]);

  const [signedLeases, setSignedLeases] = useState<SignedLease[]>([]);
  const [builderStep, setBuilderStep] = useState(0);

  // wizard step 2 payment options
  const [payGateway, setPayGateway] = useState<"venmo" | "cashapp" | "chime">("venmo");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "waiting" | "confirmed">("idle");
  const [verificationLogs, setVerificationLogs] = useState<string[]>([]);
  const [paymentProofFile, setPaymentProofFile] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [typedSignature, setTypedSignature] = useState("");
  const [copied, setCopied] = useState(false);
  const [processor, setProcessor] = useState("");
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);

  const pendingPayment = pendingPaymentId ? payments.find((p) => p.id === pendingPaymentId) : null;
  useEffect(() => {
    if (pendingPayment && (pendingPayment.status === "completed" || pendingPayment.status === "held")) {
      if (paymentStatus !== "confirmed") {
        setPaymentStatus("confirmed");
        setVerificationLogs((prev) => [
          ...prev,
          "Payment verified & accepted by Administrator!",
          "Security deposit and first month's rent successfully funded.",
          "Generating your Lease Agreement PDF...",
        ]);
        const formattedProcessor = payGateway
          ? `${payGateway.charAt(0).toUpperCase() + payGateway.slice(1)} (Admin Confirmed)`
          : "Admin Confirmed Receipt";
        setProcessor(formattedProcessor);
        // Auto-download lease agreement after payment confirmation
        setTimeout(() => {
          downloadLease(currentLeaseOpts);
        }, 1500);
      }
    } else if (pendingPayment && pendingPayment.status === "failed") {
      if (paymentStatus !== "idle") {
        setPaymentStatus("idle");
        setVerificationLogs([]);
        setPendingPaymentId(null);
        alert("Payment proof was rejected by the administrator. Please re-submit your receipt.");
      }
    }
  }, [pendingPayment, payGateway, paymentStatus]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const startPaymentVerification = (fileName: string) => {
    setPaymentProofFile(fileName);
    setPaymentStatus("waiting");
    setVerificationLogs(["Initializing secure digital escrow verification..."]);
    
    setTimeout(() => {
      setVerificationLogs(prev => [...prev, "Uploading proof screenshot..."]);
    }, 1000);
    
    setTimeout(() => {
      setVerificationLogs(prev => [...prev, "Analyzing transaction image (OCR verification)..."]);
    }, 2000);
    
    setTimeout(() => {
      setVerificationLogs(prev => [...prev, "Matching transaction reference code on the ledger..."]);
    }, 3500);

    setTimeout(() => {
      setVerificationLogs(prev => [...prev, "Submitting details to HOA Admin Panel for validation..."]);
    }, 4500);

    setTimeout(() => {
      setVerificationLogs(prev => [...prev, "Submitted! Status: PENDING ADMIN APPROVAL.", "The Administrator is reviewing your payment proof in the admin panel."]);
      const logged = logPayment({ 
        amount: (securityDeposit + (rent || 0)) || 1000, 
        classification: "security_deposit", 
        status: "pending", 
        processor: (payGateway ? payGateway.toUpperCase() : "Uploaded_Screenshot") as any, 
        state: activeState,
        tenantName: tenant || "Avery Tenant",
        unitAddress: unit || "US Hub",
        proofImage: fileName
      });
      setPendingPaymentId(logged.id);
    }, 6000);
  };

  // Calculate difference in months and auto-calculate term total rent
  const calculateTermTotal = (startStr: string, endStr: string, monthlyRent: number) => {
    if (!startStr || !endStr || !monthlyRent) return monthlyRent * 6; // default to 6 months
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return monthlyRent * 6;
    
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    const dayDiff = endDate.getDate() - startDate.getDate();
    if (dayDiff > 0) {
      months += dayDiff / 30;
    }
    return Math.max(0, Math.round(months * monthlyRent));
  };

  // Synchronize when the activeState in the sidebar or app changes
  useEffect(() => {
    setGoverningState(j.name);
    // Update default security deposit based on rent
    if (securityDeposit === 0) {
      setSecurityDeposit(rent);
    }
  }, [activeState, j]);

  // Recalculate term total rent when start, end, or monthly rent changes
  useEffect(() => {
    const calculated = calculateTermTotal(start, end, rent);
    setTermTotalRent(calculated);
  }, [start, end, rent]);


  const sign = () => {
    if (!isFormComplete) return;
    const lease: SignedLease = {
      id: crypto.randomUUID().slice(0, 8),
      tenant,
      unit,
      start,
      end,
      rent,
      pets,
      signedAt: new Date().toISOString(),
      agreementDate,
      landlordName,
      bedrooms,
      bathrooms,
      parkingSpaces,
      storageSpaces,
      furnishedStatus,
      termTotalRent,
      rentDueDay,
      paymentMethod,
      securityDeposit,
      landlordNoticeAddress,
      landlordNoticeEmail,
      tenantNoticeAddress,
      tenantNoticeEmail,
      governingState,
      disputeCounty
    };
    setSignedLeases((s) => [lease, ...s]);
  };

  const currentLeaseOpts = {
    agreementDate,
    landlordName,
    tenantName: tenant,
    bedrooms,
    bathrooms,
    parkingSpaces,
    unitAddress: unit,
    storageSpaces,
    furnishedStatus,
    startDate: start,
    endDate: end,
    termTotalRent,
    monthlyRent: rent,
    rentDueDay,
    paymentMethod,
    securityDeposit,
    landlordNoticeAddress,
    landlordNoticeEmail,
    tenantNoticeAddress,
    tenantNoticeEmail,
    governingState,
    disputeCounty,
    petPolicy: pets
  };

  const isDepositOverCap = isFinite(j.securityDepositCapMonths) && securityDeposit > rent * j.securityDepositCapMonths;
  const refundDays = j ? j.refundDeadline.days : 15;
  const refundUnit = j ? j.refundDeadline.unit : "calendar";
  const refundDaysWord = refundDays === 14 ? "fourteen (14)" : refundDays === 21 ? "twenty-one (21)" : refundDays === 30 ? "thirty (30)" : refundDays === 45 ? "forty-five (45)" : `${refundDays}`;

  // Form completion checklist items
  const checks = [
    { label: "Tenant Name", met: tenant.trim() !== "" },
    { label: "Landlord Name", met: landlordName.trim() !== "" },
    { label: "Agreement Date", met: agreementDate.trim() !== "" },
    { label: "Unit Address", met: unit.trim() !== "" },
    { label: "Dates (Start & End)", met: start.trim() !== "" && end.trim() !== "" },
    { label: "Bedrooms & Bathrooms", met: bedrooms > 0 && bathrooms > 0 },
    { label: "Monthly Rent", met: rent > 0 },
    { label: "Security Deposit", met: securityDeposit >= 0 },

  ];
  const isFormComplete = checks.every((c) => c.met);

  const highlightSections: { title: string; content: React.ReactNode }[] = [
    {
      title: "",
      content: (
        <span>
          This Lease Agreement (this "Agreement") is made this{" "}
          <Highlight>{agreementDate || "________"}</Highlight>, by and among{" "}
          <Highlight>{landlordName || "________"}</Highlight> ("Landlord") and{" "}
          <Highlight>{tenant || "________"}</Highlight> ("Tenant"). Each Tenant
          is jointly and severally liable to Landlord for full payment of rent and
          performance in accordance with all other terms of this Agreement. Each
          Landlord and Tenant may be referred to individually as a "Party" and
          collectively as the "Parties."
        </span>
      )
    },
    {
      title: "Premises",
      content: (
        <span>
          The premises leased is an apartment with{" "}
          <Highlight>{bedrooms}</Highlight> bedroom(s) and{" "}
          <Highlight>{bathrooms}</Highlight> bathroom(s) and{" "}
          <Highlight>{parkingSpaces}</Highlight> parking space(s) located at{" "}
          <Highlight>{unit || "________"}</Highlight> (the "Premises"). The
          entire property wherein the Premises is located shall be referred to as
          the "Project", inclusive of other residential units, parking areas and
          common areas.
        </span>
      )
    },
    {
      title: "Agreement to Lease",
      content: (
        <span>
          Landlord agrees to lease to Tenant and Tenant agrees to lease from
          Landlord, according to the terms and conditions set forth herein, the
          Premises.
        </span>
      )
    },
    {
      title: "Term",
      content: (
        <span>
          This Agreement will be for a term beginning on{" "}
          <Highlight>{start || "________"}</Highlight> and ending on{" "}
          <Highlight>{end || "________"}</Highlight> (the "Term").
        </span>
      )
    },
    {
      title: "Rent",
      content: (
        <span>
          Tenant will pay Landlord a monthly rent of{" "}
          <Highlight>${rent.toFixed(2)}</Highlight>{" "}
          ("Rent"). Rent will be payable in advance and due on the
          1st day of each month during the Term.
          Rent for any period during the Term which is for less than one month
          will be a pro rata portion of the monthly installment. Rent will be
          paid to Landlord at Landlord's address provided herein (or to such
          other places as directed by Landlord) by mail or in person by one of
          the following methods: <Highlight>{paymentMethod}</Highlight>, and
          will be payable in U.S. Dollars.
        </span>
      )
    },
    {
      title: "Initial Payments",
      content: (
        <span>
          Upon execution of this Agreement by Tenant and as a condition of
          consideration for acceptance by Landlord, Tenant shall pay to Landlord
          the following:
          <br />
          I. The first rent payment.
          <br />
          II. The last month Rent.
          <br />
          III. The Security Deposit. (See Section 7)
        </span>
      )
    },
    {
      title: "Additional Rent",
      content: (
        <span>
          There may be instances under this Agreement where Tenant may be
          required to pay additional charges to Landlord. All such charges are
          considered additional rent under this Agreement and will be paid with
          the next regularly scheduled rent payment. Landlord has the same
          rights and Tenant has the same obligations with respect to additional
          rent as they do with rent.
        </span>
      )
    },
    {
      title: "Utilities",
      content: (
        <span>
          Tenant is responsible for payment of all utility and other services
          for the Premises, with the exception of electric, gas, trash, heat,
          which will be paid for or provided by Landlord.
        </span>
      )
    },
    {
      title: "Security Deposit",
      content: (
        <span>
          Upon signing this Agreement, Tenant will pay a security deposit in the
          amount of <Highlight>${securityDeposit.toFixed(2)}</Highlight> to
          Landlord. The security deposit will be retained by Landlord as
          security for Tenant’s performance of its obligations under this
          Agreement. The security deposit may not be used or deducted by Tenant
          as the last month’s rent of the Term. Tenant will be entitled to a
          full refund of the security deposit if Tenant returns possession of
          the Premises to Landlord in the same condition as accepted, ordinary
          wear and tear excepted. Within{" "}
          <Highlight>
            {refundDaysWord} {refundUnit}
          </Highlight>{" "}
          days after the termination of this Agreement, Landlord will return the
          security deposit to Tenant (minus any amount applied by Landlord in
          accordance with this section). Any reason for retaining a portion of the
          security deposit will be explained in writing. The security deposit will
          not bear interest while held by Landlord in accordance with applicable
          state laws and/or local ordinances.
        </span>
      )
    },
    {
      title: "Landlord's Failure to Give Possession",
      content: (
        <span>
          In the event Landlord is unable to give possession of the Premises to
          Tenant on the start date of the Term, Landlord will not be subject to
          any liability for such failure, the validity of this Agreement will
          not be affected, and the Term will not be extended. Tenant will not be
          liable for rent until Landlord gives possession of the Premises to
          Tenant. Notwithstanding anything to the contrary, if Landlord does not
          deliver possession of the Premises within 3 days of the Start Date,
          Tenant may cancel this Agreement upon notice to Landlord and Landlord
          shall, within 7 business days, return all monies paid by Tenant to
          Landlord.
        </span>
      )
    },
    {
      title: "Holdover Tenancy",
      content: (
        <span>
          Unless this Agreement has been extended by mutual written agreement of
          the Parties, there will be no holding over past the Term under the
          terms of this Agreement under any circumstances. If it becomes
          necessary to commence legal action to remove Tenant from the Premises,
          the prevailing Party will be entitled to attorney's fees and costs in
          addition to damages.
        </span>
      )
    },
    {
      title: "Use of Premises",
      content: (
        <span>
          The Premises will be occupied only by Tenant and Tenant’s immediate
          family and used only for residential purposes.{" "}
          Tenant will not keep any pets on the Premises without prior written
          consent of Landlord.{" "}
          Tenant will not engage in any objectionable conduct, including behavior
          which will make the Premises less fit to live in, will cause dangerous,
          hazardous or unsanitary conditions or will interfere with the rights
          of others to enjoy their property. Tenant will be liable for any damage
          occurring to the Premises and any damage to or loss of the contents
          thereof which is done by Tenant or Tenant’s guests or invitees.
        </span>
      )
    },
    {
      title: "Condition of the Premises",
      content: (
        <span>
          Tenant has examined the Premises, including the appliances, fixtures
          and furnishings, and acknowledges that they are in good condition and
          repair, normal wear and tear excepted, and accepts them in its current
          condition.
        </span>
      )
    },
    {
      title: "Maintenance and Repairs",
      content: (
        <span>
          Tenant will maintain the Premises, including the grounds and all
          appliances, fixtures and furnishings, in clean, sanitary and good
          condition and repair. Tenant will not remove Landlord’s appliances,
          fixtures, or furnishings from the Premises for any purpose. If repairs
          other than general maintenance are required, Tenant will notify Landlord
          for such repairs. In the event of default by Tenant, Tenant will
          reimburse Landlord for the cost of any repairs or replacement.
        </span>
      )
    },
    {
      title: "Military Clause",
      content: (
        <span>
          In the event Tenant is, or hereafter becomes, a member of the United
          States Armed Forces (the “Military”) on extended active duty, and
          Tenant receives permanent change of station orders to depart from the
          area where the Premises is located or is relieved from active duty,
          retires or separates from the Military, or is ordered into Military
          housing, then Tenant may terminate this Agreement upon giving thirty
          (30) days written notice to Landlord. Tenant shall also provide to
          Landlord a copy of the official orders or a letter signed by Tenant’s
          commanding officer, reflecting the change which warrants termination
          under this Section. Tenant will pay prorated rent for any days Tenant
          occupies the dwelling past the first day of the month rent is due. Any
          security deposit will be promptly returned to Tenant, provided there are
          no damages to the Premises.
        </span>
      )
    },
    {
      title: "Reasonable Accommodations",
      content: (
        <span>
          Landlord agrees to comply with all applicable laws providing equal
          housing opportunities, including making reasonable accommodations for
          known physical or mental limitations of qualified individuals with a
          disability, unless undue hardship would result. Tenant is responsible
          for making Landlord aware of any such required accommodations that are
          reasonable and will not impose an undue hardship. If Tenant discloses
          a disability and requests an accommodation, Landlord has the right to
          have a qualified healthcare provider verify the disability if the
          disability is not readily apparent, and Landlord has the right to use the
          qualified healthcare provider verifying the disability as a resource
          for providing the reasonable accommodation.
        </span>
      )
    },
    {
      title: "Sex Offender Registry",
      content: (
        <span>
          Pursuant to law, information about specified registered sex offenders
          is made available to the public. Tenant understands and agrees that
          Tenant is solely responsible for obtaining any and all information
          contained in the state or national sex offender registry for the area
          surrounding the Premises, which can be obtained online or from the
          local sheriff’s department or other appropriate law enforcement
          officials. Depending on an offender’s criminal history, this
          information will include either the address at which the offender
          resides or the community of residence and zip code in which he or she
          resides.
        </span>
      )
    },
    {
      title: "Compliance",
      content: (
        <span>
          Tenant agrees to comply with all applicable laws, ordinances,
          requirements and regulations of any federal, state, county, municipal
          or other authority.
        </span>
      )
    },
    {
      title: "Mechanics’ Lien",
      content: (
        <span>
          Tenant understands and agrees that Tenant and anyone acting on
          Tenant’s behalf does not have the right to file for mechanic’s liens
          or any other kind of liens on the Premises. Tenant agrees to give
          actual advance notice to any contractors, subcontractors or suppliers
          of goods, labor or services that such liens are invalid. Tenant
          further agrees to take the additional steps necessary to keep the
          Premises free of any and all liens that may result from construction
          completed by or for Tenant.
        </span>
      )
    },
    {
      title: "Subordination",
      content: (
        <span>
          With respect to the Premises, this Agreement is subordinate to any
          mortgage that now exists, or may be given later by Landlord.
        </span>
      )
    },
    {
      title: "Alterations",
      content: (
        <span>
          Tenant will not make any alteration, addition or improvement to the
          Premises without first obtaining Landlord’s written consent. Any and
          all alterations, additions or improvements to the Premises are
          without payment to Tenant and will become Landlord’s property
          immediately on completion and remain on the Premises, unless Landlord
          requests or permits removal, in which case Tenant will return that part
          of the Premises to the same condition as existed prior to the
          alteration, addition or improvement. Tenant will not change any
          existing locks or install any additional locks on the Premises without
          first obtaining Landlord's written consent and without providing
          Landlord a copy of all keys.
        </span>
      )
    },
    {
      title: "Smoking",
      content: (
        <span>
          Smoking of any kind is strictly prohibited on any part of the
          Premises. This prohibition applies to Tenant and any visitors, guests
          or other occupants on the Premises.
        </span>
      )
    },

    {
      title: "Fire and Casualty",
      content: (
        <span>
          If the Premises are damaged by fire or other serious disaster or
          accident and the Premises becomes uninhabitable as a result, Tenant
          may immediately vacate the Premises and terminate this Agreement upon
          notice to Landlord. Tenant will be responsible for any unpaid rent or
          will receive any prepaid rent up to the day of such fire, disaster or
          accident. If the Premises are only partially damaged and inhabitable,
          Landlord may make full repairs and will do so within a prompt and
          reasonable amount of time. At the discretion of Landlord, the rent
          may be reduced while the repairs are being made.
        </span>
      )
    },
    {
      title: "Liability",
      content: (
        <span>
          Landlord is not responsible or liable for any loss, claim, damage or
          expense as a result of any accident, injury or damage to any person
          or property occurring anywhere on the Premises, unless resulting from
          the negligence or willful misconduct of Landlord.
        </span>
      )
    },
    {
      title: "Assignment and Subletting",
      content: (
        <span>
          Tenant will not assign this Agreement as to any portion or all of the
          Premises or make or permit any total or partial sublease or other
          transfer of any portion or all of the Premises.
        </span>
      )
    },
    {
      title: "Insurance Requirements",
      content: (
        <span>
          Tenant will not do or permit to be done any act or thing that will
          increase the insurance risk under any policy of insurance covering the
          Premises. If the premium for such policy of insurance increases due to
          a breach of Tenant’s obligations under this Agreement, Tenant will
          pay the additional amount of premium as additional rent under this
          Agreement.
        </span>
      )
    },
    {
      title: "Right of Entry",
      content: (
        <span>
          Landlord or its agents may enter the Premises at reasonable times to
          inspect the Premises, to make any alterations, improvements or repairs
          or to show the Premises to a prospective tenant, buyer or lender. In
          the event of an emergency, Landlord may enter the Premises at any
          time.
        </span>
      )
    },
    {
      title: "Surrender",
      content: (
        <span>
          Tenant will deliver and surrender to Landlord possession of the
          Premises immediately upon the expiration of the Term or the
          termination of this Agreement, clean and in as good condition and
          repair as the Premises was at the commencement of the Term, reasonable
          wear and tear excepted.
        </span>
      )
    },
    {
      title: "Default",
      content: (
        <span>
          In the event of any default under this Agreement, Landlord may provide
          Tenant a notice of default and an opportunity to correct such default.
          If Tenant fails to correct the default, other than a failure to pay
          rent or additional rent, Landlord may terminate this Agreement by giving
          a seven (7) day written notice. If the default is Tenant’s failure to
          timely pay rent or additional rent as specified in this Agreement,
          Landlord may terminate this Agreement by giving a seven (7) day written
          notice to Tenant. After termination of this Agreement, Tenant remains
          liable for any rent, additional late, costs, including costs to remedy
          any defaults, and damages under this Agreement.
        </span>
      )
    },
    {
      title: "Remedies",
      content: (
        <span>
          If this Agreement is terminated due to Tenant’s default, Landlord may,
          in addition to any rights and remedies available under this Agreement
          and applicable law, use any dispossession, eviction or other similar legal proceeding available in law or equity.
        </span>
      )
    },
    {
      title: "Subordination",
      content: (
        <span>
          This Agreement and Tenant’s right under it shall be subject and
          subordinate to the lien, operation and effect of each existing or
          future mortgage, deed of trust, ground lease and/or any other similar
          instrument of encumbrance covering any or all of the Premises, if any,
          and each renewal, modification, consolidation, replacement or
          extension thereof.
        </span>
      )
    },
    {
      title: "Condemnation",
      content: (
        <span>
          If all or substantially all of the Premises are covered by a
          condemnation including the exercise of any power of eminent domain by
          a governmental authority, this Agreement shall terminate on the date
          possession of the Premises is taken by the condemning authority, and
          all rent under this Agreement shall be prorated and paid to such date.
          Landlord is entitled to collect from the condemning authority the
          entire amount of any award made in any proceeding. Tenant waives any
          right, title or interest which Tenant may have to any such award and
          agrees to not make any claim for the Term of this Agreement.
        </span>
      )
    },
    {
      title: "Hazardous Materials",
      content: (
        <span>
          Tenant shall not keep on the Premises any item of a dangerous,
          flammable, or explosive character that might unreasonably increase the
          danger of fire or explosion on the Premises or that might be considered
          hazardous or extra hazardous by any responsible insurance company.
        </span>
      )
    },
    {
      title: "Notices",
      content: (
        <span>
          All notices given under this Agreement must be in writing. A notice is
          effective upon receipt and shall be delivered in person, sent via
          certified or registered mail to the following addresses (or to another
          address that either Party may designate upon reasonable notice to the
          other Party):
          <br />
          <br />
          Notices shall be sent to the Landlord at the following address:
          <br />
          <Highlight>{landlordNoticeAddress || "________"}</Highlight>
          <br />
          Email: <Highlight>{landlordNoticeEmail || "________"}</Highlight>
          <br />
          <br />
          Notices shall be sent to the Tenant at the following address:
          <br />
          <Highlight>{tenantNoticeAddress || "________"}</Highlight>
          <br />
          Email: <Highlight>{tenantNoticeEmail || "________"}</Highlight>
        </span>
      )
    },
    {
      title: "Quiet Enjoyment",
      content: (
        <span>
          If Tenant pays the rent and performs all other obligations under this
          Agreement, Tenant may peaceably and quietly hold and enjoy the Premises
          during the Term.
        </span>
      )
    },
    {
      title: "No Waiver",
      content: (
        <span>
          No Party shall be deemed to have waived any provision of this Agreement
          or the exercise of any rights held under this Agreement unless such
          waiver is made expressly and in writing.
        </span>
      )
    },
    {
      title: "Severability",
      content: (
        <span>
          If any provision of this Agreement is held to be invalid, illegal or
          unenforceable in whole or in part, the remaining provisions shall not be
          affected and shall continue to be valid, legal and enforceable as
          though the invalid, illegal or unenforceable part had not been included
          in this Agreement.
        </span>
      )
    },
    {
      title: "Successors and Assigns",
      content: (
        <span>
          This Agreement will inure to the benefit of and be binding upon the
          Parties and their permitted successors and assigns.
        </span>
      )
    },
    {
      title: "Governing Law",
      content: (
        <span>
          The terms of this Agreement and the rights and obligations of the
          Parties hereto shall be governed by and construed in accordance with the
          laws of the State of <Highlight>{governingState || "________"}</Highlight>,
          without regard to its conflicts of laws provisions.
        </span>
      )
    },
    {
      title: "Disputes",
      content: (
        <span>
          Any dispute arising from this Agreement shall be resolved in the courts
          of the County of <Highlight>{disputeCounty || "________"}</Highlight>, State
          of <Highlight>{governingState || "________"}</Highlight> in accordance with the
          laws of the State of <Highlight>{governingState || "________"}</Highlight>.
        </span>
      )
    },
    {
      title: "Attorneys' Fees",
      content: (
        <span>
          If either Party brings legal action to enforce its rights under this
          Agreement, the prevailing party will be entitled to recover from the
          other Party its expenses (including reasonable attorneys' fees and
          costs) incurred in connection with the action and any appeal.
        </span>
      )
    },
    {
      title: "Amendments",
      content: (
        <span>
          This Agreement may be amended or modified only by a written agreement
          signed by the Parties.
        </span>
      )
    },
    {
      title: "Counterparts",
      content: (
        <span>
          This Agreement may be executed in one or more counterparts, each of
          which shall be deemed to be an original, and all of which together shall
          constitute one and the same document.
        </span>
      )
    },
    {
      title: "Headings",
      content: (
        <span>
          The section headings herein are for reference purposes only and shall
          not otherwise affect the meaning, construction or interpretation of any
          provision in this Agreement.
        </span>
      )
    },
    {
      title: "Entire Agreement",
      content: (
        <span>
          This Agreement constitutes the entire agreement between the Parties and
          supersedes and cancels all prior agreements of the Parties, whether
          written or oral, with respect to the subject matter.
        </span>
      )
    }
  ];

  return (
    <PageShell>
      <PageHeader 
        title="Your Lease Agreement" 
        subtitle="Draft your lease agreement and keep your files in one secure place." 
        icon={<FileSignature className="h-5 w-5" />} 
        right={
          <Select className="w-24" value={activeState} onChange={(e) => setActiveState(e.target.value as StateCode)}>
            {STATE_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        }
      />

      <div className="mb-6">
        {isDepositOverCap ? (
          <Banner tone="warn" title="Security deposit exceeds state cap">
            {j.name} caps security deposits at {j.securityDepositCapMonths} month(s) of rent (${(rent * j.securityDepositCapMonths).toFixed(2)}). Reduce the security deposit to remain compliant.
          </Banner>
        ) : (
          <Banner tone="info" title={`${j.name} lease rules`}>
            Security deposit cap: {isFinite(j.securityDepositCapMonths) ? `${j.securityDepositCapMonths} month(s) of rent` : "uncapped"}.{" "}
            Refund deadline: {j.refundDeadline.days} {j.refundDeadline.unit} days after tenancy termination.
          </Banner>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <div className="border-b border-slate-100 p-5">
            <StepHeader steps={BUILDER_STEPS} current={builderStep} />
          </div>
          
          <div className="p-5">
            <StepPanel keyId={builderStep}>
                  {builderStep === 0 && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-3">
                      <Info className="h-4 w-4 text-indigo-600 shrink-0" />
                      <h3 className="font-display text-sm font-semibold tracking-wider text-slate-800">Basic Information</h3>
                    </div>
                    <div className="grid gap-4 p-1 sm:grid-cols-2">
                      <Field label="Tenant name"><Input id="ls-tenant" value={tenant} onChange={(e) => setTenant(e.target.value)} placeholder="e.g. Avery Tenant" /></Field>
                      <Field label="Landlord name"><Input id="ls-landlord" value={landlordName} onChange={(e) => setLandlordName(e.target.value)} placeholder="e.g. Morgan Landlord" /></Field>
                      <Field label="Agreement date"><Input id="ls-agdate" type="date" value={agreementDate} onChange={(e) => setAgreementDate(e.target.value)} /></Field>
                      <Field label="Unit / Address"><Input id="ls-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. Unit 1, 100 Main St, City" /></Field>
                      <Field label="Start date"><Input id="ls-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
                      <Field label="End date"><Input id="ls-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
                    </div>
                  </div>

                  {/* Premises Details */}
                  <div className="border-t border-slate-100 pt-5">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-3">
                      <Home className="h-4 w-4 text-indigo-600 shrink-0" />
                      <h3 className="font-display text-sm font-semibold tracking-wider text-slate-800">Premises Details</h3>
                    </div>
                    <div className="grid gap-4 p-1 sm:grid-cols-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Field label="Bedrooms"><Input id="ls-bed" type="number" value={bedrooms || ""} onChange={(e) => setBedrooms(Number(e.target.value))} placeholder="e.g. 1" /></Field>
                        <Field label="Bathrooms"><Input id="ls-bath" type="number" value={bathrooms || ""} onChange={(e) => setBathrooms(Number(e.target.value))} placeholder="e.g. 1" /></Field>
                        <Field label="Parking"><Input type="number" value={parkingSpaces || ""} onChange={(e) => setParkingSpaces(Number(e.target.value))} placeholder="e.g. 0" /></Field>
                      </div>

                    </div>
                  </div>

                  {/* Financial & Payment Terms */}
                  <div className="border-t border-slate-100 pt-5">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 mb-3">
                      <Briefcase className="h-4 w-4 text-indigo-600 shrink-0" />
                      <h3 className="font-display text-sm font-semibold tracking-wider text-slate-800">Financial & Payment Terms</h3>
                    </div>
                    <div className="grid gap-4 p-1 sm:grid-cols-2">
                      <Field label="Monthly rent"><Input id="ls-rent" type="number" value={rent || ""} onChange={(e) => setRent(Number(e.target.value))} placeholder="e.g. 1500" /></Field>

                      <Field label="Security deposit"><Input type="number" value={securityDeposit || ""} onChange={(e) => setSecurityDeposit(Number(e.target.value))} placeholder="e.g. 1500" /></Field>

                      <Field label="Payment method">
                        <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                          <option value="Direct Deposit">Direct Deposit</option>
                          <option value="Chime">Chime</option>
                          <option value="Cash App">Cash App</option>
                          <option value="Venmo">Venmo</option>
                        </Select>
                      </Field>
                    </div>
                  </div>

                  {/* Checklist warning and navigation */}
                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
                    {!isFormComplete && (
                      <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>Let's fill in all the details above to enable review and proceed to signing.</span>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button onClick={() => {
                        if (!isFormComplete) {
                          const fieldMap = [
                            { check: tenant.trim() !== '', id: 'ls-tenant' },
                            { check: landlordName.trim() !== '', id: 'ls-landlord' },
                            { check: agreementDate.trim() !== '', id: 'ls-agdate' },
                            { check: unit.trim() !== '', id: 'ls-unit' },
                            { check: start.trim() !== '', id: 'ls-start' },
                            { check: end.trim() !== '', id: 'ls-end' },
                            { check: bedrooms > 0, id: 'ls-bed' },
                            { check: bathrooms > 0, id: 'ls-bath' },
                            { check: rent > 0, id: 'ls-rent' },

                          ];
                          const missing = fieldMap.find(f => !f.check);
                          if (missing) {
                            const el = document.getElementById(missing.id);
                            if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
                          }
                          return;
                        }
                        setBuilderStep(1);
                      }}>Continue</Button>
                    </div>
                  </div>
                </div>
              )}

              {builderStep === 1 && (
                <div className="space-y-5">
                  {/* Form Compliance Audit Banner */}
                  {isDepositOverCap ? (
                    <Banner tone="warn" title="Security deposit exceeds state cap">
                      {j.name} caps security deposits at {j.securityDepositCapMonths} month(s) of rent (${(rent * j.securityDepositCapMonths).toFixed(2)}). Reduce the security deposit to remain compliant.
                    </Banner>
                  ) : (
                    <Banner tone="info" title={`${j.name} lease rules`}>
                      Security deposit cap: {isFinite(j.securityDepositCapMonths) ? `${j.securityDepositCapMonths} month(s) of rent` : "uncapped"}.{" "}
                      Refund deadline: {j.refundDeadline.days} {j.refundDeadline.unit} days after tenancy termination.
                    </Banner>
                  )}

                  {/* Checklist Summary */}
                  <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-3">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lease Details Checklist</span>
                    <div className="grid gap-3 grid-cols-2 text-xs">
                      {checks.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-600">
                          {c.met ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="h-4.5 w-4.5 text-slate-300 shrink-0" />
                          )}
                          <span className={c.met ? "text-slate-800 font-medium" : "text-slate-400"}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Itemized Invoice details */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-700">Itemized Deposit Invoice</div>
                      <Pill tone="indigo">{activeState}</Pill>
                    </div>
                    <div className="mt-3 divide-y divide-slate-200 text-sm">
                      <div className="flex justify-between py-2">
                        <span>Refundable security deposit</span>
                        <span>${securityDeposit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>First month rent</span>
                        <span>${rent.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 font-semibold text-slate-900">
                        <span>Total due at signing</span>
                        <span>${(securityDeposit + rent).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Electronic Signature Consent */}
                  <div className="rounded-xl border border-slate-200 p-5 space-y-4 bg-white">
                    <div className="text-sm font-semibold text-slate-800">Electronic Signature Consent</div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Under the Electronic Signatures in Global and National Commerce Act (ESIGN), you electronically agree to sign this Residential Lease Agreement for Unit {unit}. This signature will hold full legal validity.
                    </p>
                    
                    <div className="grid gap-4 sm:grid-cols-2 pt-2">
                      <Field label="Type tenant full name to sign"><Input id="ls-sig" value={typedSignature} onChange={(e) => setTypedSignature(e.target.value)} placeholder="e.g. Avery Tenant" /></Field>
                      <label className="flex items-start gap-3 mt-6">
                        <input id="ls-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                        <span className="text-xs text-slate-700 font-medium">I agree to the terms of this lease agreement and electronically sign this document.</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="ghost" onClick={() => setBuilderStep(0)}>Back</Button>
                    <Button onClick={() => {
                      if (!typedSignature.trim()) {
                        const el = document.getElementById('ls-sig');
                        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
                        return;
                      }
                      if (!consent) {
                        const el = document.querySelector('#ls-consent') as HTMLElement;
                        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
                        return;
                      }
                      sign(); setBuilderStep(2);
                    }}>Sign & continue</Button>
                  </div>
                </div>
              )}

              {builderStep === 2 && (
                <div className="space-y-5">
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes scan {
                      0%, 100% { top: 0%; }
                      50% { top: 100%; }
                    }
                    .scanner-line {
                      height: 2px;
                      background: linear-gradient(90deg, transparent, #22c55e, transparent);
                      position: absolute;
                      width: 100%;
                      animation: scan 2.5s infinite linear;
                    }
                  `}} />
                  
                  {securityDeposit + rent === 0 ? (
                    <Banner tone="ok" title="No deposit required">
                      No security deposit or rent is due at this time. You may proceed directly to document retrieval.
                    </Banner>
                  ) : (
                    <>
                      {paymentStatus === "idle" && (
                        <div className="space-y-5">
                          <div className="text-center">
                            <h3 className="text-sm font-semibold text-slate-800">Securely fund your lease agreement</h3>
                            <p className="text-xs text-slate-500 mt-1">Total Due: <strong className="text-indigo-600">${(securityDeposit + rent).toFixed(2)}</strong>. Select a digital gateway to view handles & QR.</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
                            <button
                              onClick={() => setPayGateway("venmo")}
                              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 sm:p-4.5 transition-all duration-300 transform cursor-pointer ${
                                payGateway === "venmo"
                                  ? "border-blue-600 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white font-bold shadow-[0_8px_20px_rgba(59,130,246,0.3)] ring-2 ring-blue-400/40 scale-[1.04] z-10"
                                  : "border-slate-200/80 bg-gradient-to-br from-blue-50/20 to-blue-100/10 text-[#008CFF] hover:border-blue-400 hover:bg-blue-50/30 hover:scale-[1.02] hover:-translate-y-0.5"
                              }`}
                            >
                              <span className={`text-xs sm:text-lg font-extrabold tracking-tight transition-colors duration-300 ${payGateway === "venmo" ? "text-white" : "text-[#008CFF]"}`}>Venmo</span>
                            </button>

                            <button
                              onClick={() => setPayGateway("cashapp")}
                              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 sm:p-4.5 transition-all duration-300 transform cursor-pointer ${
                                payGateway === "cashapp"
                                  ? "border-emerald-600 bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 text-white font-bold shadow-[0_8px_20px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400/40 scale-[1.04] z-10"
                                  : "border-slate-200/80 bg-gradient-to-br from-emerald-50/20 to-emerald-100/10 text-[#00D632] hover:border-emerald-400 hover:bg-emerald-50/30 hover:scale-[1.02] hover:-translate-y-0.5"
                              }`}
                            >
                              <span className={`text-xs sm:text-lg font-extrabold tracking-tight transition-colors duration-300 ${payGateway === "cashapp" ? "text-white" : "text-[#00D632]"}`}>Cash App</span>
                            </button>

                            <button
                              onClick={() => setPayGateway("chime")}
                              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 sm:p-4.5 transition-all duration-300 transform cursor-pointer ${
                                payGateway === "chime"
                                  ? "border-teal-600 bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 text-white font-bold shadow-[0_8px_20px_rgba(20,184,166,0.3)] ring-2 ring-teal-400/40 scale-[1.04] z-10"
                                  : "border-slate-200/80 bg-gradient-to-br from-teal-50/20 to-teal-100/10 text-[#25C974] hover:border-teal-400 hover:bg-teal-50/30 hover:scale-[1.02] hover:-translate-y-0.5"
                              }`}
                            >
                              <span className={`text-xs sm:text-lg font-extrabold tracking-tight transition-colors duration-300 ${payGateway === "chime" ? "text-white" : "text-[#25C974]"}`}>Chime</span>
                            </button>
                          </div>

                          {payGateway && (
                            <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-4">
                              <div className="flex flex-col sm:flex-row gap-6 items-center">
                                {/* QR Code scan container */}
                                <div className="relative w-56 h-56 border-2 border-indigo-100 rounded-xl p-2 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                  <div className="scanner-line" />
                                  {payGateway === "venmo" && pageSettings.payVenmoQr ? (
                                    <img src={pageSettings.payVenmoQr} alt="Venmo QR" className="w-full h-full object-contain" />
                                  ) : payGateway === "cashapp" && pageSettings.payCashAppQr ? (
                                    <img src={pageSettings.payCashAppQr} alt="Cash App QR" className="w-full h-full object-contain" />
                                  ) : payGateway === "chime" && pageSettings.payChimeQr ? (
                                    <img src={pageSettings.payChimeQr} alt="Chime QR" className="w-full h-full object-contain" />
                                  ) : (
                                    <QRCodeSVG />
                                  )}
                                </div>

                                <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {payGateway === "venmo" && "Venmo Gateway"}
                                    {payGateway === "cashapp" && "Cash App Gateway"}
                                    {payGateway === "chime" && "Chime Digital Portal"}
                                  </h4>
                                  <div className="text-sm font-semibold text-slate-800">
                                    Amount Due: <span className="text-indigo-600">${(securityDeposit + rent).toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-100 rounded-lg p-3 mt-1">
                                    <span className="font-mono text-base font-bold text-slate-700 truncate select-all">
                                      {payGateway === "venmo" && (pageSettings.payVenmoHandle || "@hoarentservices")}
                                      {payGateway === "cashapp" && (pageSettings.payCashAppHandle || "$hoarentservices")}
                                      {payGateway === "chime" && (pageSettings.payChimeHandle || "hoarentservices@chime.com")}
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(
                                        payGateway === "venmo" ? (pageSettings.payVenmoHandle || "@hoarentservices") :
                                        payGateway === "cashapp" ? (pageSettings.payCashAppHandle || "$hoarentservices") :
                                        (pageSettings.payChimeHandle || "hoarentservices@chime.com")
                                      )}
                                      className="p-1 rounded hover:bg-slate-200 text-slate-500"
                                      title="Copy handle"
                                    >
                                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                    </button>
                                    <a
                                       href={(() => {
                                         const raw = payGateway === "venmo" ? (pageSettings.payVenmoHandle || "@hoarentservices") :
                                                     payGateway === "cashapp" ? (pageSettings.payCashAppHandle || "$hoarentservices") :
                                                     (pageSettings.payChimeHandle || "hoarentservices@chime.com");
                                         const h = raw.trim();
                                         if (h.startsWith("http://") || h.startsWith("https://")) return h;
                                         if (h.includes("/") || (h.includes(".") && !h.includes("@"))) return `https://${h}`;
                                         if (payGateway === "venmo") return `https://venmo.com/${h.replace(/^@/, '')}`;
                                         if (payGateway === "cashapp") return `https://cash.app/${h.startsWith('$') ? h : '$' + h}`;
                                         if (h.includes("@")) return `mailto:${h}`;
                                         return `https://${h}`;
                                       })()}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="ml-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
                                     >
                                       Pay
                                     </a>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                    Scan the QR code or send payment to the address above. Take a screenshot of the transaction receipt and upload below.
                                  </p>
                                </div>
                              </div>

                              <div className="border-t border-slate-100 pt-4">
                                <ProofUpload label="Upload your payment screenshot" onComplete={(fname) => startPaymentVerification(fname)} />
                              </div>

                              <div className="border-t border-slate-100 pt-3 mt-3">
                                <div className="text-xs font-extrabold text-amber-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">⚠️ Payment Note</div>
                                <div className="text-sm font-bold text-amber-900 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-xl">
                                  {pageSettings.paymentNote || "No additional instructions provided."}
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-start pt-2">
                            <Button variant="ghost" onClick={() => setBuilderStep(1)}>Back</Button>
                          </div>
                        </div>
                      )}

                      {paymentStatus === "waiting" && (
                        <VerificationWaitingPanel
                          logs={verificationLogs}
                          title="Verifying secure escrow funding..."
                          subtitle="We're verifying the transaction proof screenshot on the state compliance ledger."
                        />
                      )}

                      {paymentStatus === "confirmed" && (
                        <div className="text-center py-6 space-y-4 max-w-md mx-auto">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <CheckCircle2 className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-slate-800">Security Deposit Funded!</h3>
                            <p className="text-xs text-slate-500 mt-1">Transaction proof verified successfully. You may proceed to download documents.</p>
                          </div>
                          <Button className="w-full" onClick={() => setBuilderStep(3)}>Proceed to Documents</Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {builderStep === 3 && (
                <div className="text-center py-6 space-y-6 max-w-md mx-auto">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Your process is complete!</h3>
                    <p className="text-xs text-slate-500 mt-1">Thank you for connecting with us. Your lease documents and renter handbook are ready for download.</p>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs divide-y divide-slate-100 text-left">
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-slate-500">Document Type</span>
                      <span className="text-slate-800 font-semibold">Residential Lease Agreement</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-slate-500">Signature Authority</span>
                      <span className="text-slate-800 font-mono">/s/ {typedSignature || tenant}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-slate-500">Funding Method</span>
                      <span className="text-slate-800 font-semibold">{processor || "Self-Funded Proof"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button className="w-full flex items-center justify-center gap-2" onClick={() => downloadLease(currentLeaseOpts)}>
                      <Download className="h-4 w-4" /> Download Signed Lease PDF
                    </Button>
                    <Button variant="secondary" className="w-full flex items-center justify-center gap-2" onClick={() => downloadHandbook(tenant || "Tenant")}>
                      <BookOpen className="h-4 w-4" /> Download Tenant Handbook
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <Button variant="ghost" onClick={() => {
                      setTenant("");
                      setUnit("");
                      setStart("");
                      setEnd("");
                      setRent(0);
                      setAgreementDate("");
                      setLandlordName("");
                      setBedrooms(0);
                      setBathrooms(0);
                      setParkingSpaces(0);
                      setStorageSpaces("");
                      setFurnishedStatus("unfurnished");
                      setTermTotalRent(0);
                      setRentDueDay("1st");
                      setSecurityDeposit(0);
                      setLandlordNoticeAddress("");
                      setLandlordNoticeEmail("");
                      setTenantNoticeAddress("");
                      setTenantNoticeEmail("");
                      setGoverningState(j.name);
                      setDisputeCounty("");
                      setConsent(false);
                      setTypedSignature("");
                      setPaymentStatus("idle");
                      setPayGateway("venmo");
                      setBuilderStep(0);
                    }}>
                      Create Another Lease Agreement
                    </Button>
                    <Link to="/security-deposit">
                      <Button variant="primary">Proceed to Security Escrow →</Button>
                    </Link>
                  </div>
                </div>
              )}
            </StepPanel>
          </div>
        </Card>

        <Card className="flex flex-col h-[400px] sm:h-[500px] lg:h-[600px]">
          <div className="border-b border-slate-100 p-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-800">Your shared lease preview</h2>
            <Pill tone={isFormComplete ? "emerald" : "amber"}>{isFormComplete ? "Draft complete" : "Draft incomplete"}</Pill>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-[#FCFBF9] rounded-b-2xl border-t border-slate-100 font-serif text-[13px] text-slate-800 leading-relaxed text-justify shadow-inner">
            <div className="text-center border-b-2 border-double border-slate-300 pb-5 mb-5">
              <h3 className="font-display text-lg font-bold text-slate-900 uppercase tracking-widest">RESIDENTIAL LEASE AGREEMENT</h3>
              <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mt-1">State of {governingState || "________"}</p>
              <div className="mx-auto mt-2 h-1 w-20 bg-indigo-600 rounded"></div>
            </div>
            
            {highlightSections.map((sec, idx) => {
              const isPreamble = !sec.title;
              return (
                <div key={idx} className="mb-4">
                  {!isPreamble && <h4 className="font-bold text-slate-900 mb-1">{idx}. {sec.title}</h4>}
                  <p className="text-slate-800 font-serif text-justify indent-4 leading-relaxed">{sec.content}</p>
                </div>
              );
            })}

            <div className="mt-8 pt-4 border-t-2 border-double border-slate-300">
              <p className="italic text-xs text-slate-500 mb-6">IN WITNESS WHEREOF, the Parties hereto, individually or by their duly authorized representatives, have executed this Agreement as of the Effective Date.</p>
              <div className="grid grid-cols-2 gap-8 mt-4">
                <div className="border-t border-slate-400 pt-2 text-xs">
                  <div className="font-bold font-sans">/s/ {landlordName || "________"}</div>
                  <div className="text-slate-500 text-[10px]">Landlord Signature</div>
                  <div className="text-slate-800 font-medium mt-1 font-sans">{landlordName || "________"}</div>
                  <div className="text-slate-400 text-[9px] uppercase tracking-wider">Landlord Name</div>
                </div>
                <div className="border-t border-slate-400 pt-2 text-xs">
                  <div className="font-bold font-sans">/s/ {tenant || "________"}</div>
                  <div className="text-slate-500 text-[10px]">Tenant Signature</div>
                  <div className="text-slate-800 font-medium mt-1 font-sans">{tenant || "________"}</div>
                  <div className="text-slate-400 text-[9px] uppercase tracking-wider">Tenant Name</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-display text-lg font-semibold text-slate-800">Completed lease vault</h2>
        </div>
        <div className="p-5">
          {signedLeases.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No signed leases yet — complete the builder above to populate the vault.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {signedLeases.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{l.tenant} — Unit {l.unit}</div>
                    <div className="text-xs text-slate-500">{l.start} → {l.end} · ${l.rent}/mo · signed {new Date(l.signedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => downloadLease({
                      agreementDate: l.agreementDate,
                      landlordName: l.landlordName,
                      tenantName: l.tenant,
                      bedrooms: l.bedrooms,
                      bathrooms: l.bathrooms,
                      parkingSpaces: l.parkingSpaces,
                      unitAddress: l.unit,
                      storageSpaces: l.storageSpaces,
                      furnishedStatus: l.furnishedStatus,
                      startDate: l.start,
                      endDate: l.end,
                      termTotalRent: l.termTotalRent,
                      monthlyRent: l.rent,
                      rentDueDay: l.rentDueDay,
                      paymentMethod: l.paymentMethod,
                      securityDeposit: l.securityDeposit,
                      landlordNoticeAddress: l.landlordNoticeAddress,
                      landlordNoticeEmail: l.landlordNoticeEmail,
                      tenantNoticeAddress: l.tenantNoticeAddress,
                      tenantNoticeEmail: l.tenantNoticeEmail,
                      governingState: l.governingState,
                      disputeCounty: l.disputeCounty,
                      petPolicy: l.pets
                    })}>
                      <Download className="h-4 w-4" /> Lease PDF
                    </Button>
                    <Button variant="secondary" onClick={() => downloadHandbook(l.tenant)}>
                      <BookOpen className="h-4 w-4" /> Handbook PDF
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </PageShell>
  );
}

function QRCodeSVG() {
  return (
    <svg width="100" height="100" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-800 w-full h-full">
      {/* Outer frame */}
      <path d="M1 1h7v2H3v4H1V1zM21 1h7v6h-2V3h-5V1zM1 21h2v5h5v2H1v-7zM28 21v7h-7v-2h5v-5h2z" fill="currentColor" />
      {/* Finder Patterns */}
      <path d="M3 3h7v7H3V3zm1 1v5h5V4H4zM5 5h3v3H5V5z" fill="currentColor" />
      <path d="M19 3h7v7h-7V3zm1 1v5h5V4h-5zM21 5h3v3h-3V5z" fill="currentColor" />
      <path d="M3 19h7v7H3v-7zm1 1v5h5v-5H4zM5 21h3v3H5v-3z" fill="currentColor" />
      {/* Alignment Pattern */}
      <path d="M19 19h2v2h-2v-2zM21 21h2v2h-2v-2zM23 19h2v2h-2v-2zM23 23h2v2h-2v-2zM19 23h2v2h-2v-2z" fill="currentColor" />
      {/* Timing and Random Data blocks */}
      <path d="M12 3h2v2h-2V3zM15 3h2v2h-2V3zM12 6h2v2h-2V6zM15 6h2v2h-2V6zM3 12h2v2H3v-2zM6 12h2v2H6v-2zM3 15h2v2H3v-2zM6 15h2v2H6v-2z" fill="currentColor" />
      <path d="M12 12h2v2h-2v-2zM14 14h2v2h-2v-2zM16 12h2v2h-2v-2zM12 16h2v2h-2v-2z" fill="currentColor" />
      <path d="M9 12h2v2H9v-2zM9 15h2v2H9v-2zM15 9h2v2h-2V9zM12 9h2v2h-2V9z" fill="currentColor" />
    </svg>
  );
}
