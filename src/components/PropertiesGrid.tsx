import React from 'react';
import { Property } from '../types.ts';
import { MapPin, BedDouble, Bath, Square, Car, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface PropertiesGridProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  loading: boolean;
}

export default function PropertiesGrid({ properties, onSelectProperty, loading }: PropertiesGridProps) {
  const formatPrice = (price: number, status: string) => {
    if (status === 'Aluguel') {
      return `R$ ${price.toLocaleString('pt-BR')}/mês`;
    }
    return `R$ ${price.toLocaleString('pt-BR')}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Carregando imóveis exclusivos Imbloco...</p>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-orange-600 uppercase">Catálogo Premium</span>
          <h2 className="text-3xl font-extrabold text-black font-sans tracking-tight mt-1">Imóveis Disponíveis</h2>
        </div>
        <p className="text-gray-500 text-sm max-w-md font-light">
          Selecione uma das opções abaixo para visualizar a galeria de fotos de alta qualidade, localização no mapa e agendar uma visita com um corretor.
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-500 font-medium text-lg">Nenhum imóvel corresponde aos filtros selecionados.</p>
          <p className="text-gray-400 text-sm mt-1">Experimente alterar as opções ou clique em "Limpar" para ver todos os lançamentos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property, idx) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
              onClick={() => onSelectProperty(property)}
            >
              {/* Image & Badges */}
              <div className="relative h-64 bg-gray-100 overflow-hidden">
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                {/* Status Badge */}
                <span className="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wider uppercase shadow-md">
                  {property.status}
                </span>

                {/* Type Badge */}
                <span className="absolute top-4 right-4 bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wider uppercase shadow-md">
                  {property.type}
                </span>

                {/* Price Display */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-xs px-4 py-2.5 rounded-xl shadow-lg border border-white/20">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">A partir de</p>
                  <p className="text-lg font-extrabold text-black">{formatPrice(property.price, property.status)}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-gray-500 text-xs font-medium mb-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>{property.neighborhood}, {property.city}</span>
                  </div>

                  <h3 className="text-lg font-bold text-black line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {property.title}
                  </h3>

                  <p className="text-gray-500 text-sm font-light line-clamp-2 mt-2 leading-relaxed">
                    {property.description}
                  </p>
                </div>

                {/* Details/Attributes Row */}
                <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-4 gap-2 text-center">
                  <div className="flex flex-col items-center">
                    <BedDouble className="w-4 h-4 text-gray-400 mb-1" />
                    <span className="text-[11px] font-bold text-black">{property.bedrooms} Quartos</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Bath className="w-4 h-4 text-gray-400 mb-1" />
                    <span className="text-[11px] font-bold text-black">{property.bathrooms} Banhs</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Square className="w-4 h-4 text-gray-400 mb-1" />
                    <span className="text-[11px] font-bold text-black">{property.area} m²</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Car className="w-4 h-4 text-gray-400 mb-1" />
                    <span className="text-[11px] font-bold text-black">{property.parkingSpots} Vagas</span>
                  </div>
                </div>

                {/* Bottom interactive action button */}
                <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-orange-600 group-hover:text-orange-700 transition-colors">
                  <span>Ver fotos e agendar</span>
                  <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
