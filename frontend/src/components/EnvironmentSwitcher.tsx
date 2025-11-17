import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import useComparisonStore from '../store/comparisonStore';
import { adminExtendedApi } from '../api/extended';
import { ChevronDown, ArrowRightLeft } from 'lucide-react';

const EnvironmentSwitcher = () => {
  const { selectedEnvironment, setEnvironment, environments, setEnvironments } = useAppStore();
  const { isComparisonMode, setComparisonMode, selectedEnvironments, toggleEnvironment } = useComparisonStore();
  const [showMenu, setShowMenu] = useState(false);

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
      {!isComparisonMode ? (
        <div className="flex items-center gap-2">
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

          {/* Comparison Mode Toggle */}
          <button
            onClick={() => {
              setComparisonMode(true);
              toggleEnvironment(selectedEnvironment);
            }}
            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
            title="Compare environments"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Compare ({selectedEnvironments.length})</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Select Environments
                  </p>
                  {environments.map((env) => (
                    <label
                      key={env.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEnvironments.includes(env.name)}
                        onChange={() => toggleEnvironment(env.name)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: env.color }}
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {env.display_name}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                  <button
                    onClick={() => {
                      setComparisonMode(false);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    Exit Comparison Mode
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EnvironmentSwitcher;
