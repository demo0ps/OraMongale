// Helper types for admin read-models.

export type AssignmentWithDetails = {
  id: number;
  truckId: number;
  companyId: number;
  status: "proposed" | "accepted" | "declined" | "completed";
  companyResponseNote: string | null;
  createdAt: string;
  company: {
    id: number;
    name: string;
    contactEmail: string;
    contactName: string;
    contactPhone: string;
  };
  contactName: string | null;
  truck: {
    id: number;
    truckType: string;
    make: string | null;
    model: string | null;
    baseLocation: string | null;
    status: string;
    registration: string | null;
  } | null;
};

export type JobWithAssignments = {
  id: number;
  description: string | null;
  pickupSite: string | null;
  dropoffSite: string | null;
  material: string | null;
  tonnage: number | null;
  requiredTruckType: string | null;
  requiredTruckCount: number | null;
  startDate: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  mine: { id: number; name: string } | null;
  lead: { id: number; mineName: string; contactName: string; contactPhone: string; contactEmail: string | null } | null;
  assignments: AssignmentWithDetails[];
};

export type SearchResult =
  | { kind: "truck"; id: number; title: string; subtitle: string; status: string | null; href: string }
  | { kind: "company"; id: number; title: string; subtitle: string; status: string | null; href: string }
  | { kind: "person"; id: number; title: string; subtitle: string; status: string | null; href: string }
  | { kind: "job"; id: number; title: string; subtitle: string; status: string | null; href: string }
  | { kind: "lead"; id: number; title: string; subtitle: string; status: string | null; href: string }
  | { kind: "mine"; id: number; title: string; subtitle: string; status: string | null; href: string };
