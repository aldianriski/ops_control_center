import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { adminExtendedApi } from '../api/extended';

const TeamSwitcher = () => {
  const { selectedTeam, setTeam, teams, setTeams } = useAppStore();

  const { data } = useQuery({
    queryKey: ['teams'],
    queryFn: adminExtendedApi.getTeams,
  });

  useEffect(() => {
    if (data) {
      setTeams(data);
    }
  }, [data, setTeams]);

  const selectedTeamObj = teams.find((t) => t.name === selectedTeam);

  return (
    <div className="flex gap-2">
      {teams.map((team) => (
        <button
          key={team.id}
          onClick={() => setTeam(team.name)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedTeam === team.name
              ? 'text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={{
            backgroundColor: selectedTeam === team.name ? team.color : undefined,
          }}
        >
          {team.display_name}
        </button>
      ))}
    </div>
  );
};

export default TeamSwitcher;
