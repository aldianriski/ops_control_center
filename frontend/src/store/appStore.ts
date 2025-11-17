import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Environment {
  id: string;
  name: string;
  display_name: string;
  color: string;
}

interface Team {
  id: string;
  name: string;
  display_name: string;
  color: string;
}

interface AppState {
  selectedEnvironment: string;
  selectedTeam: string;
  environments: Environment[];
  teams: Team[];
  setEnvironment: (environment: string) => void;
  setTeam: (team: string) => void;
  setEnvironments: (environments: Environment[]) => void;
  setTeams: (teams: Team[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedEnvironment: 'production',
      selectedTeam: 'infra',
      environments: [],
      teams: [],
      setEnvironment: (environment) => set({ selectedEnvironment: environment }),
      setTeam: (team) => set({ selectedTeam: team }),
      setEnvironments: (environments) => set({ environments }),
      setTeams: (teams) => set({ teams }),
    }),
    {
      name: 'app-storage',
    }
  )
);
