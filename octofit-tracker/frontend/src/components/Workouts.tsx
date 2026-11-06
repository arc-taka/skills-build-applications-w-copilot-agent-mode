import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; reason?: string; focus?: string; minutes?: number; difficulty?: string };

export default function Workouts() {
  const userEmail = encodeURIComponent('mona@example.com');

  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint={`/api/workouts/suggestions/${userEmail}`}
      dataKey="suggestions"
      emptyMessage="No workout suggestions yet."
      renderItem={(suggestion) => {
        const details = [suggestion.reason ?? suggestion.focus, suggestion.minutes ? `${suggestion.minutes} minutes` : undefined, suggestion.difficulty]
          .filter(Boolean)
          .join(' — ');
        return details ? `${suggestion.title} — ${details}` : suggestion.title;
      }}
    />
  );
}
