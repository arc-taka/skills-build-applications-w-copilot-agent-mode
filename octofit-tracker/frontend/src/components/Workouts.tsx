import { ApiStatus, useApiData } from './useApiData.js';

type Workout = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };
type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  const state = useApiData<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`);
  return <section><h2>Workout suggestions</h2><p>Recommend workouts from activity patterns.</p><ApiStatus state={state} label="workout suggestions" />
    {state.status === 'success' && (state.data.suggestions.length
      ? <ul>{state.data.suggestions.map((workout) => <li key={workout.title}><strong>{workout.title}</strong>{workout.reason ? ` — ${workout.reason}` : ''}</li>)}</ul>
      : <p>No workout suggestions yet.</p>)}
  </section>;
}
