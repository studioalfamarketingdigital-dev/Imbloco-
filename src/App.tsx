import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.tsx';
import Hero from './components/Hero.tsx';
import PropertiesGrid from './components/PropertiesGrid.tsx';
import PropertyDetailModal from './components/PropertyDetailModal.tsx';
import InteractiveMap from './components/InteractiveMap.tsx';
import ContactSection from './components/ContactSection.tsx';
import OnlineChat from './components/OnlineChat.tsx';
import Footer from './components/Footer.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import { Property } from './types.ts';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Phone, Mail, Clock, ArrowRight, Check } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [properties, setProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Admin Panel states
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Available unique options for filtering
  const propertyTypes = ['Apartamento', 'Casa', 'Cobertura', 'Terreno'];
  const propertyStatuses = ['Venda', 'Aluguel', 'Lançamento'];

  // Load properties initially
  const fetchProperties = async (filters: any = {}) => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'Todos') params.append('status', filters.status);
      if (filters.type && filters.type !== 'Todos') params.append('type', filters.type);
      if (filters.bedrooms && filters.bedrooms !== 'Todos') params.append('bedrooms', filters.bedrooms);
      if (filters.bathrooms && filters.bathrooms !== 'Todos') params.append('bathrooms', filters.bathrooms);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

      const response = await fetch(`/api/properties?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (err) {
      console.error('Error fetching properties from API:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const response = await fetch('/api/properties?featured=true');
      if (response.ok) {
        const data = await response.json();
        setFeaturedProperties(data);
      }
    } catch (err) {
      console.error('Error fetching featured properties:', err);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchFeatured();

    // Check for saved admin session
    const savedToken = localStorage.getItem('imbloco-admin-token');
    if (savedToken) {
      setAdminToken(savedToken);
    }
  }, []);

  const handleAdminLoginSuccess = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('imbloco-admin-token', token);
    setShowAdminPanel(true);
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setShowAdminPanel(false);
    localStorage.removeItem('imbloco-admin-token');
  };

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    
    // Smooth scrolling to section if it is on the page
    setTimeout(() => {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (sectionId === 'properties') {
        const el = document.getElementById('properties-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      } else if (sectionId === 'map') {
        const el = document.getElementById('map-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      } else if (sectionId === 'contact') {
        const el = document.getElementById('contact-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-orange-500 selection:text-white flex flex-col justify-between">
      {/* Header and Brand Logo */}
      <Navbar
        onNavigate={handleNavigate}
        activeSection={activeSection}
        onOpenAdmin={() => setShowAdminPanel(true)}
        isAdminLoggedIn={!!adminToken}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Main Multi-Screen Content Flow */}
      <main className="flex-1">
        {/* HERO BANNER SECTION (includes advanced filters) */}
        <section id="hero-section">
          <Hero
            onSearch={fetchProperties}
            propertyTypes={propertyTypes}
            propertyStatuses={propertyStatuses}
          />
        </section>

        {/* FEATURED RIBBON / SLIDER - High Contrast Modern Banner */}
        {featuredProperties.length > 0 && (
          <section className="bg-orange-600 text-white py-12 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-4 space-y-2">
                <span className="text-black text-[10px] font-bold font-mono tracking-widest uppercase bg-white px-2 py-0.5 rounded">
                  Destaques Imbloco
                </span>
                <h3 className="text-2xl font-extrabold tracking-tight">Oportunidades de Alto Padrão</h3>
                <p className="text-orange-100 text-xs font-light leading-relaxed">
                  Confira as unidades mais procuradas da construtora com diferenciais construtivos premium.
                </p>
              </div>

              <div className="lg:col-span-8 flex gap-4 overflow-x-auto pb-2 scrollbar-thin snap-x">
                {featuredProperties.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProperty(p)}
                    className="w-72 bg-black rounded-xl p-3 shrink-0 snap-start border border-orange-500/30 cursor-pointer hover:border-white transition-all flex gap-3"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-900">
                      <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                      <p className="text-[10px] text-gray-400 font-medium truncate">{p.neighborhood}</p>
                      <p className="text-xs font-bold text-orange-400 mt-1">R$ {p.price.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PROPERTIES GRID SHOWCASE */}
        <section id="properties-section" className="border-b border-gray-100 scroll-mt-20">
          <PropertiesGrid
            properties={properties}
            onSelectProperty={setSelectedProperty}
            loading={loading}
          />
        </section>

        {/* MAP SHOWCASE */}
        <section id="map-section" className="bg-gray-50 border-b border-gray-100 scroll-mt-20">
          <InteractiveMap
            properties={properties}
            onSelectProperty={setSelectedProperty}
          />
        </section>

        {/* HUMANIZED STORY BANNER - Construtora Imbloco Quality Philosophy */}
        <section className="bg-white py-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image stack */}
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80"
                alt="Família feliz no imóvel novo Imbloco"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <span className="bg-orange-600 text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                  Padrão Imbloco
                </span>
                <p className="text-white text-base font-bold mt-1.5">"Nossa maior conquista é a sua felicidade."</p>
              </div>
            </div>

            {/* Content text description */}
            <div className="space-y-6">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Qualidade e Compromisso</span>
              <h3 className="text-3xl font-extrabold text-black font-sans tracking-tight leading-tight">
                A Construtora que entrega solidez e inovação real
              </h3>
              <p className="text-gray-500 font-light leading-relaxed text-sm">
                Com mais de 15 anos no mercado de incorporação paulista, a Imbloco Construtora destaca-se pelo rigor na engenharia, cumprimento estrito de prazos de entrega e projetos inteligentes com foco em sustentabilidade.
              </p>

              {/* Value list items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
                {[
                  'Auditoria técnica independente',
                  '100% de obras entregues no prazo',
                  'Materiais ecológicos e eficientes',
                  'Fácil financiamento direto com banco'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="bg-orange-100 text-orange-800 p-1 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-black">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT / INTEREST FORM SECTION */}
        <section id="contact-section" className="scroll-mt-20">
          <ContactSection />
        </section>
      </main>

      {/* FOOTER & HIDDEN ADMIN LOGIN DIALOG */}
      <Footer
        onAdminLoginSuccess={handleAdminLoginSuccess}
        isAdminLoggedIn={!!adminToken}
        onOpenAdminPanel={() => setShowAdminPanel(true)}
      />

      {/* FLOATING REAL-TIME ONLINE CHAT COMPONENT */}
      <OnlineChat />

      {/* PORTALS & MODALS: Dynamic Views overlay */}
      <AnimatePresence>
        {/* Property Detail Modal */}
        {selectedProperty && (
          <PropertyDetailModal
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
          />
        )}

        {/* Administrative Management Portal view overlay */}
        {showAdminPanel && adminToken && (
          <AdminPanel
            adminToken={adminToken}
            onClose={() => setShowAdminPanel(false)}
            onLogout={handleAdminLogout}
            properties={properties}
            onRefreshProperties={() => {
              fetchProperties();
              fetchFeatured();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
