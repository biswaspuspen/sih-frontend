export type ProblemStatus = "Resolved" | "In Progress" | "Under Review" | "New"

export type Problem = {
  id: string
  title: string
  category: string
  location: string
  university: string
  status: ProblemStatus
  submitted: string
}

export type CategoryDatum = {
  category: string
  count: number
}

export const summary = {
  totalChallenges: 1284,
  totalChallengesDelta: 12.4,
  resolved: 742,
  resolvedDelta: 8.1,
  universities: 68,
  universitiesDelta: 4,
}

export const categoryData: CategoryDatum[] = [
  { category: "Water", count: 268 },
  { category: "Healthcare", count: 224 },
  { category: "Education", count: 312 },
  { category: "Energy", count: 156 },
  { category: "Transport", count: 188 },
  { category: "Agriculture", count: 136 },
]

export const recentProblems: Problem[] = [
  {
    id: "SIP-2041",
    title: "Contaminated groundwater in rural wells",
    category: "Water",
    location: "Nashik, Maharashtra",
    university: "IIT Bombay",
    status: "In Progress",
    submitted: "2026-09-04",
  },
  {
    id: "SIP-2040",
    title: "Digital learning access for remote schools",
    category: "Education",
    location: "Kohima, Nagaland",
    university: "NIT Warangal",
    status: "Under Review",
    submitted: "2026-09-04",
  },
  {
    id: "SIP-2039",
    title: "Mobile primary care for tribal belts",
    category: "Healthcare",
    location: "Bastar, Chhattisgarh",
    university: "AIIMS Raipur",
    status: "New",
    submitted: "2026-09-03",
  },
  {
    id: "SIP-2038",
    title: "Solar micro-grid for off-grid villages",
    category: "Energy",
    location: "Leh, Ladakh",
    university: "IIT Delhi",
    status: "Resolved",
    submitted: "2026-09-02",
  },
  {
    id: "SIP-2037",
    title: "Last-mile transit for industrial workers",
    category: "Transport",
    location: "Pune, Maharashtra",
    university: "COEP Technological",
    status: "In Progress",
    submitted: "2026-09-02",
  },
  {
    id: "SIP-2036",
    title: "Crop-loss prediction for smallholders",
    category: "Agriculture",
    location: "Guntur, Andhra Pradesh",
    university: "ANGRAU",
    status: "Under Review",
    submitted: "2026-09-01",
  },
  {
    id: "SIP-2035",
    title: "Flood early-warning sensor network",
    category: "Water",
    location: "Patna, Bihar",
    university: "IIT Patna",
    status: "Resolved",
    submitted: "2026-08-31",
  },
]
