import React, { useState } from 'react';
import { Search, Filter, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroProps {
  onSearch: (filters: any) => void;
  propertyTypes: string[];
  propertyStatuses: string[];
}

export default function Hero({ onSearch, propertyTypes, propertyStatuses }: HeroProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('Todos');
  const [type, setType] = useState('Todos');
  const [bedrooms, setBedrooms] = useState('Todos');
  const [bathrooms, setBathrooms] = useState('Todos');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      search: searchTerm,
      status,
      type,
      bedrooms,
      bathrooms,
      minPrice,
      maxPrice
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatus('Todos');
    setType('Todos');
    setBedrooms('Todos');
    setBathrooms('Todos');
    setMinPrice('');
    setMaxPrice('');
    onSearch({});
  };

  return (
    <div className="relative bg-black text-white py-16 lg:py-24 overflow-hidden">
      {/* Background decoration elements */}
      <div className="absolute inset-0 opacity-25">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80"
          alt="Imbloco Construtora Imóvel de Luxo"
          className="w-full h-full object-cover mix-blend-luminosity filter blur-xs"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left column: Headings */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-orange-600/20 border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
          >
            <Sparkles className="w-3.5 h-3.5" /> Solidez, Inovação e Confiança
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-sans font-extrabold tracking-tight leading-tight"
          >
            Construindo o seu <br />
            <span className="text-orange-500">futuro hoje</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-300 text-lg sm:text-xl max-w-2xl font-light"
          >
            Imóveis exclusivos de alto padrão com condições especiais diretamente com a construtora. Encontre seu apartamento, casa ou loft ideal nas melhores localizações de São Paulo.
          </motion.p>

          {/* Seção Humanizada Flutuante */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden sm:flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl max-w-md"
          >
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
              alt="Corretora Imbloco"
              className="w-14 h-14 rounded-full object-cover border-2 border-orange-500"
            />
            <div>
              <p className="text-sm font-semibold text-white">Carla Vasconcellos</p>
              <p className="text-xs text-orange-400">Diretora de Vendas da Imbloco</p>
              <p className="text-xs text-gray-300 mt-1">"Fale conosco diretamente via chat e agende sua visita personalizada."</p>
            </div>
          </motion.div>
        </div>

        {/* Right column: Form - Premium Advanced Filters Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-5"
        >
          <div className="bg-white text-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-black border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
              <span>Encontre seu <span className="text-orange-600">estilo de vida</span></span>
              <span className="text-[10px] text-gray-400 tracking-wider uppercase font-bold">Filtro Construtora</span>
            </h3>

            <form onSubmit={handleSearchSubmit} className="space-y-4">
              {/* Keyword / Address */}
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Localização</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Bairro ou cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black focus:outline-hidden focus:border-orange-500 transition-colors placeholder-gray-300"
                  />
                </div>
              </div>

              {/* Status & Type Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Status do Imóvel</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black focus:outline-hidden focus:border-orange-500 transition-colors"
                  >
                    <option value="Todos">Todos</option>
                    {propertyStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Tipo de Imóvel</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black focus:outline-hidden focus:border-orange-500 transition-colors"
                  >
                    <option value="Todos">Todos</option>
                    {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Advanced Collapsible Section */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  {showAdvanced ? 'Ocultar Filtros Avançados' : 'Mostrar Filtros Avançados'}
                </span>
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 pt-2 border-t border-gray-100 overflow-hidden"
                  >
                    {/* Bedrooms & Bathrooms */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Dormitórios</label>
                        <select
                          value={bedrooms}
                          onChange={(e) => setBedrooms(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black"
                        >
                          <option value="Todos">Todos</option>
                          <option value="1">1+</option>
                          <option value="2">2+</option>
                          <option value="3">3+</option>
                          <option value="4">4+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Banheiros</label>
                        <select
                          value={bathrooms}
                          onChange={(e) => setBedrooms(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black"
                        >
                          <option value="Todos">Todos</option>
                          <option value="1">1+</option>
                          <option value="2">2+</option>
                          <option value="3">3+</option>
                          <option value="4">4+</option>
                        </select>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Preço Mínimo (R$)</label>
                        <input
                          type="number"
                          placeholder="Mínimo"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Preço Máximo (R$)</label>
                        <input
                          type="number"
                          placeholder="Máximo"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-2.5 border border-gray-200 text-gray-600 hover:text-black rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center"
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  className="col-span-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all duration-150 cursor-pointer text-center shadow-lg"
                >
                  Buscar Imóveis
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
