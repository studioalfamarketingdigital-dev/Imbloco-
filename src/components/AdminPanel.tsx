import React, { useState, useEffect, useRef } from 'react';
import { Property, Schedule, Lead, ChatMessage, ChatSession } from '../types.ts';
import { LayoutDashboard, Home, Calendar, Users, MessageSquare, Plus, Trash2, Edit3, Check, X, LogOut, Send, PlusCircle, Sparkles, ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  onClose: () => void;
  adminToken: string;
  onLogout: () => void;
  properties: Property[];
  onRefreshProperties: () => void;
}

export default function AdminPanel({ onClose, adminToken, onLogout, properties, onRefreshProperties }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'schedules' | 'leads' | 'chats'>('properties');
  
  // Lists
  const [schedulesList, setSchedulesList] = useState<Schedule[]>([]);
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [chatsList, setChatsList] = useState<ChatSession[]>([]);

  // Selected Chat Session details
  const [selectedChatSession, setSelectedChatSession] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [chatReply, setChatReply] = useState('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Property form state (for Adding / Editing)
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formType, setFormType] = useState('Apartamento');
  const [formStatus, setFormStatus] = useState('Venda');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('São Paulo');
  const [formNeighborhood, setFormNeighborhood] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');
  const [formBedrooms, setFormBedrooms] = useState('2');
  const [formBathrooms, setFormBathrooms] = useState('2');
  const [formArea, setFormArea] = useState('');
  const [formParkingSpots, setFormParkingSpots] = useState('1');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);

  // Status/Logs
  const [loading, setLoading] = useState(false);
  const [errorLog, setErrorLog] = useState('');
  const [successLog, setSuccessLog] = useState('');

  // Fetch admin resources on load or tab change
  useEffect(() => {
    fetchSchedules();
    fetchLeads();
    fetchChats();
  }, [activeTab]);

  // Periodic active chat messages polling
  useEffect(() => {
    if (!selectedChatSession) return;

    const pollSelectedChat = async () => {
      try {
        const res = await fetch(`/api/chat/${selectedChatSession}`);
        if (res.ok) {
          const data = await res.json();
          setActiveChatMessages(data);
        }
      } catch (err) {
        console.error('Error polling chat:', err);
      }
    };

    pollSelectedChat();
    const interval = setInterval(pollSelectedChat, 3000);

    return () => clearInterval(interval);
  }, [selectedChatSession]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages]);

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/schedules', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSchedulesList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeadsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/admin/chats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Property actions
  const handleEditClick = (prop: Property) => {
    setEditingPropertyId(prop.id);
    setFormTitle(prop.title);
    setFormDescription(prop.description);
    setFormPrice(prop.price.toString());
    setFormType(prop.type);
    setFormStatus(prop.status);
    setFormAddress(prop.address);
    setFormCity(prop.city);
    setFormNeighborhood(prop.neighborhood);
    setFormLatitude(prop.latitude.toString());
    setFormLongitude(prop.longitude.toString());
    setFormBedrooms(prop.bedrooms.toString());
    setFormBathrooms(prop.bathrooms.toString());
    setFormArea(prop.area.toString());
    setFormParkingSpots(prop.parkingSpots.toString());
    setFormImages(prop.images);
    setFormFeatured(prop.featured);
    setShowPropertyForm(true);
  };

  const handleAddNewClick = () => {
    setEditingPropertyId(null);
    setFormTitle('');
    setFormDescription('');
    setFormPrice('');
    setFormType('Apartamento');
    setFormStatus('Venda');
    setFormAddress('');
    setFormCity('São Paulo');
    setFormNeighborhood('');
    setFormLatitude('-23.5505'); // default center roughly SP
    setFormLongitude('-46.6333');
    setFormBedrooms('2');
    setFormBathrooms('2');
    setFormArea('');
    setFormParkingSpots('1');
    setFormImages([
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80"
    ]); // high-quality placeholder defaults
    setFormFeatured(false);
    setShowPropertyForm(true);
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormImages([...formImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages(formImages.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSavePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDescription || !formPrice || !formAddress || !formNeighborhood || !formArea) {
      setErrorLog('Preencha os campos obrigatórios marcados com *.');
      return;
    }

    setLoading(true);
    setErrorLog('');
    setSuccessLog('');

    const payload = {
      title: formTitle,
      description: formDescription,
      price: parseInt(formPrice),
      type: formType,
      status: formStatus,
      address: formAddress,
      city: formCity,
      neighborhood: formNeighborhood,
      latitude: parseFloat(formLatitude || '-23.55'),
      longitude: parseFloat(formLongitude || '-46.63'),
      bedrooms: parseInt(formBedrooms),
      bathrooms: parseInt(formBathrooms),
      area: parseInt(formArea),
      parkingSpots: parseInt(formParkingSpots),
      images: formImages,
      featured: formFeatured
    };

    try {
      const url = editingPropertyId ? `/api/properties/${editingPropertyId}` : '/api/properties';
      const method = editingPropertyId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessLog(editingPropertyId ? 'Propriedade atualizada com sucesso!' : 'Nova propriedade cadastrada com sucesso!');
        setShowPropertyForm(false);
        onRefreshProperties();
      } else {
        const errorData = await res.json();
        setErrorLog(errorData.error || 'Erro ao salvar propriedade no banco.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorLog('Falha na comunicação com o banco.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta propriedade? Todos os agendamentos e leads associados serão afetados.')) return;
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        onRefreshProperties();
      } else {
        alert('Erro ao excluir propriedade.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Schedule status update
  const handleUpdateScheduleStatus = async (id: number, newStatus: 'Confirmado' | 'Cancelado') => {
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchSchedules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lead status update
  const handleUpdateLeadStatus = async (id: number, newStatus: 'Em Atendimento' | 'Concluído') => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Chat actions
  const handleSendChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReply.trim() || !selectedChatSession) return;

    const text = chatReply.trim();
    setChatReply('');

    // Optimistic local update
    const tempMsg: ChatMessage = {
      id: Date.now(),
      sessionId: selectedChatSession,
      senderName: 'Atendente Imbloco',
      message: text,
      isAdmin: true,
      createdAt: new Date().toISOString()
    };
    setActiveChatMessages(prev => [...prev, tempMsg]);

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedChatSession,
          senderName: 'Atendente Imbloco',
          message: text,
          isAdmin: true
        })
      });
    } catch (err) {
      console.error('Error replying to chat:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col font-sans">
      {/* Top Bar Banner with High-Contrast Branding */}
      <header className="bg-black text-white h-16 shrink-0 flex items-center justify-between px-6 border-b border-gray-900 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline font-sans text-2xl font-extrabold tracking-tight">
            <span className="text-orange-600">I</span>
            <span className="text-white">mbloco</span>
          </div>
          <span className="bg-orange-600 text-[10px] text-white font-mono tracking-widest px-2 py-0.5 rounded uppercase font-bold">
            Painel Admin
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-gray-900 px-3.5 py-1.5 rounded-lg border border-gray-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Site
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Deslogar
          </button>
        </div>
      </header>

      {/* Main Admin Section */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side menu bar */}
        <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-4 space-y-2 shrink-0 md:flex md:flex-col justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2.5">Navegação Interna</p>
            {[
              { id: 'properties', label: 'Propriedades / Imóveis', icon: Home },
              { id: 'schedules', label: 'Schedules / Visitas', icon: Calendar },
              { id: 'leads', label: 'Leads / Contatos', icon: Users },
              { id: 'chats', label: 'Atendimento Online', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSelectedChatSession(null);
                  }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* System metadata note (no telemetry overlay larping, just humble note) */}
          <div className="hidden md:block bg-gray-50 rounded-xl p-3.5 border border-gray-100">
            <p className="text-[10px] font-bold text-black uppercase mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-500" /> Acesso Protegido
            </p>
            <p className="text-[10px] text-gray-500 font-light leading-relaxed">
              Você está conectado como Administrador Imbloco. Suas alterações são aplicadas instantaneamente no banco de dados.
            </p>
          </div>
        </aside>

        {/* Dynamic content viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <AnimatePresence mode="wait">
            {/* TABS: PROPERTIES */}
            {activeTab === 'properties' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Header operations row */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-extrabold text-black tracking-tight">Gestão de Propriedades</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Cadastre, edite e remova os imóveis do site principal.</p>
                  </div>
                  <button
                    onClick={handleAddNewClick}
                    className="flex items-center gap-1.5 bg-black hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-md"
                  >
                    <PlusCircle className="w-4 h-4" /> Cadastrar Imóvel
                  </button>
                </div>

                {/* Form edit modal container */}
                {showPropertyForm && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl space-y-4">
                    <h4 className="text-sm font-extrabold text-black uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center gap-1.5">
                      <Sparkles className="w-4.5 h-4.5 text-orange-500" />
                      {editingPropertyId ? `Editar Imóvel #${editingPropertyId}` : 'Cadastrar Novo Imóvel'}
                    </h4>

                    {errorLog && (
                      <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                        {errorLog}
                      </div>
                    )}

                    <form onSubmit={handleSavePropertySubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Título do Imóvel *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Cobertura Duplex Jardins"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>

                        {/* Price & Status */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Preço (R$) *</label>
                            <input
                              type="number"
                              required
                              placeholder="Ex: 850000"
                              value={formPrice}
                              onChange={(e) => setFormPrice(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
                            <select
                              value={formStatus}
                              onChange={(e) => setFormStatus(e.target.value)}
                              className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs"
                            >
                              <option value="Venda">Venda</option>
                              <option value="Aluguel">Aluguel</option>
                              <option value="Lançamento">Lançamento</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Descrição Detalhada *</label>
                        <textarea
                          required
                          placeholder="Fale detalhadamente sobre o imóvel, diferenciais, diferenciais construtivos Imbloco, infraestrutura, etc."
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-lg text-xs h-24"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Type, Area, Parking */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Tipo de Imóvel</label>
                          <select
                            value={formType}
                            onChange={(e) => setFormType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          >
                            <option value="Apartamento">Apartamento</option>
                            <option value="Casa">Casa</option>
                            <option value="Cobertura">Cobertura</option>
                            <option value="Terreno">Terreno</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Área Útil (m²) *</label>
                          <input
                            type="number"
                            required
                            placeholder="Ex: 120"
                            value={formArea}
                            onChange={(e) => setFormArea(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Vagas Garagem</label>
                          <input
                            type="number"
                            required
                            placeholder="Ex: 2"
                            value={formParkingSpots}
                            onChange={(e) => setFormParkingSpots(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Bedrooms, Bathrooms, Lat, Lng */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Dormitórios</label>
                          <input
                            type="number"
                            required
                            value={formBedrooms}
                            onChange={(e) => setFormBedrooms(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Banheiros</label>
                          <input
                            type="number"
                            required
                            value={formBathrooms}
                            onChange={(e) => setFormBathrooms(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Latitude (Mapa) *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: -23.5671"
                            value={formLatitude}
                            onChange={(e) => setFormLatitude(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Longitude (Mapa) *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: -46.6853"
                            value={formLongitude}
                            onChange={(e) => setFormLongitude(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Address specifications */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-500 mb-1">Endereço Completo *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Alameda Lorena, 1500"
                            value={formAddress}
                            onChange={(e) => setFormAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Bairro *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Jardins"
                            value={formNeighborhood}
                            onChange={(e) => setFormNeighborhood(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      {/* Photo galleries inputs */}
                      <div className="space-y-2.5">
                        <label className="block text-xs font-bold text-gray-500">Galeria de Imagens (URLs de fotos de alta qualidade)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Cole a URL da imagem Unsplash..."
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddImage}
                            className="bg-black hover:bg-orange-600 text-white text-xs px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
                          >
                            Adicionar URL
                          </button>
                        </div>

                        {/* Thumbnails list preview */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
                          {formImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors cursor-pointer"
                                title="Remover"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Featured Checkbox toggle */}
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="formFeatured"
                          checked={formFeatured}
                          onChange={(e) => setFormFeatured(e.target.checked)}
                          className="w-4 h-4 border border-gray-300 rounded text-orange-600 focus:ring-orange-500"
                        />
                        <label htmlFor="formFeatured" className="text-xs font-bold text-gray-700 cursor-pointer">
                          Destacar Imóvel na página inicial (Destaques Imbloco)
                        </label>
                      </div>

                      {/* Form action buttons */}
                      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setShowPropertyForm(false)}
                          className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:text-black rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider cursor-pointer"
                        >
                          {loading ? 'Salvando...' : 'Salvar Propriedade'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Properties grid table display */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Capa</th>
                        <th className="px-6 py-4">Imóvel</th>
                        <th className="px-6 py-4">Preço</th>
                        <th className="px-6 py-4">Status / Tipo</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {properties.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                              <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-black">{p.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{p.neighborhood}, {p.city}</p>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-orange-600">
                            R$ {p.price.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="bg-black text-white px-1.5 py-0.5 rounded-xs font-semibold text-[9px] uppercase tracking-wider">{p.status}</span>
                              <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-xs font-semibold text-[9px] uppercase tracking-wider">{p.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleEditClick(p)}
                              className="inline-flex items-center gap-1 bg-gray-100 hover:bg-orange-100 hover:text-orange-800 text-gray-700 px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Editar
                            </button>
                            <button
                              onClick={() => handleDeleteProperty(p.id)}
                              className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TABS: VISIT SCHEDULE BOOKINGS */}
            {activeTab === 'schedules' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-extrabold text-black tracking-tight">Schedules / Agendamento de Visitas</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Veja as solicitações enviadas pelos clientes para corretores.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {schedulesList.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center text-gray-400">
                      Nenhum agendamento de visita cadastrado até o momento.
                    </div>
                  ) : (
                    schedulesList.map((sch) => (
                      <div key={sch.id} className="bg-white rounded-2xl p-5 border border-gray-200 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center shadow-xs">
                        {/* Client details info */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-black">{sch.clientName}</span>
                            <span className="text-[9px] text-gray-400 font-mono">• ID: #{sch.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              sch.status === 'Confirmado' ? 'bg-green-100 text-green-800' :
                              sch.status === 'Cancelado' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {sch.status}
                            </span>
                          </div>

                          <div className="text-[11px] text-gray-500 font-medium space-x-4">
                            <span>E-mail: <b>{sch.clientEmail}</b></span>
                            <span>Tel: <b>{sch.clientPhone}</b></span>
                          </div>

                          <div className="text-xs text-black font-semibold pt-1 border-t border-gray-55 flex items-center gap-1.5">
                            <span>Imóvel solicitado:</span>
                            <span className="text-orange-600 font-bold">{sch.property?.title} ({sch.property?.neighborhood})</span>
                          </div>

                          <div className="text-[11px] bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-gray-600 leading-relaxed font-light mt-1">
                            <p className="text-[10px] font-bold text-black uppercase mb-0.5">Observações:</p>
                            {sch.notes || 'Nenhuma observação informada.'}
                          </div>
                        </div>

                        {/* Date/Time indicator and status updates */}
                        <div className="flex flex-col md:items-end gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-xs font-bold text-black">Data/Hora de Visita:</p>
                            <p className="text-sm font-extrabold text-orange-600 mt-0.5">{sch.visitDate} às {sch.visitTime}</p>
                          </div>

                          {sch.status === 'Pendente' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateScheduleStatus(sch.id, 'Confirmado')}
                                className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors uppercase tracking-wider"
                              >
                                <Check className="w-3.5 h-3.5" /> Confirmar
                              </button>
                              <button
                                onClick={() => handleUpdateScheduleStatus(sch.id, 'Cancelado')}
                                className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors uppercase tracking-wider"
                              >
                                <X className="w-3.5 h-3.5" /> Recusar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* TABS: LEADS */}
            {activeTab === 'leads' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-extrabold text-black tracking-tight">Leads / Gestão de Contatos</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Veja as mensagens de interesse enviadas por potenciais compradores.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leadsList.length === 0 ? (
                    <div className="col-span-2 bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center text-gray-400">
                      Nenhum contato enviado pelos formulários até o momento.
                    </div>
                  ) : (
                    leadsList.map((lead) => (
                      <div key={lead.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-black">{lead.clientName}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              lead.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                              lead.status === 'Em Atendimento' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {lead.status}
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-500 space-y-0.5 font-medium">
                            <p>E-mail: <b>{lead.clientEmail}</b></p>
                            <p>Celular: <b>{lead.clientPhone}</b></p>
                          </div>

                          <p className="text-xs bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-600 font-light mt-2 leading-relaxed">
                            {lead.message}
                          </p>
                        </div>

                        {/* Actions */}
                        {lead.status !== 'Concluído' && (
                          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-1.5">
                            {lead.status === 'Novo' && (
                              <button
                                onClick={() => handleUpdateLeadStatus(lead.id, 'Em Atendimento')}
                                className="text-[10px] bg-black text-white hover:bg-orange-600 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Atender Lead
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateLeadStatus(lead.id, 'Concluído')}
                              className="text-[10px] bg-green-600 text-white hover:bg-green-700 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Finalizar / Concluir
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* TABS: CHAT ONLINE CHANNELS */}
            {activeTab === 'chats' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="h-[550px] flex flex-col md:flex-row rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm"
              >
                {/* Left side: sessions list */}
                <div className="w-full md:w-80 border-r border-gray-200 flex flex-col bg-white">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h4 className="text-xs font-bold text-black uppercase tracking-wider">Conversas de Suporte</h4>
                    <p className="text-[10px] text-gray-500">Selecione uma sessão ativa para responder ao cliente.</p>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {chatsList.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-xs font-light">
                        Nenhum visitante ativo no chat no momento.
                      </div>
                    ) : (
                      chatsList.map((chat) => (
                        <button
                          key={chat.sessionId}
                          onClick={() => setSelectedChatSession(chat.sessionId)}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between cursor-pointer ${
                            selectedChatSession === chat.sessionId ? 'bg-orange-50/70 border-l-4 border-orange-500' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-xs font-bold text-black truncate">{chat.senderName}</p>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">{chat.lastMessage}</p>
                          </div>
                          <span className="text-[9px] text-gray-400 font-mono shrink-0">
                            {new Date(chat.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Right side: messages conversation area */}
                <div className="flex-1 flex flex-col bg-gray-50 h-full justify-between">
                  {selectedChatSession ? (
                    <>
                      {/* Active conversation header */}
                      <div className="bg-white p-4 border-b border-gray-200 shrink-0">
                        <p className="text-xs font-bold text-black">
                          Sessão Ativa: {chatsList.find(c => c.sessionId === selectedChatSession)?.senderName || 'Visitante'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">Sessão ID: {selectedChatSession}</p>
                      </div>

                      {/* Messaging history viewport */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {activeChatMessages.map((msg, idx) => {
                          const isAdmin = msg.isAdmin;
                          return (
                            <div key={msg.id || idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                              <span className="text-[8px] text-gray-400 font-bold mb-0.5 px-1">{msg.senderName}</span>
                              <div className={`max-w-[80%] px-3.5 py-2 rounded-xl text-xs ${
                                isAdmin ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-xs'
                              }`}>
                                {msg.message}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatMessagesEndRef} />
                      </div>

                      {/* Reply input field */}
                      <form onSubmit={handleSendChatReply} className="p-3 bg-white border-t border-gray-200 flex gap-2 shrink-0">
                        <input
                          type="text"
                          required
                          placeholder="Digite sua resposta administrativa..."
                          value={chatReply}
                          onChange={(e) => setChatReply(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-black focus:outline-hidden focus:border-orange-500"
                        />
                        <button
                          type="submit"
                          className="bg-black hover:bg-orange-600 text-white p-2.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-2">
                      <MessageSquare className="w-12 h-12 text-gray-300" />
                      <div>
                        <p className="text-xs font-bold text-black uppercase tracking-wider">Nenhuma conversa selecionada</p>
                        <p className="text-xs text-gray-400 font-light mt-0.5">Clique em uma sessão na lateral para iniciar o diálogo.</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
