export type EmergencyGroupId = 'bencana' | 'kesehatan' | 'kecelakaan' | 'keamanan' | 'lainnya';

export interface EmergencyCategory {
  id: string;
  name: string;
  shortDesc: string;
  group: EmergencyGroupId;
  groupLabel: string;
  iconName: string;
  keywords: string[];
}

export interface EmergencyGuide {
  id: string;
  categoryId: string;
  title: string;
  applicableWhen: string;
  doNow: string[];
  nextSteps: string[];
  dontDo: string[];
  whenToCallHelp: string[];
  relevantContactIds: string[];
  officialSources: { name: string; url?: string }[];
  reviewDate: string;
  checklist: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  serviceType: string;
  number: string;
  displayNumber: string;
  coverage: string;
  verifiedAvailability: string;
  officialSource: string;
  sourceUrl?: string;
  verificationDate: string;
  isHotline: boolean;
  notes?: string;
}

export interface NearbyFacility {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'fire_station' | 'clinic' | 'sar';
  typeLabel: string;
  address?: string;
  distanceKm?: number;
  phone?: string;
  lat?: number;
  lng?: number;
  mapsUrl: string;
}

export interface EmergencyTriageState {
  step: 1 | 2 | 3;
  categoryId: string | null;
  location: string;
  useGps: boolean;
  coords: { lat: number; lng: number } | null;
  victimStatus: 'none' | 'trapped' | 'injured' | 'unconscious' | 'unknown';
  severity: 'low' | 'medium' | 'critical' | 'unknown';
  additionalNotes: string;
}
