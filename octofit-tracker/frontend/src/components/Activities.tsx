import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  return (
    <CapabilityCard<ActivityRecord>
      title="Activities"
      description="Track student activity minutes and points."
      endpoint="/api/activities"
      dataKey="activities"
      emptyMessage="No activities yet."
      renderItem={(activity) => `${activity.type ?? 'Activity'} — ${activity.minutes ?? 0} minutes, ${activity.points ?? 0} points`}
    />
  );
}
