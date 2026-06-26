import { PrismaClient, Role, GoalType, GoalStatus, WorkoutStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

// UTC midnight for a day N days ago — matches how the health sync endpoint
// normalizes dates, so seeded samples don't collide with synced ones.
function dayUtc(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function main() {
  console.log("Seeding database...");

  // Wipe (dev only) — order matters for FKs
  await prisma.message.deleteMany();
  await prisma.nutritionEntry.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.progressPhoto.deleteMany();
  await prisma.healthSample.deleteMany();
  await prisma.templateExercise.deleteMany();
  await prisma.workoutTemplate.deleteMany();
  await prisma.exerciseLibrary.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.progressEntry.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const pass = await bcrypt.hash("password123", 10);

  const trainer = await prisma.user.create({
    data: {
      email: "coach@demo.com",
      name: "Coach Alex",
      role: Role.TRAINER,
      passwordHash: pass,
    },
  });

  // --- Client 1: Maria (weight loss) ---
  const mariaUser = await prisma.user.create({
    data: {
      email: "maria@demo.com",
      name: "Maria Lopez",
      role: Role.CLIENT,
      passwordHash: pass,
    },
  });
  const maria = await prisma.client.create({
    data: {
      userId: mariaUser.id,
      trainerId: trainer.id,
      heightCm: 168,
      startWeight: 82,
      notes: "Goal: lose fat, build a 4x/week habit. Knee-friendly lower body.",
    },
  });

  await prisma.goal.createMany({
    data: [
      {
        clientId: maria.id,
        title: "Reach 74 kg bodyweight",
        type: GoalType.WEIGHT,
        startValue: 82,
        currentValue: 78.4,
        targetValue: 74,
        unit: "kg",
        dueDate: daysAgo(-60),
        status: GoalStatus.ACTIVE,
      },
      {
        clientId: maria.id,
        title: "Train 4 sessions per week",
        type: GoalType.HABIT,
        startValue: 1,
        currentValue: 3,
        targetValue: 4,
        unit: "sessions/wk",
        status: GoalStatus.ACTIVE,
      },
    ],
  });

  // Bodyweight trending down over 8 weeks
  const mariaWeights = [82, 81.3, 80.7, 80.1, 79.6, 79.0, 78.7, 78.4];
  for (let i = 0; i < mariaWeights.length; i++) {
    await prisma.progressEntry.create({
      data: {
        clientId: maria.id,
        date: daysAgo((mariaWeights.length - 1 - i) * 7),
        weight: mariaWeights[i],
        bodyFatPct: 32 - i * 0.6,
        note: i === 0 ? "Starting measurements" : undefined,
      },
    });
  }

  // A completed workout and an upcoming one
  await prisma.workoutPlan.create({
    data: {
      clientId: maria.id,
      trainerId: trainer.id,
      title: "Full Body A — Strength",
      description: "Controlled tempo. Rest 90s between compound sets.",
      scheduledFor: daysAgo(2),
      status: WorkoutStatus.COMPLETED,
      completedAt: daysAgo(2),
      perceivedRpe: 7,
      clientNote: "Felt strong, squats easier than last week.",
      exercises: {
        create: [
          { order: 0, name: "Goblet Squat", sets: 4, reps: "10", weight: 20, restSec: 90 },
          { order: 1, name: "Dumbbell Bench Press", sets: 4, reps: "8-10", weight: 14, restSec: 90 },
          { order: 2, name: "Seated Row", sets: 3, reps: "12", weight: 30, restSec: 60 },
          { order: 3, name: "Plank", sets: 3, reps: "45s", restSec: 45 },
        ],
      },
    },
  });

  await prisma.workoutPlan.create({
    data: {
      clientId: maria.id,
      trainerId: trainer.id,
      title: "Home Session — No Equipment",
      description: "For the day you can't make it in. 3 rounds, minimal rest.",
      scheduledFor: daysAgo(-1),
      status: WorkoutStatus.SENT,
      exercises: {
        create: [
          { order: 0, name: "Bodyweight Squat", sets: 3, reps: "15", restSec: 30 },
          { order: 1, name: "Push-up (knees ok)", sets: 3, reps: "10", restSec: 30 },
          { order: 2, name: "Glute Bridge", sets: 3, reps: "15", restSec: 30 },
          { order: 3, name: "Mountain Climbers", sets: 3, reps: "30s", restSec: 30 },
        ],
      },
    },
  });

  // --- Client 2: James (strength) ---
  const jamesUser = await prisma.user.create({
    data: {
      email: "james@demo.com",
      name: "James Carter",
      role: Role.CLIENT,
      passwordHash: pass,
    },
  });
  const james = await prisma.client.create({
    data: {
      userId: jamesUser.id,
      trainerId: trainer.id,
      heightCm: 181,
      startWeight: 79,
      notes: "Goal: add muscle, hit a 100kg deadlift.",
    },
  });

  await prisma.goal.create({
    data: {
      clientId: james.id,
      title: "Deadlift 100 kg",
      type: GoalType.STRENGTH,
      startValue: 70,
      currentValue: 90,
      targetValue: 100,
      unit: "kg",
      dueDate: daysAgo(-45),
      status: GoalStatus.ACTIVE,
    },
  });

  const jamesWeights = [79, 79.4, 79.9, 80.5, 81.0, 81.6];
  for (let i = 0; i < jamesWeights.length; i++) {
    await prisma.progressEntry.create({
      data: {
        clientId: james.id,
        date: daysAgo((jamesWeights.length - 1 - i) * 7),
        weight: jamesWeights[i],
      },
    });
  }

  await prisma.workoutPlan.create({
    data: {
      clientId: james.id,
      trainerId: trainer.id,
      title: "Lower Power",
      description: "Build to a heavy triple on deadlift.",
      scheduledFor: daysAgo(-1),
      status: WorkoutStatus.SENT,
      exercises: {
        create: [
          { order: 0, name: "Deadlift", sets: 5, reps: "3", weight: 90, restSec: 180 },
          { order: 1, name: "Back Squat", sets: 4, reps: "6", weight: 80, restSec: 120 },
          { order: 2, name: "Romanian Deadlift", sets: 3, reps: "10", weight: 60, restSec: 90 },
        ],
      },
    },
  });

  // --- Premium feature demo data ---

  // Macro targets + a day of food for Maria
  await prisma.client.update({
    where: { id: maria.id },
    data: { calorieTarget: 1900, proteinTarget: 150, carbTarget: 180, fatTarget: 60 },
  });
  await prisma.nutritionEntry.createMany({
    data: [
      { clientId: maria.id, meal: "breakfast", name: "Greek yogurt + berries", calories: 320, protein: 28, carbs: 30, fat: 9 },
      { clientId: maria.id, meal: "lunch", name: "Chicken & rice bowl", calories: 620, protein: 52, carbs: 70, fat: 14 },
      { clientId: maria.id, meal: "snack", name: "Protein shake", calories: 180, protein: 30, carbs: 6, fat: 3 },
    ],
  });

  // Exercise library (trainer-owned)
  await prisma.exerciseLibrary.createMany({
    data: [
      { trainerId: trainer.id, name: "Barbell Back Squat", category: "Legs", videoUrl: "https://www.youtube.com/watch?v=ultWZbUMPL8", description: "Brace, knees out, controlled descent to depth." },
      { trainerId: trainer.id, name: "Romanian Deadlift", category: "Posterior chain", videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM", description: "Hinge at the hips, soft knees, neutral spine." },
      { trainerId: trainer.id, name: "Dumbbell Bench Press", category: "Push", videoUrl: "https://www.youtube.com/watch?v=VmB1G1K7v94" },
    ],
  });

  // A reusable template
  await prisma.workoutTemplate.create({
    data: {
      trainerId: trainer.id,
      title: "Full Body Starter",
      description: "Great default session for new clients. 90s rest on compounds.",
      exercises: {
        create: [
          { order: 0, name: "Goblet Squat", sets: 3, reps: "10", weight: 16, restSec: 90 },
          { order: 1, name: "Dumbbell Bench Press", sets: 3, reps: "10", weight: 14, restSec: 90 },
          { order: 2, name: "Seated Row", sets: 3, reps: "12", weight: 30, restSec: 60 },
        ],
      },
    },
  });

  // A message thread for Maria
  await prisma.message.createMany({
    data: [
      { clientId: maria.id, senderId: trainer.id, body: "Great job this week! How are the home sessions feeling?" },
      { clientId: maria.id, senderId: mariaUser.id, body: "Really good — the no-equipment one was tougher than I expected 😅" },
    ],
  });

  // An in-app reminder (already due so it shows in the portal)
  await prisma.reminder.create({
    data: {
      clientId: maria.id,
      trainerId: trainer.id,
      title: "Weigh-in day",
      message: "Log your morning weight before breakfast.",
      dueAt: daysAgo(0),
      channel: "INAPP",
    },
  });

  // A few days of wearable data for Maria
  for (let i = 0; i < 5; i++) {
    await prisma.healthSample.create({
      data: {
        clientId: maria.id,
        date: dayUtc(i),
        source: "apple_health",
        steps: 7000 + Math.round(Math.random() * 4000),
        restingHr: 56 + Math.round(Math.random() * 6),
        sleepMinutes: 400 + Math.round(Math.random() * 80),
        activeCalories: 400 + Math.round(Math.random() * 250),
      },
    });
  }

  console.log("Seed complete.");
  console.log("Trainer login:  coach@demo.com / password123");
  console.log("Client logins:  maria@demo.com / password123  ·  james@demo.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
