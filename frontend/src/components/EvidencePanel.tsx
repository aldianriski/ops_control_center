import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evidenceApi } from '../api/extended';
import GrafanaSnapshotImport from './GrafanaSnapshotImport';
import { FileText, Image, BarChart3, File, Upload, ExternalLink, X } from 'lucide-react';
import { format } from 'date-fns';

interface EvidencePanelProps {
  incidentId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Evidence {
  id: string;
  incident_id: string;
  evidence_type: 'log' | 'metric' | 'screenshot' | 'grafana_snapshot' | 'document';
  title: string;
  description?: string;
  file_url?: string;
  metadata?: any;
  created_by: string;
  created_at: string;
}

const EvidencePanel = ({ incidentId, isOpen, onClose }: EvidencePanelProps) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [showGrafanaImport, setShowGrafanaImport] = useState(false);
  const [newEvidence, setNewEvidence] = useState({
    evidence_type: 'log' as Evidence['evidence_type'],
    title: '',
    description: '',
    file_url: '',
  });

  const { data: evidence = [], isLoading } = useQuery({
    queryKey: ['evidence', incidentId],
    queryFn: () => evidenceApi.getByIncident(incidentId),
    enabled: isOpen && !!incidentId,
  });

  const createEvidenceMutation = useMutation({
    mutationFn: evidenceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', incidentId] });
      setNewEvidence({ evidence_type: 'log', title: '', description: '', file_url: '' });
      setIsUploading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvidenceMutation.mutate({
      incident_id: incidentId,
      ...newEvidence,
    });
  };

  const getEvidenceIcon = (type: Evidence['evidence_type']) => {
    switch (type) {
      case 'log':
        return <FileText size={20} className="text-blue-600" />;
      case 'metric':
        return <BarChart3 size={20} className="text-green-600" />;
      case 'screenshot':
        return <Image size={20} className="text-purple-600" />;
      case 'grafana_snapshot':
        return <BarChart3 size={20} className="text-orange-600" />;
      case 'document':
        return <File size={20} className="text-gray-600" />;
      default:
        return <File size={20} className="text-gray-600" />;
    }
  };

  const typeColors: Record<Evidence['evidence_type'], string> = {
    log: 'bg-blue-100 text-blue-800',
    metric: 'bg-green-100 text-green-800',
    screenshot: 'bg-purple-100 text-purple-800',
    grafana_snapshot: 'bg-orange-100 text-orange-800',
    document: 'bg-gray-100 text-gray-800',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Evidence Collection</h2>
            <p className="text-sm text-gray-600 mt-1">
              Incident ID: {incidentId} • {evidence.length} items
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Evidence List - Left 2/3 */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Collected Evidence</h3>

              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : evidence.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No evidence collected yet</p>
                  <p className="text-sm text-gray-400 mt-1">Upload logs, metrics, or screenshots to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evidence.map((item: Evidence) => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getEvidenceIcon(item.evidence_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {item.title}
                            </h4>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                typeColors[item.evidence_type]
                              }`}
                            >
                              {item.evidence_type}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {format(new Date(item.created_at), 'MMM dd, yyyy HH:mm')} • {item.created_by}
                            </span>
                            {item.file_url && (
                              <a
                                href={item.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <ExternalLink size={14} />
                                View
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Form - Right 1/3 */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 sticky top-0">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Upload size={20} className="text-blue-600" />
                  Upload Evidence
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Evidence Type
                    </label>
                    <select
                      value={newEvidence.evidence_type}
                      onChange={(e) =>
                        setNewEvidence({
                          ...newEvidence,
                          evidence_type: e.target.value as Evidence['evidence_type'],
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="log">Log File</option>
                      <option value="metric">Metric Data</option>
                      <option value="screenshot">Screenshot</option>
                      <option value="grafana_snapshot">Grafana Snapshot</option>
                      <option value="document">Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newEvidence.title}
                      onChange={(e) =>
                        setNewEvidence({ ...newEvidence, title: e.target.value })
                      }
                      placeholder="e.g., Application error logs"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newEvidence.description}
                      onChange={(e) =>
                        setNewEvidence({ ...newEvidence, description: e.target.value })
                      }
                      placeholder="Brief description of the evidence..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File URL or Path
                    </label>
                    <input
                      type="text"
                      value={newEvidence.file_url}
                      onChange={(e) =>
                        setNewEvidence({ ...newEvidence, file_url: e.target.value })
                      }
                      placeholder="https://... or /path/to/file"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={createEvidenceMutation.isPending || !newEvidence.title}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {createEvidenceMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Add Evidence
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidencePanel;
