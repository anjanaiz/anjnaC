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

