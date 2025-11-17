import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { Shield, Target, AlertTriangle, ChevronRight, ExternalLink } from 'lucide-react';

interface MitreTechnique {
  id: string;
  technique_id: string; // e.g., "T1059"
  technique_name: string;
  tactic: string;
  sub_technique?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  incident_count: number;
  last_detected: string;
  description: string;
  mitigations?: string[];
}

interface MitreTactic {
  id: string;
  name: string;
  description: string;
  techniques_count: number;
}

const MitreAttackMapping = () => {
  const { selectedEnvironment } = useAppStore();
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<MitreTechnique | null>(null);

  // Mock data for MITRE ATT&CK tactics
  const tactics: MitreTactic[] = [
    { id: '1', name: 'Initial Access', description: 'Trying to get into your network', techniques_count: 3 },
    { id: '2', name: 'Execution', description: 'Trying to run malicious code', techniques_count: 5 },
    { id: '3', name: 'Persistence', description: 'Trying to maintain foothold', techniques_count: 2 },
    { id: '4', name: 'Privilege Escalation', description: 'Trying to gain higher-level permissions', techniques_count: 4 },
    { id: '5', name: 'Defense Evasion', description: 'Trying to avoid being detected', techniques_count: 6 },
    { id: '6', name: 'Credential Access', description: 'Stealing account names and passwords', techniques_count: 3 },
    { id: '7', name: 'Discovery', description: 'Trying to figure out your environment', techniques_count: 4 },
    { id: '8', name: 'Lateral Movement', description: 'Moving through your environment', techniques_count: 2 },
    { id: '9', name: 'Collection', description: 'Gathering data of interest', techniques_count: 3 },
    { id: '10', name: 'Exfiltration', description: 'Stealing data', techniques_count: 2 },
    { id: '11', name: 'Command and Control', description: 'Communicating with compromised systems', techniques_count: 4 },
    { id: '12', name: 'Impact', description: 'Manipulate, interrupt, or destroy systems', techniques_count: 3 },
  ];

  // Mock data for techniques
  const mockTechniques: Record<string, MitreTechnique[]> = {
    'Initial Access': [
      {
        id: '1',
        technique_id: 'T1190',
        technique_name: 'Exploit Public-Facing Application',
        tactic: 'Initial Access',
        severity: 'critical',
        incident_count: 5,
        last_detected: '2025-01-15T14:32:00Z',
        description: 'Adversaries may attempt to exploit a weakness in an Internet-facing host or system.',
        mitigations: ['Application Isolation', 'Network Segmentation', 'Privilege Management', 'Update Software'],
      },
      {
        id: '2',
        technique_id: 'T1078',
        technique_name: 'Valid Accounts',
        tactic: 'Initial Access',
        severity: 'high',
        incident_count: 3,
        last_detected: '2025-01-14T09:15:00Z',
        description: 'Adversaries may obtain and abuse credentials of existing accounts.',
        mitigations: ['Multi-factor Authentication', 'Password Policies', 'Account Use Policies'],
      },
      {
        id: '3',
        technique_id: 'T1566',
        technique_name: 'Phishing',
        tactic: 'Initial Access',
        severity: 'high',
        incident_count: 8,
        last_detected: '2025-01-16T11:22:00Z',
        description: 'Adversaries may send phishing messages to gain access to victim systems.',
        mitigations: ['User Training', 'Email Filtering', 'Anti-virus/Anti-malware'],
      },
    ],
    'Execution': [
      {
        id: '4',
        technique_id: 'T1059',
        technique_name: 'Command and Scripting Interpreter',
        tactic: 'Execution',
        severity: 'critical',
        incident_count: 12,
        last_detected: '2025-01-16T16:45:00Z',
        description: 'Adversaries may abuse command and script interpreters to execute commands.',
        mitigations: ['Code Signing', 'Execution Prevention', 'Restrict Registry Permissions'],
      },
      {
        id: '5',
        technique_id: 'T1053',
        technique_name: 'Scheduled Task/Job',
        tactic: 'Execution',
        severity: 'high',
        incident_count: 6,
        last_detected: '2025-01-15T13:30:00Z',
        description: 'Adversaries may abuse task scheduling to execute programs.',
        mitigations: ['User Account Management', 'Privileged Account Management', 'Audit'],
      },
    ],
  };

  const { data: techniques = [], isLoading } = useQuery({
    queryKey: ['mitre-techniques', selectedEnvironment, selectedTactic],
    queryFn: async () => {
      // In production, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockTechniques[selectedTactic || 'Initial Access'] || [];
    },
    enabled: !!selectedTactic,
  });

  const severityColors: Record<MitreTechnique['severity'], string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };

  const tacticColors: string[] = [
    'bg-red-50 border-red-200 hover:bg-red-100',
    'bg-orange-50 border-orange-200 hover:bg-orange-100',
    'bg-amber-50 border-amber-200 hover:bg-amber-100',
    'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    'bg-lime-50 border-lime-200 hover:bg-lime-100',
    'bg-green-50 border-green-200 hover:bg-green-100',
    'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    'bg-teal-50 border-teal-200 hover:bg-teal-100',
    'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
    'bg-sky-50 border-sky-200 hover:bg-sky-100',
    'bg-blue-50 border-blue-200 hover:bg-blue-100',
    'bg-purple-50 border-purple-200 hover:bg-purple-100',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield size={24} className="text-blue-600" />
            MITRE ATT&CK Framework Mapping
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Security incidents mapped to MITRE ATT&CK tactics and techniques
          </p>
        </div>
        <a
          href="https://attack.mitre.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <ExternalLink size={16} />
          View MITRE ATT&CK
        </a>
      </div>

      {/* Tactics Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tactics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {tactics.map((tactic, index) => (
            <button
              key={tactic.id}
              onClick={() => {
                setSelectedTactic(tactic.name);
                setSelectedTechnique(null);
              }}
              className={`p-4 border-2 rounded-lg transition-all text-left ${
                selectedTactic === tactic.name
                  ? 'ring-2 ring-blue-500 ring-offset-2'
                  : ''
              } ${tacticColors[index % tacticColors.length]}`}
            >
              <div className="flex items-start justify-between mb-2">
                <Target size={18} className="text-gray-700 flex-shrink-0" />
                <span className="px-2 py-0.5 bg-white rounded-full text-xs font-semibold text-gray-700">
                  {tactic.techniques_count}
                </span>
              </div>
              <h4 className="font-semibold text-sm text-gray-900 mb-1">
                {tactic.name}
              </h4>
              <p className="text-xs text-gray-600 line-clamp-2">
                {tactic.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Techniques List */}
      {selectedTactic && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Techniques List */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedTactic} Techniques
            </h3>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {techniques.map((technique) => (
                  <button
                    key={technique.id}
                    onClick={() => setSelectedTechnique(technique)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTechnique?.id === technique.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2 py-1 bg-gray-900 text-white text-xs font-mono rounded">
                        {technique.technique_id}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                          severityColors[technique.severity]
                        }`}
                      >
                        {technique.severity.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">
                      {technique.technique_name}
                    </h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-600">
                        {technique.incident_count} incidents
                      </span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Technique Details */}
          <div className="lg:col-span-2">
            {selectedTechnique ? (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 bg-gray-900 text-white text-sm font-mono rounded">
                        {selectedTechnique.technique_id}
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                          severityColors[selectedTechnique.severity]
                        }`}
                      >
                        {selectedTechnique.severity.toUpperCase()}
                      </span>
                    </div>
                    <a
                      href={`https://attack.mitre.org/techniques/${selectedTechnique.technique_id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedTechnique.technique_name}
                  </h3>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={16} className="text-red-600" />
                        <span className="text-sm font-medium text-red-700">Incidents Detected</span>
                      </div>
                      <p className="text-2xl font-bold text-red-900">
                        {selectedTechnique.incident_count}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <span className="text-sm font-medium text-blue-700 block mb-1">Last Detected</span>
                      <p className="text-sm font-semibold text-blue-900">
                        {new Date(selectedTechnique.last_detected).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Description</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedTechnique.description}
                    </p>
                  </div>

                  {/* Mitigations */}
                  {selectedTechnique.mitigations && selectedTechnique.mitigations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                        Recommended Mitigations
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedTechnique.mitigations.map((mitigation, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md"
                          >
                            <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0" />
                            <span className="text-sm text-green-900 font-medium">
                              {mitigation}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tactic */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2">Tactic</h4>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-md">
                      <Target size={16} className="text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">
                        {selectedTechnique.tactic}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <Shield size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">
                  Select a technique to view details and mitigations
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedTactic && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-8 text-center">
          <Target size={48} className="mx-auto text-blue-600 mb-3" />
          <p className="text-blue-900 font-medium">
            Select a tactic above to view associated techniques
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Techniques are mapped from detected security incidents in {selectedEnvironment}
          </p>
        </div>
      )}
    </div>
  );
};

export default MitreAttackMapping;
