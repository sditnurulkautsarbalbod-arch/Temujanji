
import { Appointment, AppointmentStatus, StaffType } from '../types';

// PENTING: Ganti URL di bawah ini dengan URL Web App dari Google Apps Script Anda (berakhiran /exec)
// Pastikan Deploy sebagai: "Anyone" (Siapa saja)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYaVo1z4y4MQlDYuMW535IuoYlWD8L7stq1JEkzLtQr0P2YoXQRpWRr7RwO_eqgEI3kA/exec"; 
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
         console.warn("URL Google Script belum dikonfigurasi.");
         throw new Error("URL Konfigurasi Kosong");
      }

      // TAMBAHAN: &t=timestamp untuk bypass browser cache
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=read&t=${new Date().getTime()}`);
      
      // Validasi Content-Type: Pastikan yang diterima adalah JSON, bukan HTML (Login Page)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") === -1) {
        throw new Error("Respon server bukan JSON. Kemungkinan masalah izin akses (Deploy as Anyone).");
      }

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // SORTING: Urutkan data berdasarkan createdAt terbaru (Descending)
        // Agar data baru selalu muncul paling atas
        if (Array.isArray(result.data)) {
           result.data.sort((a: Appointment, b: Appointment) => {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
           });
        }

        // Sinkronisasi: Simpan data terbaru dari Cloud ke LocalStorage untuk cache
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
        return { data: result.data, source: 'remote' };
      }
      
      return { data: [], source: 'remote' };
    } catch (error) {
      console.warn("⚠️ Gagal terhubung ke Google Sheets. Menggunakan Data Lokal (Offline Mode).", error);
      // Fallback ke LocalStorage
      const localData = await this.getMockData();
      // Tetap sort data lokal juga
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
      id: Math.random().toString(36).substr(2, 9),
      status: AppointmentStatus.PENDING,
      createdAt: new Date().toISOString(),
      notes: ''
      // attachmentUrl diisi nanti oleh backend
    };

    // 1. Simpan ke LocalStorage (Optimistic UI)
    const localData = await this.getMockData();
    localData.unshift(newAppt); // Add to beginning
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));

    // 2. Coba kirim ke Google Sheets
    try {
      if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("ISI_URL")) {
        
        if (appt.fileData) {
          console.log(`Mengirim file: ${appt.attachmentName}`);
        }

        // Kirim request 'no-cors' (Fire and forget)
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
              action: 'create',
              ...appt,
              fileName: appt.attachmentName, // Mapping nama file
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
            headers: { 'Content-Type': 'text/plain' },
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
                headers: { 'Content-Type': 'text/plain' },
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
