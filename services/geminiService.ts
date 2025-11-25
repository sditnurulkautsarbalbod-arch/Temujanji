
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_FLASH } from "../constants";

// Helper untuk mendapatkan API Key dari berbagai kemungkinan source
// 1. process.env.API_KEY (Standard Node/Webpack)
// 2. import.meta.env.VITE_API_KEY (Vite Environment)
const getApiKey = (): string | undefined => {
  // @ts-ignore - Mengabaikan error typescript untuk import.meta karena config mungkin berbeda
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }
  return process.env.API_KEY;
};

const apiKey = getApiKey();

// Inisialisasi Client Gemini
// Gunakan key jika ada, jika tidak biarkan kosong (nanti akan divalidasi saat pemanggilan fungsi)
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-to-prevent-crash' });

export const geminiService = {
  /**
   * Membuat draft pesan WhatsApp yang sopan untuk tamu
   * berdasarkan perubahan status janji temu.
   */
  async generateResponseDraft(
    guestName: string,
    status: string,
    reason: string,
    notes: string
  ): Promise<string> {
    const activeKey = getApiKey();

    // Validasi ketersediaan API Key sebelum request
    if (!activeKey) {
      console.error("API Key is missing. Please create a .env file with VITE_API_KEY=...");
      return "⚠️ Error: API Key Gemini belum dikonfigurasi. Mohon buat file .env di root project dan isi VITE_API_KEY Anda.";
    }

    // Re-inisialisasi dengan key yang valid jika perlu (untuk memastikan instance fresh)
    const aiClient = new GoogleGenAI({ apiKey: activeKey });

    const prompt = `
      Bertindaklah sebagai staf administrasi sekolah Islam SD IT Nurul Kautsar yang sopan, ramah, dan profesional.
      Buatkan pesan WhatsApp singkat untuk tamu bernama "${guestName}".
      
      Konteks:
      - Tamu mengajukan janji temu dengan alasan: "${reason}".
      - Status pengajuan saat ini diubah menjadi: "${status}".
      - Catatan tambahan dari admin: "${notes}".

      Instruksi:
      - Gunakan Bahasa Indonesia yang baik, baku namun luwes.
      - WAJIB mengawali pesan dengan salam Islami lengkap: "Assalamu'alaikum warahmatullahi wabarakatuh" (JANGAN DISINGKAT).
      - WAJIB mengakhiri pesan dengan salam Islami lengkap: "Wassalamu'alaikum warahmatullahi wabarakatuh" (JANGAN DISINGKAT).
      - Jika ada "Catatan tambahan dari admin", masukkan poin tersebut ke dalam pesan dengan bahasa yang mengalir (jangan kaku), sebagai bagian dari penjelasan kepada tamu.
      - Jika ditolak atau dijadwalkan ulang, sampaikan permohonan maaf dengan halus.
      - Pesan harus ringkas.
    `;

    try {
      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL_FLASH,
        contents: prompt,
      });
      return response.text || "Maaf, gagal men-generate pesan.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Terjadi kesalahan saat menghubungi AI Assistant. Pastikan Kuota API mencukupi atau Key valid.";
    }
  },

  /**
   * Menganalisis tren data janji temu untuk dashboard admin.
   */
  async analyzeTrends(appointmentsJson: string): Promise<string> {
    const activeKey = getApiKey();
    if (!activeKey) {
      return "Analisis tidak tersedia (API Key belum dikonfigurasi di .env).";
    }

    const aiClient = new GoogleGenAI({ apiKey: activeKey });

    const prompt = `
      Berikut adalah data janji temu dalam format JSON:
      ${appointmentsJson}

      Berikan analisis singkat (maksimal 3 poin) tentang tren kunjungan, 
      seperti jam paling sibuk atau tujuan paling populer.
    `;

    try {
      const response = await aiClient.models.generateContent({
        model: GEMINI_MODEL_FLASH,
        contents: prompt,
      });
      return response.text || "Tidak ada analisis tersedia.";
    } catch (error) {
      console.error("Trend Analysis Error:", error);
      return "Gagal menganalisis data.";
    }
  }
};
