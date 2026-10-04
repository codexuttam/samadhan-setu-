/**
 * SAMADHAN SETU — CIVIC TECH DATA LAYER
 * Contains the complete types, schema definitions, rule-based SLA calculations,
 * and pre-populated realistic mock data with Indian locations, wards, and departments.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'citizen' | 'officer' | 'dept_admin' | 'super_admin';
  departmentId?: string;
  wardId?: string;
}

export interface ComplaintCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  bgTint: string;
  subcategories: string[];
}

export interface Department {
  id: string;
  name: string;
  headName: string;
  email: string;
  phone: string;
}

export interface Ward {
  id: string;
  name: string;
  description: string;
}

export interface Officer {
  id: string;
  name: string;
  departmentId: string;
  phone: string;
  email: string;
  status: 'Available' | 'On Field' | 'On Leave';
  wardId?: string;
}

export interface ComplaintUpdate {
  id: string;
  complaintId: string;
  title: string;
  description: string;
  timestamp: string;
  authorName: string;
  authorRole: 'system' | 'citizen' | 'officer' | 'dept_admin' | 'super_admin';
  isInternal?: boolean;
}

export interface Escalation {
  id: string;
  complaintId: string;
  departmentId: string;
  supervisorName: string;
  timestamp: string;
  reason: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: string;
  recipientRole: string; // 'citizen' | 'officer' | 'dept_admin' | 'super_admin' or specific officerId
  complaintId?: string;
}

export interface Feedback {
  id: string;
  complaintId: string;
  rating: number; // 1 to 5
  comment: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  citizenEmail: string;
  categoryId: string;
  subcategory: string;
  departmentId: string;
  wardId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  pincode: string;
  status: 'Submitted' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  slaDeadline: string;
  slaBreached: boolean;
  assignedOfficerId?: string;
  evidenceUrls?: string[];
  resolutionProof?: {
    photoUrl?: string;
    note: string;
    resolvedAt: string;
  };
}

// Static Definitions
export const CATEGORIES: ComplaintCategory[] = [
  {
    id: 'roads_potholes',
    name: 'Roads & Potholes',
    description: 'Roads, potholes, footpaths',
    icon: 'Road',
    bgTint: 'bg-amber-50 text-amber-700 border-amber-100',
    subcategories: ['Pothole Repair', 'Footpath Damage', 'Speed Breaker Issue', 'Water Logging on Road', 'Road Divider Damage']
  },
  {
    id: 'street_lights',
    name: 'Street Lights',
    description: 'Non-working or damaged street lights',
    icon: 'Lightbulb',
    bgTint: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    subcategories: ['Non-working Street Light', 'Exposed Electrical Cables', 'Flickering Light', 'New Pole Requirement']
  },
  {
    id: 'water_drainage',
    name: 'Water & Drainage',
    description: 'Water supply, drainage blockage, leaks',
    icon: 'Droplet',
    bgTint: 'bg-blue-50 text-blue-700 border-blue-100',
    subcategories: ['Drainage Pipe Leakage', 'Sewer Overflow', 'Drinking Water Contamination', 'No Water Supply', 'Open Manhole']
  },
  {
    id: 'garbage_sanitation',
    name: 'Garbage & Sanitation',
    description: 'Garbage collection, waste disposal issues',
    icon: 'Trash',
    bgTint: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    subcategories: ['Garbage Pile-up', 'Missed Collection Route', 'Public Toilet Maintenance', 'Debris Dumped in Public Space']
  },
  {
    id: 'public_safety',
    name: 'Public Safety',
    description: 'Safety, encroachment, illegal activities',
    icon: 'Shield',
    bgTint: 'bg-rose-50 text-rose-700 border-rose-100',
    subcategories: ['Illegal Encroachment', 'Stray Animal Menace', 'Damaged Public Playground/Park', 'Hazardous Trees/Branches']
  },
  {
    id: 'other_issue',
    name: 'Other Issue',
    description: 'Any other civic issue',
    icon: 'Grid',
    bgTint: 'bg-slate-50 text-slate-700 border-slate-100',
    subcategories: ['General Query', 'Unlisted Complaint', 'Noise Pollution', 'Public Property Defacement']
  }
];

export const DEPARTMENTS: Department[] = [
  { id: 'dept_roads', name: 'Roads & Infrastructure', headName: 'Mr. Anil Deshmukh', email: 'roads@samadhansetu.in', phone: '+91 98221 11001' },
  { id: 'dept_electrical', name: 'Electricity & Streetlights', headName: 'Mrs. Smita Patil', email: 'electricity@samadhansetu.in', phone: '+91 98221 11002' },
  { id: 'dept_water', name: 'Water Supply & Sewerage', headName: 'Mr. Rajesh Kadam', email: 'water@samadhansetu.in', phone: '+91 98221 11003' },
  { id: 'dept_sanitation', name: 'Sanitation & Solid Waste', headName: 'Mr. Vijay Gaikwad', email: 'sanitation@samadhansetu.in', phone: '+91 98221 11004' },
  { id: 'dept_safety', name: 'Public Health & Safety', headName: 'Mrs. Neha Sharma', email: 'safety@samadhansetu.in', phone: '+91 98221 11005' },
  { id: 'dept_general', name: 'General Administration', headName: 'Mr. Suresh Shinde', email: 'admin@samadhansetu.in', phone: '+91 98221 11006' }
];

export const WARDS: Ward[] = [
  { id: 'ward_5', name: 'Ward 5 - Shivaji Nagar', description: 'Covers East Shivaji Nagar and Mahatma Phule Market area.' },
  { id: 'ward_8', name: 'Ward 8 - Ram Nagar', description: 'Covers Ram Temple complex and central residential streets.' },
  { id: 'ward_12', name: 'Ward 12 - Parvati Nagar', description: 'Covers Parvati Hills, residential highrises and gardens.' },
  { id: 'ward_14', name: 'Ward 14 - Gokul Nagar', description: 'Covers Gokul bypass, commercial hub, and industrial fringe.' }
];

export const OFFICERS: Officer[] = [
  { id: 'off_rajesh', name: 'Rajesh Patil', departmentId: 'dept_roads', email: 'rajesh.patil@samadhansetu.in', phone: '+91 91122 33441', status: 'Available', wardId: 'ward_12' },
  { id: 'off_amit', name: 'Amit Gokhale', departmentId: 'dept_electrical', email: 'amit.gokhale@samadhansetu.in', phone: '+91 91122 33442', status: 'On Field', wardId: 'ward_8' },
  { id: 'off_sanjay', name: 'Sanjay Shinde', departmentId: 'dept_water', email: 'sanjay.shinde@samadhansetu.in', phone: '+91 91122 33443', status: 'Available', wardId: 'ward_14' },
  { id: 'off_priya', name: 'Priya Sawant', departmentId: 'dept_sanitation', email: 'priya.sawant@samadhansetu.in', phone: '+91 91122 33444', status: 'Available', wardId: 'ward_5' },
  { id: 'off_karan', name: 'Karan Johar', departmentId: 'dept_safety', email: 'karan.johar@samadhansetu.in', phone: '+91 91122 33445', status: 'On Field', wardId: 'ward_12' }
];

// Helper to match category to a department
export function getDepartmentForCategory(categoryId: string): string {
  switch (categoryId) {
    case 'roads_potholes': return 'dept_roads';
    case 'street_lights': return 'dept_electrical';
    case 'water_drainage': return 'dept_water';
    case 'garbage_sanitation': return 'dept_sanitation';
    case 'public_safety': return 'dept_safety';
    default: return 'dept_general';
  }
}

// SLA Calculation Rules
export function getSLADurationHours(priority: 'low' | 'medium' | 'high' | 'critical'): number {
  switch (priority) {
    case 'low': return 72;
    case 'medium': return 48;
    case 'high': return 24;
    case 'critical': return 6;
  }
}

export function computeSLADeadline(createdAtStr: string, priority: 'low' | 'medium' | 'high' | 'critical'): string {
  const date = new Date(createdAtStr);
  const hours = getSLADurationHours(priority);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

// Realistic Initial Sample Data
export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'SS2025012343',
    citizenId: 'cit_uttam',
    citizenName: 'Uttamraj Singh',
    citizenPhone: '+91 79881 44248',
    citizenEmail: 'uttamrajsingh423@gmail.com',
    categoryId: 'roads_potholes',
    subcategory: 'Pothole Repair',
    departmentId: 'dept_roads',
    wardId: 'ward_12',
    title: 'Severe multiple potholes near DPS Main Road',
    description: 'There are three huge, deep potholes right opposite the DPS School main gate on Parvati Nagar Road. They are filled with water and are causing traffic congestion. Several two-wheelers have slipped here in the last 48 hours.',
    priority: 'high',
    latitude: 20.9320,
    longitude: 77.7523,
    address: 'DPS Road, Parvati Nagar',
    city: 'Dwarka, Delhi',
    pincode: '444605',
    status: 'In Progress',
    createdAt: '2026-09-12T09:00:00Z',
    updatedAt: '2026-09-14T10:24:00Z',
    slaDeadline: computeSLADeadline('2026-09-12T09:00:00Z', 'high'),
    slaBreached: false,
    assignedOfficerId: 'off_rajesh',
    evidenceUrls: []
  },
  {
    id: 'SS2025012281',
    citizenId: 'cit_mohit',
    citizenName: 'Mohit Sharma',
    citizenPhone: '+91 98334 11220',
    citizenEmail: 'mohit.sharma@example.com',
    categoryId: 'street_lights',
    subcategory: 'Non-working Street Light',
    departmentId: 'dept_electrical',
    wardId: 'ward_8',
    title: 'Entire street light line broken on Ram Temple Street',
    description: 'A block of 5 street poles is completely non-operational near the Ram Temple corner. The street is pitched dark at night making it extremely dangerous for women and senior citizens.',
    priority: 'medium',
    latitude: 20.9382,
    longitude: 77.7561,
    address: 'Ram Mandir Lane, Ward 8',
    city: 'Dwarka, Delhi',
    pincode: '444601',
    status: 'Resolved',
    createdAt: '2026-09-10T14:30:00Z',
    updatedAt: '2026-09-13T11:15:00Z',
    slaDeadline: computeSLADeadline('2026-09-10T14:30:00Z', 'medium'),
    slaBreached: false,
    assignedOfficerId: 'off_amit',
    evidenceUrls: [],
    resolutionProof: {
      photoUrl: '',
      note: 'Inspected the main junction box. Two blown fuses replaced and the faulty relay has been swapped with a working one. All 5 lights are now verified operational.',
      resolvedAt: '2026-09-13T11:15:00Z'
    }
  },
  {
    id: 'SS2025012174',
    citizenId: 'cit_anjali',
    citizenName: 'Anjali Deshpande',
    citizenPhone: '+91 99221 44883',
    citizenEmail: 'anjali.d@example.com',
    categoryId: 'garbage_sanitation',
    subcategory: 'Garbage Pile-up',
    departmentId: 'dept_sanitation',
    wardId: 'ward_5',
    title: 'Garbage dump pile overflowing near Mahatma Phule Market',
    description: 'Garbage collection truck has missed our lane for 3 consecutive days. Rotten food waste is spilled all over the street. Stray dogs and cows are tearing the plastic bags, creating a horrible stench.',
    priority: 'low',
    latitude: 20.9411,
    longitude: 77.7490,
    address: 'Gate 2, Mahatma Phule Market, Shivaji Nagar',
    city: 'Dwarka, Delhi',
    pincode: '444602',
    status: 'Submitted',
    createdAt: '2026-10-02T08:15:00Z',
    updatedAt: '2026-10-02T08:15:00Z',
    slaDeadline: computeSLADeadline('2026-10-02T08:15:00Z', 'low'),
    slaBreached: false,
    evidenceUrls: []
  },
  {
    id: 'SS2025011987',
    citizenId: 'cit_karan',
    citizenName: 'Karan Malhotra',
    citizenPhone: '+91 90223 55112',
    citizenEmail: 'karan.m@example.com',
    categoryId: 'water_drainage',
    subcategory: 'Sewer Overflow',
    departmentId: 'dept_water',
    wardId: 'ward_14',
    title: 'Open sewer overflow flooding Gokul Bypass Lane 3',
    description: 'The main sewage line under Gokul Bypass Lane 3 is completely choked. Dark black dirty water is coming out of the manhole and flooding the residential entrance. Children are unable to go out to school.',
    priority: 'critical',
    latitude: 20.9254,
    longitude: 77.7601,
    address: 'Lane 3, Gokul Nagar bypass',
    city: 'Dwarka, Delhi',
    pincode: '444607',
    status: 'Resolved',
    createdAt: '2026-09-08T06:00:00Z',
    updatedAt: '2026-09-08T11:45:00Z',
    slaDeadline: computeSLADeadline('2026-09-08T06:00:00Z', 'critical'),
    slaBreached: false,
    assignedOfficerId: 'off_sanjay',
    evidenceUrls: [],
    resolutionProof: {
      photoUrl: '',
      note: 'Dispatched emergency jetting machine. The blockage of plastic and cement bags has been removed. Desilting of the manhole completed and sewer is flowing smoothly.',
      resolvedAt: '2026-09-08T11:45:00Z'
    }
  }
];

export const INITIAL_UPDATES: ComplaintUpdate[] = [
  {
    id: 'up_001',
    complaintId: 'SS2025012343',
    title: 'Complaint Registered',
    description: 'Complaint successfully received by the digital platform. SLA timeframe started.',
    timestamp: '2026-09-12T09:00:00Z',
    authorName: 'System',
    authorRole: 'system'
  },
  {
    id: 'up_002',
    complaintId: 'SS2025012343',
    title: 'Assigned to Roads Department',
    description: 'Complaint routed automatically to Roads & Infrastructure Department based on category.',
    timestamp: '2026-09-13T10:15:00Z',
    authorName: 'System',
    authorRole: 'system'
  },
  {
    id: 'up_003',
    complaintId: 'SS2025012343',
    title: 'Officer Assigned',
    description: 'Junior Field Engineer Rajesh Patil has been designated to investigate and repair.',
    timestamp: '2026-09-13T11:30:00Z',
    authorName: 'Roads Dept Admin',
    authorRole: 'dept_admin'
  },
  {
    id: 'up_004',
    complaintId: 'SS2025012343',
    title: 'Site Inspection Scheduled & Work Started',
    description: 'Officer Rajesh Patil arrived on site. Tar material and labor crew dispatched to repair the pothole area.',
    timestamp: '2026-09-14T10:24:00Z',
    authorName: 'Rajesh Patil',
    authorRole: 'officer'
  },
  // Street light updates
  {
    id: 'up_005',
    complaintId: 'SS2025012281',
    title: 'Complaint Registered',
    description: 'Registered with ID SS2025012281.',
    timestamp: '2026-09-10T14:30:00Z',
    authorName: 'System',
    authorRole: 'system'
  },
  {
    id: 'up_006',
    complaintId: 'SS2025012281',
    title: 'Officer Assigned',
    description: 'Officer Amit Gokhale assigned to check Ram Temple corner poles.',
    timestamp: '2026-09-11T09:00:00Z',
    authorName: 'Electricity Dept Admin',
    authorRole: 'dept_admin'
  },
  {
    id: 'up_007',
    complaintId: 'SS2025012281',
    title: 'Resolution Submitted',
    description: 'Officer Amit Gokhale replaced blown fuses and relocated relays. Verified all 5 light poles are fully functional.',
    timestamp: '2026-09-13T11:15:00Z',
    authorName: 'Amit Gokhale',
    authorRole: 'officer'
  },
  // Sewer updates
  {
    id: 'up_008',
    complaintId: 'SS2025011987',
    title: 'Urgent Dispatch',
    description: 'Critical priority sewage blockage routed automatically. Emergency Jetting Machine team dispatched.',
    timestamp: '2026-09-08T06:15:00Z',
    authorName: 'System',
    authorRole: 'system'
  },
  {
    id: 'up_009',
    complaintId: 'SS2025011987',
    title: 'Sewer Unchoked & Cleaned',
    description: 'Officer Sanjay Shinde cleared the plastic blockage. Main line is now functioning and dry. Photo evidence generated.',
    timestamp: '2026-09-08T11:45:00Z',
    authorName: 'Sanjay Shinde',
    authorRole: 'officer'
  }
];

export const INITIAL_FEEDBACKS: Feedback[] = [
  {
    id: 'f_001',
    complaintId: 'SS2025011987',
    rating: 5,
    comment: 'Extremely fast response! Within 6 hours of reporting, the water was pumped out and sewer was cleaned. Appreciate the great work by Sanjay Shinde!',
    timestamp: '2026-09-08T14:00:00Z'
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'not_001',
    title: 'Complaint Registered',
    message: 'Your complaint SS2025012343 for "Pothole Repair" has been registered successfully.',
    type: 'success',
    isRead: false,
    timestamp: '2026-09-12T09:01:00Z',
    recipientRole: 'citizen',
    complaintId: 'SS2025012343'
  },
  {
    id: 'not_002',
    title: 'Officer Assigned',
    message: 'Field Officer Rajesh Patil has been assigned to resolve your complaint SS2025012343.',
    type: 'info',
    isRead: false,
    timestamp: '2026-09-13T11:31:00Z',
    recipientRole: 'citizen',
    complaintId: 'SS2025012343'
  },
  {
    id: 'not_003',
    title: 'New SLA Warning',
    message: 'Urgent critical complaint SS2025011987 is near its 6-hour deadline!',
    type: 'warning',
    isRead: true,
    timestamp: '2026-09-08T10:00:00Z',
    recipientRole: 'dept_admin',
    complaintId: 'SS2025011987'
  }
];

// LocalStorage Sync Helpers
export function loadState<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(`samadhan_setu_${key}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading state from localStorage:', e);
  }
  return defaultValue;
}

export function saveState<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`samadhan_setu_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error('Error saving state to localStorage:', e);
  }
}
