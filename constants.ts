import { StaffMember, StaffType } from './types';

export const APP_NAME = "SD IT Nurul Kautsar";
export const SCHOOL_ADDRESS = "Jl. Andi Mangerangi No. 47, Makassar";
export const CONTACT_WA = "+6281234567890";

// Mock Staff Data (In a real app, this comes from the 'Guru' and 'Staf' sheets)
export const MOCK_STAFF: StaffMember[] = [
  { id: 'hm-1', name: 'H. Ahmad Fauzi, M.Pd', type: StaffType.HEADMASTER },
  { id: 'tc-1', name: 'Siti Aminah, S.Pd', type: StaffType.TEACHER, position: 'Matematika' },
  { id: 'tc-2', name: 'Budi Santoso, S.Pd', type: StaffType.TEACHER, position: 'PAI' },
  { id: 'tc-3', name: 'Rina Wati, S.Pd', type: StaffType.TEACHER, position: 'Tematik Kelas 1' },
  { id: 'st-1', name: 'Nurul Hidayah', type: StaffType.STAFF, position: 'Tata Usaha' },
  { id: 'st-2', name: 'Agus Salim', type: StaffType.STAFF, position: 'Keamanan' },
];

// Updated time slots to match new operational hours (until 11:30)
export const TIME_SLOTS = [
  "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", 
  "10:30", "11:00", "11:30"
];

export const GEMINI_MODEL_FLASH = "gemini-2.5-flash";