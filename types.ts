
export enum AppointmentStatus {
  PENDING = 'Menunggu Konfirmasi',
  APPROVED = 'Disetujui',
  REJECTED = 'Ditolak',
  RESCHEDULED = 'Dijadwalkan Ulang',
  COMPLETED = 'Selesai'
}

export enum UserRole {
  GUEST = 'GUEST',
  ADMIN = 'ADMIN', // Kepala Sekolah / TU has admin access
}

export enum StaffType {
  HEADMASTER = 'Kepala Sekolah',
  TEACHER = 'Guru',
  STAFF = 'Staf'
}

export interface StaffMember {
  id: string;
  name: string;
  type: StaffType;
  position?: string; // Mapel atau Bagian
}

export interface Appointment {
  id: string;
  guestName: string;
  guestWhatsapp: string;
  guestEmail?: string;
  targetType: StaffType;
  targetStaffId: string; // Maps to StaffMember.id
  targetStaffName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  reason: string;
  attachmentName?: string; // Name of the uploaded file
  attachmentUrl?: string; // Google Drive URL
  status: AppointmentStatus;
  createdAt: string;
  notes?: string; // Admin notes
}

export interface StatMetric {
  label: string;
  value: number;
  change?: string;
  positive?: boolean;
}
