import { Activity, Team, User, Workout } from '../models/index.js';

type RecordInput = Record<string, unknown>;

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function asRecord(input: unknown): RecordInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('Request body must be an object');
  }
  return input as RecordInput;
}

function requiredString(input: unknown, field: string) {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw badRequest(`${field} is required`);
  }
  return input.trim();
}

function objectId(input: unknown, field: string) {
  if (typeof input !== 'string' || !/^[a-f\d]{24}$/i.test(input)) {
    throw badRequest(`${field} must be a valid id`);
  }
  return input;
}

const activityFocus: Record<string, string> = {
  run: 'endurance',
  cycle: 'endurance',
  walk: 'endurance',
  swim: 'endurance',
  strength: 'strength',
  yoga: 'mobility',
};

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const body = asRecord(input);
  const userId = objectId(body.userId, 'userId');
  const teamId = objectId(body.teamId, 'teamId');
  const type = requiredString(body.type, 'type');
  const minutes = Number(body.minutes);
  if (!Number.isInteger(minutes) || minutes < 1) throw badRequest('minutes must be a positive integer');

  const user = await User.findById(userId).select('_id');
  if (!user) throw notFound('User not found');
  const team = await Team.findById(teamId).select('_id');
  if (!team) throw notFound('Team not found');

  const points = body.points === undefined ? minutes : Number(body.points);
  if (!Number.isInteger(points) || points < 0) throw badRequest('points must be a non-negative integer');
  const occurredAt = body.occurredAt === undefined ? new Date() : new Date(String(body.occurredAt));
  if (Number.isNaN(occurredAt.getTime())) throw badRequest('occurredAt must be a valid date');

  return Activity.create({ user: userId, team: teamId, type, minutes, points, occurredAt });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = asRecord(input);
  const name = requiredString(body.name, 'name');
  const mascot = requiredString(body.mascot, 'mascot');
  const rawMembers = body.members ?? [];
  if (!Array.isArray(rawMembers)) throw badRequest('members must be an array of user ids');
  const memberIds = [...new Set(rawMembers.map((member) => objectId(member, 'members')))];
  const users = memberIds.length > 0 ? await User.find({ _id: { $in: memberIds } }).select('_id') : [];
  if (users.length !== memberIds.length) throw notFound('One or more team members were not found');

  const team = await Team.create({ name, mascot, members: memberIds });
  if (memberIds.length > 0) {
    await Team.updateMany({ _id: { $ne: team._id }, members: { $in: memberIds } }, { $pull: { members: { $in: memberIds } } });
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }
  return team;
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: import('mongoose').Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  if (totals.length === 0) return [];

  const teams = await Team.find({ _id: { $in: totals.map(({ _id }) => _id) } }).select('name').lean();
  const names = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals
    .map(({ _id, totalPoints }) => ({ teamName: names.get(_id.toString()), totalPoints }))
    .filter((entry): entry is { teamName: string; totalPoints: number } => Boolean(entry.teamName))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = requiredString(userEmail, 'userEmail').toLowerCase();
  const user = await User.findOne({ email }).select('_id fitnessGoal').lean();
  if (!user) throw notFound('User not found');

  const activities = await Activity.find({ user: user._id }).select('type').lean();
  const focusCounts = new Map<string, number>();
  for (const activity of activities) {
    const focus = activityFocus[activity.type];
    if (focus) focusCounts.set(focus, (focusCounts.get(focus) ?? 0) + 1);
  }
  const preferredFocus = [...focusCounts.entries()].sort((left, right) =>
    right[1] - left[1] || Number(right[0] === user.fitnessGoal) - Number(left[0] === user.fitnessGoal),
  )[0]?.[0] ?? user.fitnessGoal;

  const workouts = await Workout.find().lean();
  return workouts
    .sort((left, right) => Number(right.focus === preferredFocus) - Number(left.focus === preferredFocus) || left.title.localeCompare(right.title))
    .map((workout) => ({
      ...workout,
      reason: workout.focus === preferredFocus
        ? `Recommended based on your ${preferredFocus} activity pattern.`
        : `Supports your ${user.fitnessGoal} fitness goal.`,
    }));
}

export { User };
