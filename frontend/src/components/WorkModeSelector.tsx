import { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  Wrench,
  Shield,
  CheckCircle,
  ChevronDown
} from 'lucide-react';

type WorkMode = 'normal' | 'incident' | 'maintenance' | 'audit';

interface WorkModeOption {
  id: WorkMode;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
}

const workModes: WorkModeOption[] = [
  {
    id: 'normal',
    label: 'Normal Operations',
    icon: Activity,
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    description: 'Standard operational mode',
  },
  {
    id: 'incident',
    label: 'Incident Response',
    icon: AlertOctagon,
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    description: 'Active incident management',
  },
  {
    id: 'maintenance',
    label: 'Maintenance Window',
    icon: Wrench,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 border-yellow-200',
    description: 'Scheduled maintenance in progress',
  },
  {
    id: 'audit',
    label: 'Audit Mode',
    icon: Shield,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'Compliance and security audit',
  },
];

const WorkModeSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [workMode, setWorkMode] = useState<WorkMode>('normal');

  const currentMode = workModes.find((mode) => mode.id === workMode) || workModes[0];
  const Icon = currentMode.icon;

  const handleModeChange = (mode: WorkMode) => {
    setWorkMode(mode);
    setIsOpen(false);
    // You can add analytics or notifications here
    console.log(`Work mode changed to: ${mode}`);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md border-2 transition-all ${currentMode.bgColor} ${currentMode.color} hover:shadow-md`}
      >
        <Icon size={18} />
        <span className="font-medium text-sm hidden md:inline">{currentMode.label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Operational Work Mode</h3>
              <p className="text-xs text-gray-600 mt-1">
                Select the current operational context
              </p>
            </div>

            <div className="py-2">
              {workModes.map((mode) => {
                const ModeIcon = mode.icon;
                const isActive = mode.id === workMode;

                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id)}
                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                      isActive ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-md ${mode.bgColor} flex-shrink-0`}>
                      <ModeIcon size={20} className={mode.color} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">
                          {mode.label}
                        </span>
                        {isActive && (
                          <CheckCircle size={16} className="text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {mode.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Current Mode Info */}
            <div className={`px-4 py-3 border-t border-gray-200 ${currentMode.bgColor}`}>
              <div className="flex items-center gap-2">
                <Icon size={16} className={currentMode.color} />
                <span className={`text-xs font-semibold ${currentMode.color}`}>
                  Currently in: {currentMode.label}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkModeSelector;
