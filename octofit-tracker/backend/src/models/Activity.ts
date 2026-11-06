import { Schema, model } from 'mongoose';

const activitySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  type: { type: String, required: true, trim: true, enum: ['run', 'cycle', 'strength', 'walk', 'swim', 'yoga'] },
  minutes: { type: Number, required: true, min: 1, validate: Number.isInteger },
  points: { type: Number, required: true, min: 0, validate: Number.isInteger },
  occurredAt: { type: Date, required: true },
});

export const Activity = model('Activity', activitySchema);
