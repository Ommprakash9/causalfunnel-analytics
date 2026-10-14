import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  session_id: string;
  event_type: 'page_view' | 'click';
  page_url: string;
  timestamp: Date;
  coordinates?: {
    x: number;
    y: number;
  };
}

const eventSchema = new Schema<IEvent>(
  {
    session_id: {
      type: String,
      required: [true, 'session_id is required'],
      trim: true,
      index: true,
    },
    event_type: {
      type: String,
      required: [true, 'event_type is required'],
      enum: {
        values: ['page_view', 'click'],
        message: 'event_type must be either page_view or click',
      },
      index: true,
    },
    page_url: {
      type: String,
      required: [true, 'page_url is required'],
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: [true, 'timestamp is required'],
      index: true,
    },
    coordinates: {
      type: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
      },
      required: false,
      default: undefined,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound indexes for common query patterns
eventSchema.index({ session_id: 1, timestamp: 1 });
eventSchema.index({ page_url: 1, event_type: 1 });
eventSchema.index({ event_type: 1, page_url: 1, timestamp: -1 });

// Custom validation: click events must have coordinates
eventSchema.pre('validate', function (next) {
  if (this.event_type === 'click') {
    if (!this.coordinates || this.coordinates.x == null || this.coordinates.y == null) {
      return next(new Error('Click events must include coordinates with x and y values'));
    }
    if (!isFinite(this.coordinates.x) || !isFinite(this.coordinates.y)) {
      return next(new Error('Coordinates must be finite numbers'));
    }
    if (this.coordinates.x < 0 || this.coordinates.y < 0) {
      return next(new Error('Coordinates must be non-negative'));
    }
  }
  next();
});

export const Event = mongoose.model<IEvent>('Event', eventSchema);
