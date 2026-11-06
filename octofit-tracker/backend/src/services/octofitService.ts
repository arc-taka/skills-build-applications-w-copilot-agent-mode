import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

type ActivityInput = {
  userId: string;
  teamId: string;
  type: string;
  minutes: number;
};

type TeamInput = {
  name: string;
  mascot: string;
  members?: string[];
};

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw badRequest('Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) throw badRequest('A valid userId is required');
  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) throw badRequest('A valid teamId is required');
  if (typeof type !== 'string' || !type.trim()) throw badRequest('An activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw badRequest('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user) throw notFound('User not found');
  if (!team) throw notFound('Team not found');

  const activity: ActivityInput = { userId, teamId, type: type.trim(), minutes };
  return Activity.create({
    user: activity.userId,
    team: activity.teamId,
    type: activity.type,
    minutes: activity.minutes,
    points: activity.minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw badRequest('Team details are required');
  const { name, mascot, members } = input;
  if (typeof name !== 'string' || !name.trim()) throw badRequest('A team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw badRequest('A team mascot is required');
  if (members !== undefined && (!Array.isArray(members) || !members.every(
    (member): member is string => typeof member === 'string' && mongoose.isValidObjectId(member),
  ))) {
    throw badRequest('Members must be valid user IDs');
  }

  const memberIds = (members ?? []) as string[];
  if (memberIds.length) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== new Set(memberIds.map((id) => id.toLowerCase())).size) {
      throw badRequest('All team members must exist');
    }
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number; team: { name: string } }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    { $lookup: { from: Team.collection.name, localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
  ]);
  return totals.map(({ team, totalPoints }, index) => ({
    teamName: team.name,
    totalPoints,
    rank: index + 1,
  }));
}

function focusFromActivity(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('run') || normalized.includes('cycle') || normalized.includes('cardio')) return 'endurance';
  if (normalized.includes('strength') || normalized.includes('weight')) return 'strength';
  if (normalized.includes('yoga') || normalized.includes('stretch') || normalized.includes('walk')) return 'mobility';
  return normalized;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) throw notFound('User not found');

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.toLowerCase();
  const recentType = recentActivity?.type;
  const recentFocus = recentType ? focusFromActivity(recentType) : undefined;

  return workouts
    .map((workout) => {
      const focus = workout.focus.toLowerCase();
      const matchesGoal = focus === goal;
      const matchesActivity = recentFocus !== undefined && focus === recentFocus;
      const reason = matchesGoal
        ? `Matches your ${user.fitnessGoal} fitness goal${matchesActivity ? ` and recent ${recentType} activity` : ''}.`
        : matchesActivity
          ? `Recommended based on your recent ${recentType} activity.`
          : `A varied workout to complement your ${user.fitnessGoal} goal.`;
      return { ...workout, reason, score: Number(matchesGoal) + Number(matchesActivity) };
    })
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .map(({ score: _score, ...workout }) => workout);
}

export { User };
