import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, MapPin } from 'lucide-react';
import { SCHOOL_ADDRESS } from '../constants';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-emerald-900 text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://picsum.photos/1920/1080?blur=2" 
            alt="School Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Selamat Datang di <span className="text-yellow-400">SD IT Nurul Kautsar</span>
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
            Sistem Pelayanan Tamu Terpadu. Silakan buat janji temu sebelum berkunjung untuk kenyamanan dan ketertiban bersama.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/book" 
              className="bg-yellow-500 text-emerald-900 hover:bg-yellow-400 font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            >
              <CalendarCheck size={20} />
              Buat Janji Temu
            </Link>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-emerald-500 hover:shadow-lg transition-shadow">
            <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-emerald-600">
              <Clock size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Jam Operasional</h3>
            <p className="text-slate-600">Senin - Kamis: 07:30 - 11:30</p>
            <p className="text-slate-600">Jumat: 07:30 - 10:00</p>
            <p className="text-red-500 text-sm mt-2 font-medium">Sabtu, Ahad & Tanggal Merah Libur</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-emerald-500 hover:shadow-lg transition-shadow">
            <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-emerald-600">
              <MapPin size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Lokasi Sekolah</h3>
            <p className="text-slate-600">{SCHOOL_ADDRESS}</p>
            <a href="https://maps.google.com/?q=SD+IT+Nurul+Kautsar+Makassar" target="_blank" rel="noreferrer" className="text-emerald-600 text-sm font-medium hover:underline mt-2 inline-block">
              Lihat di Google Maps &rarr;
            </a>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-emerald-500 hover:shadow-lg transition-shadow">
            <div className="bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-emerald-600">
              <CalendarCheck size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Alur Kunjungan</h3>
            <ol className="text-slate-600 text-sm space-y-2 list-decimal pl-4">
              <li>Isi formulir janji temu.</li>
              <li>Tunggu konfirmasi WhatsApp/Email.</li>
              <li>Datang sesuai jadwal yang disetujui.</li>
              <li>Tunjukkan bukti janji temu di Pos Satpam.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;