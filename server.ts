import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { properties, schedules, leads, chatMessages } from './src/db/schema.ts';
import { eq, and, gte, lte, like, desc, or } from 'drizzle-orm';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Admin Login Endpoint (static credentials specified by user)
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'adm@adm.com' && password === '123456') {
      res.json({ success: true, token: 'imbloco-admin-token-secure-v1', email: 'adm@adm.com' });
    } else {
      res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' });
    }
  });

  // Fetch properties with advanced filters
  app.get('/api/properties', async (req, res) => {
    try {
      const { type, status, minPrice, maxPrice, bedrooms, bathrooms, search, featured } = req.query;

      let conditions: any[] = [];

      if (type && type !== 'Todos') {
        conditions.push(eq(properties.type, type as string));
      }
      if (status && status !== 'Todos') {
        conditions.push(eq(properties.status, status as string));
      }
      if (minPrice) {
        conditions.push(gte(properties.price, parseInt(minPrice as string)));
      }
      if (maxPrice) {
        conditions.push(lte(properties.price, parseInt(maxPrice as string)));
      }
      if (bedrooms && bedrooms !== 'Todos') {
        conditions.push(eq(properties.bedrooms, parseInt(bedrooms as string)));
      }
      if (bathrooms && bathrooms !== 'Todos') {
        conditions.push(eq(properties.bathrooms, parseInt(bathrooms as string)));
      }
      if (featured === 'true') {
        conditions.push(eq(properties.featured, true));
      }
      if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(
          or(
            like(properties.title, searchPattern),
            like(properties.description, searchPattern),
            like(properties.neighborhood, searchPattern),
            like(properties.city, searchPattern)
          )
        );
      }

      const queryBuilder = db.select().from(properties);
      const results = conditions.length > 0 
        ? await queryBuilder.where(and(...conditions)).orderBy(desc(properties.id))
        : await queryBuilder.orderBy(desc(properties.id));

      // Parse JSON image arrays for frontend ease of use
      const formatted = results.map(p => ({
        ...p,
        images: JSON.parse(p.images)
      }));

      res.json(formatted);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ error: 'Erro ao buscar propriedades.', details: error.message });
    }
  });

  // Fetch a single property
  app.get('/api/properties/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await db.select().from(properties).where(eq(properties.id, id));
      if (result.length === 0) {
        return res.status(404).json({ error: 'Propriedade não encontrada.' });
      }
      const property = {
        ...result[0],
        images: JSON.parse(result[0].images)
      };
      res.json(property);
    } catch (error: any) {
      console.error('Error fetching property by ID:', error);
      res.status(500).json({ error: 'Erro ao buscar propriedade.', details: error.message });
    }
  });

  // Create a new property (Admin only check)
  app.post('/api/properties', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer imbloco-admin-token-secure-v1') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    try {
      const { title, description, price, type, address, city, neighborhood, latitude, longitude, bedrooms, bathrooms, area, parkingSpots, status, images, featured } = req.body;
      
      const result = await db.insert(properties).values({
        title,
        description,
        price: parseInt(price),
        type,
        address,
        city,
        neighborhood,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        area: parseInt(area),
        parkingSpots: parseInt(parkingSpots || 0),
        status,
        images: JSON.stringify(images || []),
        featured: !!featured,
      }).returning();

      res.status(201).json(result[0]);
    } catch (error: any) {
      console.error('Error creating property:', error);
      res.status(500).json({ error: 'Erro ao criar propriedade.', details: error.message });
    }
  });

  // Update a property (Admin only)
  app.put('/api/properties/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer imbloco-admin-token-secure-v1') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    try {
      const id = parseInt(req.params.id);
      const { title, description, price, type, address, city, neighborhood, latitude, longitude, bedrooms, bathrooms, area, parkingSpots, status, images, featured } = req.body;

      const result = await db.update(properties).set({
        title,
        description,
        price: parseInt(price),
        type,
        address,
        city,
        neighborhood,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        area: parseInt(area),
        parkingSpots: parseInt(parkingSpots || 0),
        status,
        images: JSON.stringify(images || []),
        featured: !!featured,
      }).where(eq(properties.id, id)).returning();

      res.json(result[0]);
    } catch (error: any) {
      console.error('Error updating property:', error);
      res.status(500).json({ error: 'Erro ao atualizar propriedade.', details: error.message });
    }
  });

  // Delete a property (Admin only)
  app.delete('/api/properties/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer imbloco-admin-token-secure-v1') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    try {
      const id = parseInt(req.params.id);
      await db.delete(properties).where(eq(properties.id, id));
      res.json({ success: true, message: 'Propriedade excluída com sucesso.' });
    } catch (error: any) {
      console.error('Error deleting property:', error);
      res.status(500).json({ error: 'Erro ao excluir propriedade.', details: error.message });
    }
  });

  // Create a visit schedule (agendamento)
  app.post('/api/schedules', async (req, res) => {
    try {
      const { propertyId, clientName, clientEmail, clientPhone, visitDate, visitTime, notes } = req.body;

      const result = await db.insert(schedules).values({
        propertyId: parseInt(propertyId),
        clientName,
        clientEmail,
        clientPhone,
        visitDate,
        visitTime,
        notes,
        status: 'Pendente'
      }).returning();

      res.status(201).json(result[0]);
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      res.status(500).json({ error: 'Erro ao agendar visita.', details: error.message });
    }
  });

  // Get all schedules (Admin only)
  app.get('/api/schedules', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer imbloco-admin-token-secure-v1') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    try {
      const results = await db.select({
        schedule: schedules,
        property: properties
      })
      .from(schedules)
      .innerJoin(properties, eq(schedules.propertyId, properties.id))
      .orderBy(desc(schedules.id));

      const formatted = results.map(r => ({
        ...r.schedule,
        property: {
          ...r.property,
          images: JSON.parse(r.property.images)
        }
      }));

      res.json(formatted);
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({ error: 'Erro ao buscar agendamentos.', details: error.message });
    }
  });

  // Update schedule status (Admin only)
  app.put('/api/schedules/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer imbloco-admin-token-secure-v1') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      const result = await db.update(schedules).set({ status })
        .where(eq(schedules.id, id))
        .returning();

      res.json(result[0]);
    } catch (error: any) {
      console.error('Error updating schedule status:', error);
      res.status(500).json({ error: 'Erro ao atualizar status do agendamento.', details: error.message });
    }
  });

  // Submit a contact/lead
  app.post('/api/leads', async (req, res) => {
    try {
      const { clientName, clientEmail, clientPhone, message, propertyId } = req.body;

      const result = await db.insert(leads).values({
        clientName,
        clientEmail,
        clientPhone,
        message,
        propertyId: propertyId ? parseInt(propertyId) : null,
        status: 'Novo'
      }).returning();

      res.status(201).json(result[0]);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      res.status(500).json({ error: 'Erro ao enviar contato.', details: error.message });
    }
  });

  // Get all leads (Admin only)
  app.get('/api/leads', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer imbloco-admin-token-secure-v1') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    try {
      const results = await db.select().from(leads).orderBy(desc(leads.id));
      res.json(results);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ error: 'Erro ao buscar leads.', details: error.message });
    }
  });

  // Update lead status (Admin only)
  app.put('/api/leads/:id', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer imbloco-admin-token-secure-v1') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      const result = await db.update(leads).set({ status })
        .where(eq(leads.id, id))
        .returning();

      res.json(result[0]);
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      res.status(500).json({ error: 'Erro ao atualizar status do lead.', details: error.message });
    }
  });

  // Chat messages
  app.get('/api/chat/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const results = await db.select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(chatMessages.id);
      res.json(results);
    } catch (error: any) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ error: 'Erro ao buscar mensagens do chat.', details: error.message });
    }
  });

  // Get all active chat sessions (Admin only)
  app.get('/api/admin/chats', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer imbloco-admin-token-secure-v1') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    try {
      // Find unique sessionIds and their latest messages
      const results = await db.select().from(chatMessages).orderBy(desc(chatMessages.id));
      
      const sessionsMap = new Map();
      for (const msg of results) {
        if (!sessionsMap.has(msg.sessionId)) {
          sessionsMap.set(msg.sessionId, {
            sessionId: msg.sessionId,
            senderName: msg.senderName,
            lastMessage: msg.message,
            createdAt: msg.createdAt,
          });
        }
      }

      res.json(Array.from(sessionsMap.values()));
    } catch (error: any) {
      console.error('Error fetching active chats for admin:', error);
      res.status(500).json({ error: 'Erro ao buscar sessões do chat.', details: error.message });
    }
  });

  // Post chat message
  app.post('/api/chat', async (req, res) => {
    try {
      const { sessionId, senderName, message, isAdmin } = req.body;

      const result = await db.insert(chatMessages).values({
        sessionId,
        senderName,
        message,
        isAdmin: !!isAdmin
      }).returning();

      // If visitor sent a message, we can simulate an automatic assistant greeting/response if no admin is active
      if (!isAdmin) {
        // Simple automatic simulation to make chat highly interactive!
        setTimeout(async () => {
          try {
            await db.insert(chatMessages).values({
              sessionId,
              senderName: 'Atendente Imbloco',
              message: `Olá, ${senderName}! Recebemos a sua mensagem e um de nossos corretores especialistas entrará em contato em instantes para ajudá-lo com suas dúvidas sobre nossos imóveis. Se preferir acelerar, sinta-se à vontade para agendar uma visita diretamente na página do imóvel!`,
              isAdmin: true
            });
          } catch (err) {
            console.error('Error saving simulated response:', err);
          }
        }, 3000);
      }

      res.status(201).json(result[0]);
    } catch (error: any) {
      console.error('Error creating chat message:', error);
      res.status(500).json({ error: 'Erro ao enviar mensagem.', details: error.message });
    }
  });


  // --- VITE DEVELOPMENT MIDDLEWARE / STATIC ASSETS ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve HTML index for standard SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
});
