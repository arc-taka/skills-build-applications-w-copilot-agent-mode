import { ApiStatus, useApiData } from './useApiData.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: Ranking[] };

export default function Leaderboard() {
  const state = useApiData<LeaderboardResponse>('/api/leaderboard');
  return <section><h2>Leaderboard</h2><p>Compare team point totals.</p><ApiStatus state={state} label="leaderboard" />
    {state.status === 'success' && (state.data.leaderboard.length
      ? <ol>{state.data.leaderboard.map((entry) => <li key={entry.rank}>{entry.teamName}: {entry.totalPoints} points</li>)}</ol>
      : <p>No leaderboard rankings yet.</p>)}
  </section>;
}
