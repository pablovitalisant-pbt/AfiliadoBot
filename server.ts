import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDb } from './src/db';
import authRoutes from './src/routes/auth';
import leadRoutes from './src/routes/leads';
import messageRoutes from './src/routes/messages';
import botRoutes from './src/routes/bot';
import whatsappRoutes from './src/routes/whatsapp';
import logRoutes from './src/routes/logs';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json());

  // Initialize DB
  try {
    await initDb();
    console.log('Database initialized');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/bot', botRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/logs', logRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
