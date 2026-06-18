export type HazardSeverity = "high" | "medium" | "info";

export type HazardLabel = {
  id: string;
  label: string;
  severity: HazardSeverity;
  position: { top: string; left: string };
};

export type WorkerPersona = {
  id: string;
  name: string;
  description: string;
  initials: string;
  avatarColor: string;
};

export const scenario = {
  id: "construction-site-demo",
  title: "Scenario: Commercial Building Construction",
  imageSrc: "/images/construction-site-demo.png",
  imageAlt: "Multi-story commercial construction site with scaffolding and crane",
  imageWidth: 1672,
  imageHeight: 941,
} as const;

export const hazardLabels: HazardLabel[] = [
  {
    id: "unprotected-edge",
    label: "Unprotected Edge",
    severity: "high",
    position: { top: "8%", left: "42%" },
  },
  {
    id: "suspended-load",
    label: "Suspended Load",
    severity: "high",
    position: { top: "18%", left: "58%" },
  },
  {
    id: "unsecured-ladder",
    label: "Unsecured Ladder",
    severity: "medium",
    position: { top: "38%", left: "28%" },
  },
  {
    id: "spilled-materials",
    label: "Spilled Materials / Trip Hazard",
    severity: "medium",
    position: { top: "72%", left: "38%" },
  },
  {
    id: "missing-ppe",
    label: "Missing PPE",
    severity: "info",
    position: { top: "62%", left: "68%" },
  },
];

export const workerPersonas: WorkerPersona[] = [
  {
    id: "experienced-worker",
    name: "Experienced Worker",
    description: "15+ years on the job",
    initials: "EW",
    avatarColor: "bg-blue-100 text-blue-800",
  },
  {
    id: "new-hire",
    name: "New Hire",
    description: "Less than 6 months",
    initials: "NH",
    avatarColor: "bg-orange-100 text-orange-800",
  },
  {
    id: "limited-english",
    name: "Limited English Proficiency",
    description: "Primary language: Spanish",
    initials: "LE",
    avatarColor: "bg-emerald-100 text-emerald-800",
  },
  {
    id: "low-literacy",
    name: "Low Literacy",
    description: "Prefers visual learning",
    initials: "LL",
    avatarColor: "bg-violet-100 text-violet-800",
  },
  {
    id: "site-supervisor",
    name: "Site Supervisor",
    description: "Oversees daily operations",
    initials: "SS",
    avatarColor: "bg-slate-200 text-slate-800",
  },
];

export const hazardSeverityStyles: Record<
  HazardSeverity,
  { badge: string; dot: string }
> = {
  high: {
    badge: "border-red-600 bg-red-50 text-red-800",
    dot: "bg-red-600",
  },
  medium: {
    badge: "border-orange-500 bg-orange-50 text-orange-900",
    dot: "bg-orange-500",
  },
  info: {
    badge: "border-violet-600 bg-violet-50 text-violet-900",
    dot: "bg-violet-600",
  },
};
