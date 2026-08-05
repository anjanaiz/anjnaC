export type TaskStatus = 'TO SHOOT' | 'EDIT PENDING' | 'DONE';

export interface VideoItem {
  id: string;
  person: string; // e.g., "Kasun Kalhara", "Chamara Weerasinha"
  name: string;   // e.g., "Video Clip"
  status: TaskStatus;
}

export interface Category {
  id: string;
  name: string;
  items: VideoItem[];
  isCustom?: boolean;
}

export type DayStatus = 'Pending' | 'Completed' | 'Delayed' | 'LIVE EVENT';

export interface TimelineTask {
  id: string;
  section: 'Shoot' | 'Edit' | 'Post' | 'Coordination';
  text: string;
  status: 'Pending' | 'Completed' | 'Delayed' | 'Rescheduled';
  originalDate?: string; // stores original date if rescheduled
}

export interface TimelineDay {
  date: string; // e.g. "JUNE 12", "JUNE 28"
  description?: string; // e.g. "Planning Phase", "EVENT DAY"
  status: DayStatus;
  tasks: TimelineTask[];
  isEventDay?: boolean;
}

export interface Stall {
  id: string;
  name: string;
  vendorName: string;
  whatsappNumber: string;
  advancePayment: number;
  remainingBalance: number;
  items: string[];
  notes?: string;
  createdAt?: number;
}

export interface BudgetItem {
  id: string;
  category: 'Venue & Security' | 'Sound & Stage' | 'Artist & Performance' | 'Media & Marketing' | 'Logistics & Hospitality' | 'Sponsorship & Revenue' | 'Miscellaneous';
  title: string;
  type: 'Expense' | 'Income';
  estimatedAmount: number;
  actualAmount: number;
  paidAmount: number;
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
  vendorOrSource: string;
  dueDate?: string;
  notes?: string;
}

export type SponsorTier = 'Title Sponsor' | 'Platinum' | 'Gold' | 'Silver' | 'Media Partner' | 'Beverage Partner' | 'Official Supporter';

export interface Sponsor {
  id: string;
  name: string;
  brandName: string;
  tier: SponsorTier;
  contactPerson: string;
  phone: string;
  email?: string;
  contractValue: number;
  amountReceived: number;
  paymentStatus: 'Pending' | 'Partial' | 'Completed';
  logoUrl?: string;
  deliverables: { id: string; text: string; completed: boolean }[];
  status: 'In Discussion' | 'Confirmed' | 'Signed' | 'Fulfilled';
  notes?: string;
}

export interface EventInfo {
  id: 'chakra360' | 'kathawak';
  name: string;
  subtitle: string;
  date: string;
  venue: string;
  logo: string;
  accentColor: string;
  badge: string;
}

