import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { adminExtendedApi } from '../api/extended';
import { ChevronDown } from 'lucide-react';

const EnvironmentSwitcher = () => {
  const { selectedEnvironment, setEnvironment, environments, setEnvironments } = useAppStore();

  const { data } = useQuery({
    queryKey: ['environments'],
    queryFn: adminExtendedApi.getEnvironments,
  });

  useEffect(() => {
    if (data) {
      setEnvironments(data);
    }
  }, [data, setEnvironments]);

  const selectedEnv = environments.find((e) => e.name === selectedEnvironment);

  return (
    <div className="relative inline-block">
      <select
        value={selectedEnvironment}
        onChange={(e) => setEnvironment(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        style={{ borderLeftColor: selectedEnv?.color || '#6b7280', borderLeftWidth: '3px' }}
      >
        {environments.map((env) => (
          <option key={env.id} value={env.name}>
            {env.display_name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  );
};

export default EnvironmentSwitcher;
