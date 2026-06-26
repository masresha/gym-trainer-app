import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const createClientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  heightCm: z.coerce.number().positive().optional(),
  startWeight: z.coerce.number().positive().optional(),
  notes: z.string().optional(),
});

export const goalSchema = z.object({
  title: z.string().min(2),
  type: z.enum(["WEIGHT", "STRENGTH", "ENDURANCE", "HABIT", "CUSTOM"]),
  startValue: z.coerce.number().optional(),
  targetValue: z.coerce.number().optional(),
  currentValue: z.coerce.number().optional(),
  unit: z.string().optional(),
  dueDate: z.string().optional(), // ISO date string from <input type=date>
});

export const exerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.coerce.number().int().positive().optional(),
  reps: z.string().optional(),
  weight: z.coerce.number().nonnegative().optional(),
  restSec: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export const workoutSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  scheduledFor: z.string(), // ISO date
  exercises: z.array(exerciseSchema).min(1, "Add at least one exercise"),
});

export const completeWorkoutSchema = z.object({
  perceivedRpe: z.coerce.number().int().min(1).max(10).optional(),
  clientNote: z.string().optional(),
  status: z.enum(["COMPLETED", "SKIPPED"]).default("COMPLETED"),
});

export const progressSchema = z.object({
  date: z.string().optional(),
  weight: z.coerce.number().positive().optional(),
  bodyFatPct: z.coerce.number().min(1).max(70).optional(),
  note: z.string().optional(),
});

// --- Premium features ---

export const messageSchema = z.object({
  clientId: z.string().min(1),
  body: z.string().min(1, "Message can't be empty").max(4000),
});

export const libraryExerciseSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  videoUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
});

export const templateSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  exercises: z.array(exerciseSchema).min(1, "Add at least one exercise"),
});

export const assignTemplateSchema = z.object({
  clientId: z.string().min(1),
  // One or more ISO dates — multiple dates create a multi-session program.
  dates: z.array(z.string()).min(1, "Pick at least one date"),
});

export const macroTargetSchema = z.object({
  calorieTarget: z.coerce.number().int().nonnegative().optional(),
  proteinTarget: z.coerce.number().nonnegative().optional(),
  carbTarget: z.coerce.number().nonnegative().optional(),
  fatTarget: z.coerce.number().nonnegative().optional(),
});

export const nutritionSchema = z.object({
  clientId: z.string().min(1),
  date: z.string().optional(),
  meal: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  name: z.string().optional(),
  calories: z.coerce.number().int().nonnegative().optional(),
  protein: z.coerce.number().nonnegative().optional(),
  carbs: z.coerce.number().nonnegative().optional(),
  fat: z.coerce.number().nonnegative().optional(),
});

export const reminderSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(2),
  message: z.string().optional(),
  dueAt: z.string(), // ISO datetime
  channel: z.enum(["EMAIL", "INAPP"]).default("INAPP"),
});

export const healthSampleSchema = z.object({
  date: z.string(),
  steps: z.coerce.number().int().nonnegative().optional(),
  restingHr: z.coerce.number().int().nonnegative().optional(),
  sleepMinutes: z.coerce.number().int().nonnegative().optional(),
  activeCalories: z.coerce.number().int().nonnegative().optional(),
  source: z.string().optional(),
});

export const healthIngestSchema = z.object({
  samples: z.array(healthSampleSchema).min(1),
});
