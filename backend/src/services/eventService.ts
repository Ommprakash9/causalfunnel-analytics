import { PipelineStage } from 'mongoose';
import { Event, IEvent } from '../models/Event';

interface SessionSummary {
  session_id: string;
  total_events: number;
  page_views: number;
  clicks: number;
  first_event_at: Date;
  last_event_at: Date;
}

interface PaginatedSessions {
  sessions: SessionSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface HeatmapClick {
  session_id: string;
  page_url: string;
  timestamp: Date;
  coordinates: {
    x: number;
    y: number;
  };
}

export const eventService = {
  async createEvent(data: {
    session_id: string;
    event_type: 'page_view' | 'click';
    page_url: string;
    timestamp: string;
    coordinates?: { x: number; y: number };
  }): Promise<IEvent> {
    const event = new Event({
      session_id: data.session_id.trim(),
      event_type: data.event_type,
      page_url: data.page_url.trim(),
      timestamp: new Date(data.timestamp),
      ...(data.coordinates && { coordinates: data.coordinates }),
    });
    return event.save();
  },

  async getSessionSummaries(
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<PaginatedSessions> {
    const matchStage: Record<string, unknown> = {};
    if (search && search.trim()) {
      matchStage.session_id = { $regex: search.trim(), $options: 'i' };
    }

    const pipeline: PipelineStage[] = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage } as PipelineStage] : []),
      {
        $group: {
          _id: '$session_id',
          total_events: { $sum: 1 },
          page_views: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          first_event_at: { $min: '$timestamp' },
          last_event_at: { $max: '$timestamp' },
        },
      },
      { $sort: { last_event_at: -1 } },
    ];

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Event.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Get paginated results
    const skip = (page - 1) * limit;
    const dataPipeline: PipelineStage[] = [
      ...pipeline,
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          session_id: '$_id',
          total_events: 1,
          page_views: 1,
          clicks: 1,
          first_event_at: 1,
          last_event_at: 1,
        },
      },
    ];

    const sessions = await Event.aggregate(dataPipeline);

    return {
      sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  async getSessionEvents(sessionId: string): Promise<any[]> {
    return Event.find({ session_id: sessionId })
      .sort({ timestamp: 1 })
      .lean();
  },

  async getHeatmapData(
    pageUrl: string,
    page: number = 1,
    limit: number = 1000
  ): Promise<{ clicks: HeatmapClick[]; total: number }> {
    const filter = {
      event_type: 'click',
      page_url: pageUrl,
    };

    const total = await Event.countDocuments(filter);
    const skip = (page - 1) * limit;

    const clicks = await Event.find(filter)
      .select('session_id page_url timestamp coordinates -_id')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      clicks: clicks as unknown as HeatmapClick[],
      total,
    };
  },

  async getDistinctPages(): Promise<string[]> {
    return Event.distinct('page_url');
  },

  async getOverviewMetrics(): Promise<{
    total_sessions: number;
    total_events: number;
    page_views: number;
    clicks: number;
  }> {
    const result = await Event.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total_events: { $sum: 1 },
                page_views: {
                  $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
                },
                clicks: {
                  $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
                },
              },
            },
          ],
          sessions: [
            { $group: { _id: '$session_id' } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const totals = result[0]?.totals[0] || { total_events: 0, page_views: 0, clicks: 0 };
    const sessionCount = result[0]?.sessions[0]?.count || 0;

    return {
      total_sessions: sessionCount,
      total_events: totals.total_events,
      page_views: totals.page_views,
      clicks: totals.clicks,
    };
  },
};
