import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/eventService';
import { isDatabaseConnected } from '../config/database';

export const eventController = {
  async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await eventService.createEvent(req.body);
      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const search = req.query.search as string | undefined;

      const result = await eventService.getSessionSummaries(page, limit, search);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSessionEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId.trim() : '';
      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
        return;
      }

      const events = await eventService.getSessionEvents(sessionId);
      res.json({
        success: true,
        data: {
          session_id: sessionId,
          events,
          total: events.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getHeatmapData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pageUrl = req.query.page_url as string;
      if (!pageUrl || pageUrl.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'page_url query parameter is required',
        });
        return;
      }

      // Validate URL
      try {
        new URL(pageUrl);
      } catch {
        res.status(400).json({
          success: false,
          error: 'page_url must be a valid URL',
        });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(5000, Math.max(1, parseInt(req.query.limit as string) || 1000));

      const result = await eventService.getHeatmapData(pageUrl, page, limit);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getPages(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pages = await eventService.getDistinctPages();
      res.json({
        success: true,
        data: { pages },
      });
    } catch (error) {
      next(error);
    }
  },

  async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await eventService.getOverviewMetrics();
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  },

  async healthCheck(_req: Request, res: Response): Promise<void> {
    const dbConnected = isDatabaseConnected();
    const status = dbConnected ? 'healthy' : 'unhealthy';
    const statusCode = dbConnected ? 200 : 503;

    res.status(statusCode).json({
      success: dbConnected,
      status,
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  },
};
