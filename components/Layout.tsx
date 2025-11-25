import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, School, ShieldCheck, CalendarDays, LogIn } from 'lucide-react';
import { APP_NAME } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isAdmin = location.pathname.includes('/admin');

  const navLinks = isAdmin ? [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <ShieldCheck size={18} /> },
    { name: 'Keluar', path: '/', icon: <LogIn size={18} /> },
  ] : [
    { name: 'Beranda', path: '/', icon: <School size={18} /> },
    { name: 'Buat Janji', path: '/book', icon: <CalendarDays size={18} /> },
    { name: 'Login Admin', path: '/login', icon: <ShieldCheck size={18} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <nav className="bg-emerald-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1.5 rounded-full">
                <School className="text-emerald-600" size={24} />
              </div>
              <span className="font-bold text-lg tracking-tight">{APP_NAME}</span>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-500 transition-colors"
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md hover:bg-emerald-500 focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-emerald-700">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium hover:bg-emerald-500"
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-slate-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-semibold text-lg mb-2">{APP_NAME}</p>
          <p className="text-slate-400 text-sm">
            Mencetak Generasi Qur'ani, Cerdas, dan Berkarakter.
          </p>
          <div className="mt-4 text-xs text-slate-500">
            &copy; {new Date().getFullYear()} SD IT Nurul Kautsar. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;