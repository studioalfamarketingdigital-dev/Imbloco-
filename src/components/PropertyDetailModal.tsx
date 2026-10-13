import React, { useState } from 'react';
import { Property } from '../types.ts';
import { X, Calendar, Clock, Phone, Mail, User, MapPin, BedDouble, Bath, Square, Car, ChevronLeft, ChevronRight, CheckCircle2, Route } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
}

export default function PropertyDetailModal({ property, onClose }: PropertyDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [notes, setNotes] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientPhone || !visitDate || !visitTime) {
      setSubmitError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          clientName,
          clientEmail,
          clientPhone,
          visitDate,
          visitTime,
          notes,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        // Clear inputs
        setClientName('');
        setClientEmail('');
        setClientPhone('');
        setVisitDate('');
        setVisitTime('');
        setNotes('');
      } else {
        const data = await response.json();
        setSubmitError(data.error || 'Erro ao realizar o agendamento.');
      }
    } catch (err: any) {
      console.error('Error submitting visit schedule:', err);
      setSubmitError('Erro na conexão com o servidor. Tente novamente mais tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 overflow-y-auto backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-orange-600 text-white p-2.5 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left/Top Content: Images Gallery */}
        <div className="w-full lg:w-3/5 bg-gray-900 flex flex-col justify-between overflow-hidden h-[35vh] sm:h-[45vh] lg:h-auto">
          {/* Main Display Image */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden group">
            <img
              src={property.images[activeImageIndex]}
              alt={`${property.title} - ${activeImageIndex + 1}`}
              className="w-full h-full object-cover select-none"
            />
            
            {/* Gallery controls if multiple images */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-orange-600/80 text-white p-2 rounded-full transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-orange-600/80 text-white p-2 rounded-full transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Photo Index Indicator */}
            <span className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-mono px-2.5 py-1 rounded-md">
              {activeImageIndex + 1} / {property.images.length}
            </span>
          </div>

          {/* Image Thumbnails Row */}
          {property.images.length > 1 && (
            <div className="p-4 bg-black/90 border-t border-gray-800 flex gap-2 overflow-x-auto scrollbar-thin">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 transition-all cursor-pointer ${
                    activeImageIndex === idx ? 'ring-2 ring-orange-500 scale-95' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right/Bottom Content: Details & Scheduling Form */}
        <div className="w-full lg:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[55vh] lg:max-h-[90vh]">
          {/* Header specifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                {property.status}
              </span>
              <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                {property.type}
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-black font-sans leading-tight">
              {property.title}
            </h2>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{property.address} - {property.neighborhood}, {property.city}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
              >
                <Route className="w-3.5 h-3.5" />
                <span>Traçar Rota no Mapa</span>
              </button>
            </div>

            <p className="text-2xl font-extrabold text-orange-600">
              {property.status === 'Aluguel' ? `R$ ${property.price.toLocaleString('pt-BR')}/mês` : `R$ ${property.price.toLocaleString('pt-BR')}`}
            </p>

            {/* Specifications metrics */}
            <div className="grid grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 text-center text-xs">
              <div>
                <BedDouble className="w-4 h-4 text-gray-400 mx-auto mb-0.5" />
                <p className="text-black font-bold">{property.bedrooms}</p>
                <p className="text-gray-400 text-[10px]">Quartos</p>
              </div>
              <div>
                <Bath className="w-4 h-4 text-gray-400 mx-auto mb-0.5" />
                <p className="text-black font-bold">{property.bathrooms}</p>
                <p className="text-gray-400 text-[10px]">Banheiros</p>
              </div>
              <div>
                <Square className="w-4 h-4 text-gray-400 mx-auto mb-0.5" />
                <p className="text-black font-bold">{property.area} m²</p>
                <p className="text-gray-400 text-[10px]">Área Útil</p>
              </div>
              <div>
                <Car className="w-4 h-4 text-gray-400 mx-auto mb-0.5" />
                <p className="text-black font-bold">{property.parkingSpots}</p>
                <p className="text-gray-400 text-[10px]">Vagas</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider">Descrição</h4>
              <p className="text-gray-600 text-sm font-light leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          </div>

          {/* Visit Schedule Interactive Form */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-orange-500" /> Agendar Visita com Corretor
            </h3>

            <AnimatePresence mode="wait">
              {submitSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-green-50 border border-green-200 p-5 rounded-xl text-center space-y-2"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                  <p className="text-sm font-bold text-green-800">Solicitação Enviada!</p>
                  <p className="text-xs text-green-700 font-light leading-relaxed">
                    Seu agendamento foi encaminhado com sucesso. Um de nossos corretores entrará em contato para confirmar a visita.
                  </p>
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="text-xs bg-black text-white hover:bg-orange-600 px-4 py-1.5 rounded-lg font-medium cursor-pointer transition-colors mt-2"
                  >
                    Novo Agendamento
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 1 }}
                  onSubmit={handleSubmitSchedule}
                  className="space-y-3"
                >
                  {submitError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                      {submitError}
                    </div>
                  )}

                  {/* Name field */}
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Seu Nome Completo *"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>

                  {/* Contact Grid (Email & Phone) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="email"
                        placeholder="E-mail *"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="Telefone/WhatsApp *"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Date & Time Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        required
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600"
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <input
                        type="time"
                        required
                        value={visitTime}
                        onChange={(e) => setVisitTime(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600"
                      />
                    </div>
                  </div>

                  {/* Notes message */}
                  <textarea
                    placeholder="Deseja deixar alguma observação para o corretor? (Opcional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs h-16 resize-none"
                  />

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-orange-400 text-white py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors uppercase tracking-wider text-center"
                  >
                    {submitting ? 'Enviando...' : 'Confirmar Agendamento'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
