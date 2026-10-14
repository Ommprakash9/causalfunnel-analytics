import { Router } from 'express';
import { eventController } from '../controllers/eventController';
import { validateEventPayload } from '../middleware/validateEvent';

const router = Router();

// Health check
router.get('/health', eventController.healthCheck);

// Overview metrics
router.get('/overview', eventController.getOverview);

// Events
router.post('/events', validateEventPayload, eventController.createEvent);

// Sessions
router.get('/sessions', eventController.getSessions);
router.get('/sessions/:sessionId/events', eventController.getSessionEvents);

// Heatmap
router.get('/heatmap', eventController.getHeatmapData);

// Pages
router.get('/pages', eventController.getPages);

export default router;
