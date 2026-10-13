import { integer, pgTable, serial, text, timestamp, boolean, doublePrecision } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define the 'properties' table
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(), // stored as integer (e.g. 450000)
  type: text('type').notNull(), // 'Apartamento', 'Casa', 'Cobertura', 'Terreno'
  address: text('address').notNull(),
  city: text('city').notNull(),
  neighborhood: text('neighborhood').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: integer('bathrooms').notNull(),
  area: integer('area').notNull(), // in m²
  parkingSpots: integer('parking_spots').default(0).notNull(),
  status: text('status').notNull(), // 'Venda', 'Aluguel', 'Lançamento'
  images: text('images').notNull(), // JSON array of image URLs as string
  featured: boolean('featured').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'schedules' (agendamentos) table
export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id')
    .references(() => properties.id, { onDelete: 'cascade' })
    .notNull(),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  clientPhone: text('client_phone').notNull(),
  visitDate: text('visit_date').notNull(), // YYYY-MM-DD
  visitTime: text('visit_time').notNull(), // HH:MM
  status: text('status').default('Pendente').notNull(), // 'Pendente', 'Confirmado', 'Cancelado'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'leads' (contact forms) table
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  clientPhone: text('client_phone').notNull(),
  message: text('message').notNull(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  status: text('status').default('Novo').notNull(), // 'Novo', 'Em Atendimento', 'Concluído'
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'chat_messages' table
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(), // unique ID generated for each visitor session
  senderName: text('sender_name').notNull(),
  message: text('message').notNull(),
  isAdmin: boolean('is_admin').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships for properties
export const propertiesRelations = relations(properties, ({ many }) => ({
  schedules: many(schedules),
  leads: many(leads),
}));

// Define relationships for schedules
export const schedulesRelations = relations(schedules, ({ one }) => ({
  property: one(properties, {
    fields: [schedules.propertyId],
    references: [properties.id],
  }),
}));

// Define relationships for leads
export const leadsRelations = relations(leads, ({ one }) => ({
  property: one(properties, {
    fields: [leads.propertyId],
    references: [properties.id],
  }),
}));
