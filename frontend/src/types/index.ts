export interface EventData {
  _id: string;
  session_id: string;
  event_type: 'page_view' | 'click';
  page_url: string;
  timestamp: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

export interface SessionSummary {
  session_id: string;
  total_events: number;
  page_views: number;
  clicks: number;
  first_event_at: string;
  last_event_at: string;
}

export interface PaginatedSessions {
  sessions: SessionSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OverviewMetrics {
  total_sessions: number;
  total_events: number;
  page_views: number;
  clicks: number;
}

export interface HeatmapClick {
  session_id: string;
  page_url: string;
  timestamp: string;
  coordinates: {
    x: number;
    y: number;
  };
}

export interface HeatmapData {
  clicks: HeatmapClick[];
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  errors?: string[];
}
