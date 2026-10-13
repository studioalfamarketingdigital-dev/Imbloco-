import React from 'react';
import { Home, Phone, MapPin, Calendar, MessageSquare, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface NavbarProps {
  onNavigate: (section: string) => void;
  activeSection: string;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
}

export default function Navbar({ onNavigate, activeSection, onOpenAdmin, isAdminLoggedIn, onLogoutAdmin }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Modern Contrast Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="flex items-baseline font-sans text-3xl font-extrabold tracking-tight">
            <span className="text-orange-600">I</span>
            <span className="text-black">mbloco</span>
          </div>
          <div className="hidden sm:block text-[10px] font-mono tracking-widest bg-black text-white px-1.5 py-0.5 rounded ml-2 uppercase">
            Construtora
          </div>
        </div>

        {/* Navigation Menus */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { id: 'home', label: 'Início', icon: Home },
            { id: 'properties', label: 'Imóveis', icon: Home },
            { id: 'map', label: 'Mapa Interativo', icon: MapPin },
            { id: 'contact', label: 'Fale Conosco', icon: Phone },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors relative py-2 ${
                  isActive ? 'text-orange-600' : 'text-gray-600 hover:text-black'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          {isAdminLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                <ShieldAlert className="w-3.5 h-3.5" /> Painel Admin Ativo
              </span>
              <button
                onClick={onLogoutAdmin}
                className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-orange-600 transition-colors font-medium cursor-pointer"
              >
                Sair Painel
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('contact')}
              className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-800 active:bg-gray-900 transition-all shadow-lg cursor-pointer"
            >
              <span>Agendar Visita</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
