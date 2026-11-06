import { ApiStatus, useApiData } from './useApiData.js';

type Team = { name: string; mascot?: string; members: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const state = useApiData<TeamResponse>('/api/teams');
  return <section><h2>Teams</h2><p>Manage teams and members.</p><ApiStatus state={state} label="teams" />
    {state.status === 'success' && (state.data.teams.length
      ? <ul>{state.data.teams.map((team) => <li key={team.name}>{team.name}{team.mascot ? ` (${team.mascot})` : ''} — {team.members.length} members</li>)}</ul>
      : <p>No teams yet.</p>)}
  </section>;
}
