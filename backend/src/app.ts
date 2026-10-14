import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRoutes from './routes/api';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp(frontendUrl?: string): express.Application {
  const app = express();

  // CORS
  const allowedOrigins = [
    frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // In development, allow all origins
        if (process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  // Body parsing with size limits
  app.use(express.json({ limit: '1mb' }));

  // Serve tracker SDK as a static file
  app.use('/tracker.js', express.static(path.resolve(__dirname, '../../tracker/dist/tracker.js')));

  // API routes
  app.use('/api', apiRoutes);

  // Root endpoint info
  app.get('/', (_req, res) => {
    res.json({
      name: 'CausalFunnel Analytics API',
      version: '1.0.0',
      status: 'online',
      health: '/api/health',
      docs: '/api/overview',
      tracker: '/tracker.js',
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}
