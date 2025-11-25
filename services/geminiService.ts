import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_FLASH } from "../constants";

// WARNING: In a production environment, API keys should be handled via a backend proxy 
// to avoid exposing them in client-side code. 
// For this demo, we assume process.env.API_KEY is available or the user will provide it.

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const geminiService = {
  /**
   * Generates a polite WhatsApp message for the admin to send to the guest
   * based on the status update (e.g., Rejection, Reschedule).
   */
  async generateResponseDraft(
    guestName: string,
    status: string,
    reason: string,
    notes: string
  ): Promise<string> {
    if (!apiKey) return "API Key not configured. Please add process.env.API_KEY.";

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
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL_FLASH,
        contents: prompt,
      });
      return response.text || "Maaf, gagal men-generate pesan.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Terjadi kesalahan saat menghubungi AI Assistant.";
    }
  },

  /**
   * Analyzes appointment trends for the admin dashboard summary.
   */
  async analyzeTrends(appointmentsJson: string): Promise<string> {
    if (!apiKey) return "API Key missing.";

    const prompt = `
      Berikut adalah data janji temu dalam format JSON:
      ${appointmentsJson}

      Berikan analisis singkat (maksimal 3 poin) tentang tren kunjungan, 
      seperti jam paling sibuk atau tujuan paling populer.
    `;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL_FLASH,
        contents: prompt,
      });
      return response.text || "Tidak ada analisis tersedia.";
    } catch (error) {
      return "Gagal menganalisis data.";
    }
  }
};