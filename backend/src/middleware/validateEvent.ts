import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';

interface EventPayload {
  session_id: string;
  event_type: string;
  page_url: string;
  timestamp: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

export function validateEventPayload(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const body = req.body as EventPayload;
  const errors: string[] = [];

  // Required fields
  if (!body.session_id || typeof body.session_id !== 'string' || body.session_id.trim() === '') {
    errors.push('session_id is required and must be a non-empty string');
  }

  if (!body.event_type || !['page_view', 'click'].includes(body.event_type)) {
    errors.push('event_type is required and must be "page_view" or "click"');
  }

  if (!body.page_url || typeof body.page_url !== 'string' || body.page_url.trim() === '') {
    errors.push('page_url is required and must be a non-empty string');
  } else {
    // Basic URL validation
    try {
      new URL(body.page_url);
    } catch {
      errors.push('page_url must be a valid URL');
    }
  }

  if (!body.timestamp) {
    errors.push('timestamp is required');
  } else {
    const date = new Date(body.timestamp);
    if (isNaN(date.getTime())) {
      errors.push('timestamp must be a valid ISO 8601 date string');
    }
  }

  // Click events must have coordinates
  if (body.event_type === 'click') {
    if (!body.coordinates) {
      errors.push('coordinates are required for click events');
    } else {
      if (typeof body.coordinates.x !== 'number' || !isFinite(body.coordinates.x)) {
        errors.push('coordinates.x must be a finite number');
      } else if (body.coordinates.x < 0) {
        errors.push('coordinates.x must be non-negative');
      }

      if (typeof body.coordinates.y !== 'number' || !isFinite(body.coordinates.y)) {
        errors.push('coordinates.y must be a finite number');
      } else if (body.coordinates.y < 0) {
        errors.push('coordinates.y must be non-negative');
      }
    }
  }

  if (errors.length > 0) {
    const err: ApiError = new Error('Validation failed');
    err.statusCode = 400;
    err.errors = errors;
    return next(err);
  }

  next();
}
