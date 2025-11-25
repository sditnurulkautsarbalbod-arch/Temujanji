

import { Appointment, AppointmentStatus, StaffType } from '../types';

// PENTING: Ganti URL di bawah ini dengan URL Web App dari Google Apps Script Anda (berakhiran /exec)
// Pastikan Deploy sebagai: "Anyone" (Siapa saja)
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxEt4bJzYMjbqgo6aFyASwgjO2lGcMHRH50PkbBa8qySDuFEfqc7OJqG8kDmnfVBsFu3g/exec"; 
const STORAGE_KEY = 'sdit_nurul_kautsar_appointments';

// Interface tambahan untuk parameter create
interface CreateAppointmentParams extends Omit<Appointment, 'id' | 'status' | 'createdAt' | 'attachmentUrl'> {
  fileData?: string; // Base64 string
  mimeType?: string;
}

export const databaseService = {
  /**
   * Mengambil semua data janji temu
   * Logika: Coba Fetch API -> Jika Gagal -> Ambil dari LocalStorage
   */
  async getAppointments(): Promise<{ data: Appointment[], source: 'remote' | 'local' }> {
    try {
      // Cek apakah URL valid
      if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("ISI_URL")) {
         console.warn("URL Google Script belum dikonfigurasi dengan benar.");
         throw new Error("URL Konfigurasi Kosong");
      }

      // TAMBAHAN: &t=timestamp untuk bypass browser cache
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=read&t=${new Date().getTime()}`);
      
      // Validasi Content-Type: Pastikan yang diterima adalah JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || contentType.indexOf("application/json") === -1) {
        throw new Error("Respon server bukan JSON. Kemungkinan masalah izin akses (Pastikan Deploy as Anyone).");
      }

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Mapping data dari Spreadsheet (raw) ke format App yang tepat jika perlu
        const mappedData: Appointment[] = Array.isArray(result.data) ? result.data.map((item: any) => ({
          ...item,
          // Pastikan string date/time bersih dari tanda kutip jika ada
          date: item.date ? String(item.date).replace(/^'/, '') : item.date,
          time: item.time ? String(item.time).replace(/^'/, '') : item.time,
          guestWhatsapp: item.guestWhatsapp ? String(item.guestWhatsapp).replace(/^'/, '') : item.guestWhatsapp,
        })) : [];

        // SORTING: Urutkan data berdasarkan createdAt terbaru (Descending)
        mappedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Sinkronisasi: Simpan data terbaru dari Cloud ke LocalStorage untuk cache
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedData));
        return { data: mappedData, source: 'remote' };
      }
      
      return { data: [], source: 'remote' };
    } catch (error) {
      console.warn("⚠️ Gagal terhubung ke Google Sheets. Menggunakan Data Lokal (Offline Mode).", error);
      // Fallback ke LocalStorage
      const localData = await this.getMockData();
      localData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { data: localData, source: 'local' };
    }
  },

  /**
   * Menambahkan data baru
   * Logika: Simpan LocalStorage (biar cepat) -> Kirim ke API (Background)
   */
  async createAppointment(appt: CreateAppointmentParams): Promise<Appointment> {
    const newAppt: Appointment = {
      ...appt,
      id: Math.random().toString(36).substr(2, 9), // ID sementara
      status: AppointmentStatus.PENDING,
      createdAt: new Date().toISOString(),
      notes: ''
    };

    // 1. Simpan ke LocalStorage (Optimistic UI)
    const localData = await this.getMockData();
    localData.unshift(newAppt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));

    // 2. Kirim ke Google Sheets
    try {
      if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("ISI_URL")) {
        // Menggunakan mode 'no-cors' karena limitasi browser ke Google Apps Script POST.
        // PENTING: Jangan set Content-Type: application/json saat mode no-cors.
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            body: JSON.stringify({
              action: 'create',
              ...appt,
              // Mapping field file
              fileName: appt.attachmentName, 
              fileData: appt.fileData,
              mimeType: appt.mimeType,
              // Field sistem
              id: newAppt.id,
              status: newAppt.status,
              createdAt: newAppt.createdAt
            })
        });
        console.log("✅ Request kirim data terkirim ke Google Sheets");
      }
    } catch (error) {
      console.error("❌ Gagal sinkronisasi ke Google Sheets (Data tersimpan di Lokal):", error);
    }
    
    return newAppt;
  },

  /**
   * Update Status
   */
  async updateStatus(id: string, status: AppointmentStatus, notes?: string): Promise<Appointment | null> {
    const localData = await this.getMockData();
    const index = localData.findIndex(a => a.id === id);
    
    if (index !== -1) {
        localData[index].status = status;
        if (notes) localData[index].notes = notes;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
    }

    try {
       if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("ISI_URL")) {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
              action: 'update',
              id: id,
              status: status,
              notes: notes || ''
            })
          });
       }
    } catch (error) {
      console.error("Gagal update status ke Google Sheets:", error);
    }
    
    return localData[index] || null;
  },

  /**
   * Delete Data
   */
  async deleteAppointment(id: string): Promise<boolean> {
    const localData = await this.getMockData();
    const newData = localData.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

    try {
        if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("ISI_URL")) {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({
                action: 'delete',
                id: id
                })
            });
        }
    } catch (error) {
      console.error("Gagal menghapus data di Google Sheets:", error);
    }
    return true;
  },

  // Helper untuk ambil data lokal
  getMockData: (): Promise<Appointment[]> => {
      const data = localStorage.getItem(STORAGE_KEY);
      return Promise.resolve(data ? JSON.parse(data) : []);
  },

  // Helper hapus cache
  clearLocalCache: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};