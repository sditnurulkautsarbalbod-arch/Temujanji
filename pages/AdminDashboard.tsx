

import React, { useEffect, useState, useRef } from 'react';
import { databaseService } from '../services/databaseService';
import { geminiService } from '../services/geminiService';
import { Appointment, AppointmentStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  CheckCircle, XCircle, Clock, Calendar, Sparkles, Search, Filter, MoreHorizontal, MessageSquare, Paperclip, Eye, CalendarClock, User, Phone, Mail, FileText, Trash2, ChevronLeft, ChevronRight, AlertTriangle, Send, FilePenLine, ExternalLink, RefreshCw, WifiOff, Database
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'remote' | 'local' | 'cache'>('remote');
  const [mounted, setMounted] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal State
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [aiDraft, setAiDraft] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'RESCHEDULE' | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Dropdown State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && !(event.target as Element).closest('.action-dropdown')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  useEffect(() => {
    setMounted(true);
    // Initial load: Gunakan cache jika ada (forceRefresh = false)
    loadData(false);
  }, []);

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      // Panggil service dengan parameter forceRefresh
      const result = await databaseService.getAppointments(forceRefresh);
      setAppointments(result.data);
      setFilteredAppointments(result.data);
      setDataSource(result.source);
    } catch (e) {
      console.error("Gagal load data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = appointments;
    if (filterStatus !== 'ALL') {
      result = appointments.filter(a => a.status === filterStatus);
    }
    setFilteredAppointments(result);
    setCurrentPage(1); // Reset to first page on filter change
  }, [filterStatus, appointments]);

  // Helper untuk mengubah URL Drive
  const getFileViewUrl = (url?: string) => {
    if (!url) return '';
    const idMatch = url.match(/(?:\/d\/|id=|folders\/)([\w-]+)/);
    const fileId = idMatch ? idMatch[1] : null;

    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/view`;
    }
    return url; 
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  const handleGenerateAI = async () => {
    if (!selectedAppt || !actionType) return;
    setIsGeneratingAI(true);
    const statusText = actionType === 'APPROVE' ? 'Disetujui' : actionType === 'REJECT' ? 'Ditolak' : 'Dijadwalkan Ulang';
    const draft = await geminiService.generateResponseDraft(selectedAppt.guestName, statusText, selectedAppt.reason, actionNote);
    setAiDraft(draft);
    setIsGeneratingAI(false);
  };

  const handleSendToWhatsapp = () => {
    if (!selectedAppt || !aiDraft) return;
    let phone = selectedAppt.guestWhatsapp.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    const encodedMessage = encodeURIComponent(aiDraft);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleConfirmAction = async () => {
    if (!selectedAppt || !actionType) return;
    let newStatus = AppointmentStatus.PENDING;
    if (actionType === 'APPROVE') newStatus = AppointmentStatus.APPROVED;
    if (actionType === 'REJECT') newStatus = AppointmentStatus.REJECTED;
    if (actionType === 'RESCHEDULE') newStatus = AppointmentStatus.RESCHEDULED;
    await databaseService.updateStatus(selectedAppt.id, newStatus, actionNote);
    setActionModalOpen(false);
    setSelectedAppt(null);
    setAiDraft('');
    setActionNote('');
    // Reload dengan force refresh agar perubahan status di sheet terambil kembali
    loadData(true);
  };

  const handleDelete = async () => {
    if (!selectedAppt) return;
    await databaseService.deleteAppointment(selectedAppt.id);
    setDeleteModalOpen(false);
    setSelectedAppt(null);
    loadData(true);
  };

  const openActionModal = (appt: Appointment, type: 'APPROVE' | 'REJECT' | 'RESCHEDULE') => {
    setSelectedAppt(appt);
    setActionType(type);
    setActionModalOpen(true);
    setAiDraft('');
    setActionNote('');
    setActiveDropdown(null);
  };

  const openDetailModal = (appt: Appointment) => {
    setSelectedAppt(appt);
    setDetailModalOpen(true);
    setActiveDropdown(null);
  };

  const openDeleteModal = (appt: Appointment) => {
    setSelectedAppt(appt);
    setDeleteModalOpen(true);
  };

  const statsData = [
    { name: 'Pending', value: appointments.filter(a => a.status === AppointmentStatus.PENDING).length, color: '#f59e0b' },
    { name: 'Disetujui', value: appointments.filter(a => a.status === AppointmentStatus.APPROVED).length, color: '#10b981' },
    { name: 'Ditolak', value: appointments.filter(a => a.status === AppointmentStatus.REJECTED).length, color: '#ef4444' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Admin</h1>
          <p className="text-slate-500">Kelola janji temu dan jadwal kunjungan.</p>
        </div>
        <div>
          <button 
            onClick={() => loadData(true)} // Force Refresh true
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span>Sinkronisasi Data</span>
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wide mb-4">Status Kunjungan</h3>
          <div className="h-40 w-full min-w-0">
             {mounted ? (
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {statsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="w-full h-full bg-slate-50 animate-pulse rounded"></div>
             )}
          </div>
        </div>
        
        <div className="bg-emerald-600 p-6 rounded-xl shadow-md text-white md:col-span-2 flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Selamat Datang, Admin!</h2>
            <p className="text-emerald-100 mb-4">
              Ada <span className="font-bold text-white text-xl">{appointments.filter(a => a.status === AppointmentStatus.PENDING).length}</span> permohonan janji temu baru yang perlu ditinjau hari ini.
            </p>
            <div className="flex items-center gap-3">
              <p className="text-xs text-emerald-200 opacity-80 flex items-center gap-1 bg-emerald-700/50 px-2 py-1 rounded">
                <CheckCircle size={12} /> Database Connected
              </p>
              <p className="text-xs text-emerald-200 opacity-80 flex items-center gap-1 bg-emerald-700/50 px-2 py-1 rounded">
                {dataSource === 'cache' ? <Database size={12} /> : dataSource === 'remote' ? <RefreshCw size={12} /> : <WifiOff size={12} />}
                Source: {dataSource === 'cache' ? 'Cache (Cepat)' : dataSource === 'remote' ? 'Server (Live)' : 'Lokal (Offline)'}
              </p>
            </div>
          </div>
          <Sparkles className="absolute right-4 bottom-4 text-emerald-500 opacity-30 w-32 h-32" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="text-slate-400" size={20} />
          <select 
            className="border-none bg-transparent font-medium focus:ring-0 text-slate-700"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Semua Status</option>
            <option value={AppointmentStatus.PENDING}>Menunggu Konfirmasi</option>
            <option value={AppointmentStatus.APPROVED}>Disetujui</option>
            <option value={AppointmentStatus.REJECTED}>Ditolak</option>
          </select>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama tamu..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Tamu</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Tujuan & Alasan</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Waktu</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                       <RefreshCw className="animate-spin" size={20} /> Memuat data terbaru...
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Tidak ada data janji temu.</td>
                </tr>
              ) : (
                currentItems.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{appt.guestName}</div>
                      <div className="text-xs text-slate-500">{appt.guestWhatsapp}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 font-medium">{appt.targetStaffName}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px] mb-1">{appt.reason}</div>
                      {appt.attachmentName && (
                        <a 
                          href={appt.attachmentUrl ? getFileViewUrl(appt.attachmentUrl) : '#'}
                          target={appt.attachmentUrl ? "_blank" : undefined}
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border transition-colors cursor-pointer
                             ${appt.attachmentUrl 
                                ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:text-blue-800' 
                                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'}
                          `}
                          title={appt.attachmentUrl ? "Klik untuk melihat berkas" : "Link belum tersedia (Coba Refresh)"}
                          onClick={(e) => !appt.attachmentUrl && e.preventDefault()}
                        >
                          <Paperclip size={10} />
                          <span className="truncate max-w-[100px]">{appt.attachmentName}</span>
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-700">
                        <Calendar size={14} /> {appt.date}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <Clock size={14} /> {appt.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${appt.status === AppointmentStatus.APPROVED ? 'bg-emerald-100 text-emerald-800' : 
                          appt.status === AppointmentStatus.REJECTED ? 'bg-red-100 text-red-800' :
                          appt.status === AppointmentStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'}
                      `}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 relative">
                        {appt.status === AppointmentStatus.PENDING && (
                          <>
                            <button 
                              onClick={() => openActionModal(appt, 'APPROVE')}
                              className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Setujui"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => openActionModal(appt, 'REJECT')}
                              className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100" title="Tolak"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        
                        {(appt.status === AppointmentStatus.APPROVED || appt.status === AppointmentStatus.REJECTED) && (
                          <button 
                            onClick={() => openDeleteModal(appt)}
                            className="p-1.5 rounded-md bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50" title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        
                        <div className="relative action-dropdown">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === appt.id ? null : appt.id);
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 active:bg-slate-200"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          
                          {activeDropdown === appt.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-xl border border-slate-100 py-1 text-left z-50">
                              <button 
                                className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                onClick={() => openDetailModal(appt)}
                              >
                                <Eye size={14} /> Lihat Detail
                              </button>
                              <button 
                                className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                onClick={() => openActionModal(appt, 'RESCHEDULE')}
                              >
                                <CalendarClock size={14} /> Jadwalkan Ulang
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Menampilkan <span className="font-medium">{indexOfFirstItem + 1}</span> - <span className="font-medium">{Math.min(indexOfLastItem, filteredAppointments.length)}</span> dari <span className="font-medium">{filteredAppointments.length}</span> data
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-md text-sm font-medium ${
                    currentPage === page 
                      ? 'bg-emerald-600 text-white border border-emerald-600' 
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal & Detail Modal & Delete Modal - CODE REMAINS THE SAME (just reused logic) */}
      {/* Action Modal */}
      {actionModalOpen && selectedAppt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">
                {actionType === 'APPROVE' ? 'Setujui Kunjungan' : actionType === 'REJECT' ? 'Tolak Kunjungan' : 'Jadwal Ulang'}
              </h3>
              <button onClick={() => setActionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {selectedAppt.attachmentName && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm">
                  <Paperclip size={18} />
                  <span>Lampiran: <strong>{selectedAppt.attachmentName}</strong></span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Catatan Tambahan (Akan dimasukkan ke pesan WA)
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                  rows={3}
                  placeholder="Contoh: Silakan datang tepat waktu, atau Maaf bapak sedang rapat dinas..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
                    <Sparkles size={16} />
                    AI Assistant
                  </div>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isGeneratingAI ? 'Drafting...' : 'Buat Pesan WA'}
                  </button>
                </div>
                {aiDraft ? (
                  <>
                    <div className="bg-white p-3 rounded border border-indigo-200 text-sm text-slate-600 whitespace-pre-wrap mb-2">
                      {aiDraft}
                    </div>
                    <button 
                      onClick={handleSendToWhatsapp}
                      className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      <Send size={14} /> Kirim ke WhatsApp
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-indigo-400">
                    Klik tombol di atas untuk membuat draft pesan WhatsApp otomatis menggunakan AI.
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setActionModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-200"
              >
                Batal
              </button>
              <button 
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm
                  ${actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                `}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedAppt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Janji Temu?</h3>
              <p className="text-sm text-slate-600">
                Anda yakin ingin menghapus data janji temu dari <strong>{selectedAppt.guestName}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-200"
              >
                Batal
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModalOpen && selectedAppt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">Detail Janji Temu</h3>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-3 rounded-full">
                  <User className="text-emerald-600" size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Informasi Tamu</h4>
                  <p className="text-lg font-bold text-slate-900">{selectedAppt.guestName}</p>
                  <div className="flex flex-col gap-1 mt-1 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      {selectedAppt.guestWhatsapp}
                    </div>
                    {selectedAppt.guestEmail && (
                       <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" />
                        {selectedAppt.guestEmail}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Tujuan Kunjungan</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="font-medium text-slate-800">{selectedAppt.targetStaffName}</p>
                  <p className="text-sm text-slate-500">{selectedAppt.targetType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Tanggal</h4>
                   <div className="flex items-center gap-2 font-medium text-slate-800">
                     <Calendar size={18} className="text-emerald-500" />
                     {selectedAppt.date}
                   </div>
                </div>
                <div>
                   <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Jam</h4>
                   <div className="flex items-center gap-2 font-medium text-slate-800">
                     <Clock size={18} className="text-emerald-500" />
                     {selectedAppt.time}
                   </div>
                </div>
              </div>

              <div>
                 <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Keperluan / Alasan</h4>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 text-sm whitespace-pre-wrap">
                   {selectedAppt.reason}
                 </div>
              </div>

              {selectedAppt.notes && (
                <div>
                   <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Catatan Admin (Terkirim di WA)</h4>
                   <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-slate-700 text-sm whitespace-pre-wrap flex items-start gap-2">
                     <FilePenLine size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                     <span>{selectedAppt.notes}</span>
                   </div>
                </div>
              )}

              {selectedAppt.attachmentName && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Lampiran Berkas</h4>
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded shadow-sm">
                        <FileText className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">{selectedAppt.attachmentName}</p>
                        <p className="text-xs text-blue-500">Berkas Pendukung</p>
                      </div>
                    </div>
                    {selectedAppt.attachmentUrl ? (
                       <a 
                        href={getFileViewUrl(selectedAppt.attachmentUrl)}
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                       >
                        Lihat Berkas <ExternalLink size={10} />
                       </a>
                    ) : (
                       <span className="text-xs text-slate-400 italic">Link tidak tersedia (Mode Offline)</span>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center border-t border-slate-100 mt-2">
                 <span className="text-xs text-slate-400">Dibuat: {new Date(selectedAppt.createdAt).toLocaleString()}</span>
                 <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                    ${selectedAppt.status === AppointmentStatus.APPROVED ? 'bg-emerald-100 text-emerald-800' : 
                      selectedAppt.status === AppointmentStatus.REJECTED ? 'bg-red-100 text-red-800' :
                      selectedAppt.status === AppointmentStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'}
                  `}>
                    {selectedAppt.status}
                  </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="px-6 py-2 rounded-lg bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
