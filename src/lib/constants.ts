export const SA_PROVINCES = [
  { code: "EC", name: "Eastern Cape" },
  { code: "FS", name: "Free State" },
  { code: "GP", name: "Gauteng" },
  { code: "KZN", name: "KwaZulu-Natal" },
  { code: "LP", name: "Limpopo" },
  { code: "MP", name: "Mpumalanga" },
  { code: "NC", name: "Northern Cape" },
  { code: "NW", name: "North West" },
  { code: "WC", name: "Western Cape" },
] as const;

export const TRUCK_TYPES = [
  { value: "side_tipper", label: "Side tipper" },
  { value: "interlink_tipper", label: "Interlink tipper" },
  { value: "tipper", label: "Tipper (single)" },
  { value: "superlink", label: "Superlink flat-deck" },
  { value: "flat_deck", label: "Flat deck" },
  { value: "lowbed", label: "Lowbed" },
  { value: "water_tanker", label: "Water tanker" },
  { value: "fuel_tanker", label: "Fuel tanker" },
] as const;

export type TruckTypeValue = (typeof TRUCK_TYPES)[number]["value"];

export const TRUCK_TYPE_LABEL: Record<TruckTypeValue, string> =
  TRUCK_TYPES.reduce(
    (acc, t) => ({ ...acc, [t.value]: t.label }),
    {} as Record<TruckTypeValue, string>
  );

// Compliance doc types: some are per-company, some are per-truck.
export const COMPANY_DOC_TYPES = [
  { key: "cipc", label: "CIPC registration certificate" },
  { key: "coida", label: "COIDA Letter of Good Standing" },
  { key: "liability_insurance", label: "Public Liability insurance" },
  { key: "git", label: "Goods in Transit insurance" },
] as const;

export const TRUCK_DOC_TYPES = [
  { key: "license_disc", label: "Vehicle license disc" },
  { key: "roadworthy", label: "Certificate of Roadworthiness (CoR)" },
  { key: "operator_card", label: "Operator Card (DoT)" },
  { key: "nlta_permit", label: "Operating License / NLTA Road Transport Permit" },
] as const;

export const PROVINCE_BY_CODE = SA_PROVINCES.reduce(
  (acc, p) => ({ ...acc, [p.code]: p.name }),
  {} as Record<string, string>
);
