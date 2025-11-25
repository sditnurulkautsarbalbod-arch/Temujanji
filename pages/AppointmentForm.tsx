
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_STAFF, TIME_SLOTS } from '../constants';
import { StaffType } from '../types';
import { databaseService } from '../services/databaseService';
import { Loader2, Send, CheckCircle, Upload, X, FileText } from 'lucide-react';

const AppointmentForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    guestName: '',
    guestWhatsapp: '',
    guestEmail: '',
    targetType: StaffType.TEACHER,
    targetStaffId: '',
    date: '',
    time: '',
    reason: ''
  });
  
  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Derived State
  const availableStaff = MOCK_STAFF.filter(s => s.type === formData.targetType);

  // Filtered Time Slots based on day
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>(TIME_SLOTS);

  useEffect(() => {
    // Reset specific staff selection when type changes
    setFormData(prev => ({ ...prev, targetStaffId: '' }));
  }, [formData.targetType]);

  useEffect(() => {
    if (formData.date) {
      const dateObj = new Date(formData.date);
      const day = dateObj.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday

      // Jika Jumat, batasi jam sampai jam 10:00
      if (day === 5) {
        setAvailableTimeSlots(TIME_SLOTS.filter(t => t <= "10:00"));
      } else {
        setAvailableTimeSlots(TIME_SLOTS);
      }
    }
  }, [formData.date]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // VALIDASI UKURAN FILE: SEKARANG 10 MB
      if (file.size > 10 * 1024 * 1024) {
        setError("Ukuran file terlalu besar. Maksimal 10MB.");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  // Helper convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Validations
    const selectedDate = new Date(formData.date);
    const day = selectedDate.getDay();
    
    // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      setError("Mohon maaf, sekolah libur pada hari Sabtu & Ahad.");
      setLoading(false);
      return;
    }

    const selectedStaff = MOCK_STAFF.find(s => s.id === formData.targetStaffId);
    
    try {
      let fileData = undefined;
      
      if (selectedFile) {
        fileData = await fileToBase64(selectedFile);
      }

      await databaseService.createAppointment({
        guestName: formData.guestName,
        guestWhatsapp: formData.guestWhatsapp,
        // Kirim undefined jika string kosong agar lebih rapi di database
        guestEmail: formData.guestEmail.trim() === '' ? undefined : formData.guestEmail,
        targetType: formData.targetType,
        targetStaffId: formData.targetStaffId,
        targetStaffName: selectedStaff?.name || 'Unknown',
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        attachmentName: selectedFile ? selectedFile.name : undefined,
        fileData: fileData, // Kirim base64 string
        mimeType: selectedFile?.type
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat menyimpan data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Permohonan Terkirim!</h2>
          <p className="text-slate-600 mb-6">
            Data Anda telah tersimpan di sistem kami. Mohon tunggu konfirmasi melalui WhatsApp dari admin sekolah.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-emerald-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Formulir Janji Temu</h2>
          <p className="text-emerald-100 text-sm">Silakan lengkapi data di bawah ini</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="Contoh: Budi Santoso"
                value={formData.guestName}
                onChange={e => setFormData({...formData, guestName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp</label>
              <input
                type="tel"
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="0812..."
                value={formData.guestWhatsapp}
                onChange={e => setFormData({...formData, guestWhatsapp: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email (Opsional)</label>
            <input
              type="email"
              // Tidak ada atribut required disini, jadi boleh kosong
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="nama@email.com"
              value={formData.guestEmail}
              onChange={e => setFormData({...formData, guestEmail: e.target.value})}
            />
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Detail Kunjungan</h3>
            
            <div className="grid md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tujuan Bertemu</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  value={formData.targetType}
                  onChange={e => setFormData({...formData, targetType: e.target.value as StaffType})}
                >
                  {Object.values(StaffType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Tujuan</label>
                <select
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white disabled:bg-slate-100"
                  value={formData.targetStaffId}
                  onChange={e => setFormData({...formData, targetStaffId: e.target.value})}
                  disabled={availableStaff.length === 0}
                >
                  <option value="">-- Pilih Nama --</option>
                  {availableStaff.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} {staff.position ? `(${staff.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Rencana</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
                <p className="text-xs text-slate-400 mt-1">Sabtu & Ahad Libur</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jam</label>
                <select
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                >
                  <option value="">-- Pilih Jam --</option>
                  {availableTimeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Keperluan / Alasan</label>
              <textarea
                required
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Jelaskan secara singkat keperluan Anda..."
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
              ></textarea>
            </div>

            {/* Upload File Section */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Upload Berkas / Surat / Proposal (Opsional)
              </label>
              
              {!selectedFile ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:bg-slate-50 transition-colors relative">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none"
                      >
                        <span>Upload file</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                        />
                      </label>
                      <p className="pl-1">atau drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      PDF, DOCX, JPG up to 10MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between p-4 border border-emerald-200 bg-emerald-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-100 p-2 rounded">
                      <FileText className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
              {loading ? 'Mengirim...' : 'Kirim Permohonan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
