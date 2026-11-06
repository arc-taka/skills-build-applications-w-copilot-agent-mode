import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = { name: string; mascot?: string; members?: unknown[] };

export default function Teams() {
  return (
    <CapabilityCard<TeamRecord>
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      dataKey="teams"
      emptyMessage="No teams yet."
      renderItem={(team) => `${team.name}${team.mascot ? ` (${team.mascot})` : ''} — ${team.members?.length ?? 0} members`}
    />
  );
}
