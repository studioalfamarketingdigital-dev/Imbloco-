export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  type: string; // 'Apartamento', 'Casa', 'Cobertura', 'Terreno'
  address: string;
  city: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  parkingSpots: number;
  status: string; // 'Venda', 'Aluguel', 'Lançamento'
  images: string[];
  featured: boolean;
  createdAt?: string;
}

export interface Schedule {
  id: number;
  propertyId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  visitDate: string;
  visitTime: string;
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
  notes?: string;
  createdAt?: string;
  property?: Property;
}

export interface Lead {
  id: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  message: string;
  propertyId?: number;
  status: 'Novo' | 'Em Atendimento' | 'Concluído';
  createdAt?: string;
}

export interface ChatMessage {
  id: number;
  sessionId: string;
  senderName: string;
  message: string;
  isAdmin: boolean;
  createdAt?: string;
}

export interface ChatSession {
  sessionId: string;
  senderName: string;
  lastMessage: string;
  createdAt: string;
}
