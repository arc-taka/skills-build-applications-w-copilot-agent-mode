import { ApiStatus, useApiData } from './useApiData.js';

type Activity = { type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const state = useApiData<ActivityResponse>('/api/activities');
  return <section><h2>Activities</h2><p>Track student activity minutes and points.</p><ApiStatus state={state} label="activities" />
    {state.status === 'success' && (state.data.activities.length
      ? <ul>{state.data.activities.map((activity, index) => <li key={`${activity.type}-${index}`}>{activity.type}: {activity.minutes} minutes, {activity.points} points</li>)}</ul>
      : <p>No activities yet.</p>)}
  </section>;
}
