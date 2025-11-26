import { StaffMember } from './types';
import { staffData } from './staffData';

export const APP_NAME = "SD IT Nurul Kautsar";
export const SCHOOL_ADDRESS = "Jl. Andi Mangerangi No. 47, Makassar";
export const CONTACT_WA = "+6281234567890";

// Load data staff dari file TS
export const MOCK_STAFF: StaffMember[] = staffData as unknown as StaffMember[];

// Updated time slots to match new operational hours (until 11:30)
export const TIME_SLOTS = [
  "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", 
  "10:30", "11:00", "11:30"
];

export const GEMINI_MODEL_FLASH = "gemini-2.5-flash";
