import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardRecord = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardRecord>
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      dataKey="leaderboard"
      emptyMessage="No leaderboard rankings yet."
      renderItem={(entry) => `#${entry.rank} ${entry.teamName} — ${entry.totalPoints} points`}
    />
  );
}
