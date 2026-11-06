import { Schema, model } from 'mongoose';

const workoutSchema = new Schema({
  title: { type: String, required: true, trim: true, minlength: 1 },
  focus: { type: String, required: true, trim: true, enum: ['endurance', 'strength', 'mobility'] },
  minutes: { type: Number, required: true, min: 1, validate: Number.isInteger },
  difficulty: { type: String, required: true, trim: true, enum: ['easy', 'moderate', 'hard'] },
});

export const Workout = model('Workout', workoutSchema);
