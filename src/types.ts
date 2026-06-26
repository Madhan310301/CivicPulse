export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  xp: number;
  badges: string[];
  reportsCount: number;
  verificationsCount: number;
  resolvedCount: number;
  ward: string;
  joinedAt: string; // ISO String
}

export type CivicCategory = "pothole" | "streetlight" | "water_leak" | "waste" | "road_damage" | "other";

export type IssueStatus = "reported" | "verified" | "assigned" | "in_progress" | "resolved";

export interface IssueLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface Issue {
  id?: string;
  title: string;
  description: string;
  category: CivicCategory;
  severity: number; // 1-5
  status: IssueStatus;
  imageUrl: string;
  location: IssueLocation;
  ward: string;
  reportedBy: string;
  verifiedBy: string[]; // Array of UIDs
  verificationCount: number;
  department: string;
  aiClassification: any; // Raw response from Gemini
  isDuplicate: boolean;
  duplicateOf: string | null;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  resolvedAt?: string | null; // ISO String
  slaDeadline: string; // ISO String (calculated)
}

export interface Hotspot {
  id?: string;
  ward: string;
  category: string;
  riskScore: number;
  predictedIssueType: string;
  basedOnReports: number;
  generatedAt: string; // ISO String
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string; // ISO String
}
