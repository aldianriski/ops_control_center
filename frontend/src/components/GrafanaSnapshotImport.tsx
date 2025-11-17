import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { evidenceApi } from '../api/extended';
import {
  Link,
  Upload,
  CheckCircle,
  AlertCircle,
  BarChart3,
  ExternalLink,
  X,
} from 'lucide-react';

interface GrafanaSnapshotImportProps {
  incidentId: string;
  onClose: () => void;
}

const GrafanaSnapshotImport = ({ incidentId, onClose }: GrafanaSnapshotImportProps) => {
  const queryClient = useQueryClient();
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    snapshotData?: any;
  } | null>(null);

  const importMutation = useMutation({
    mutationFn: evidenceApi.createEvidence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', incidentId] });
      setSnapshotUrl('');
      setTitle('');
      setDescription('');
      setValidationResult(null);
      onClose();
    },
  });

  const validateGrafanaUrl = async (url: string) => {
    setIsValidating(true);
    setValidationResult(null);

    // Simulate validation - in production, this would call the actual Grafana API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // Check URL format
      const grafanaPattern = /^https?:\/\/.*grafana.*\/d\/[a-zA-Z0-9-]+/;
      const snapshotPattern = /^https?:\/\/.*grafana.*\/dashboard\/snapshot\//;

      if (!grafanaPattern.test(url) && !snapshotPattern.test(url)) {
        setValidationResult({
          valid: false,
          message: 'Invalid Grafana URL format. Must be a dashboard or snapshot URL.',
        });
        setIsValidating(false);
        return;
      }

      // Mock successful validation
      setValidationResult({
        valid: true,
        message: 'Valid Grafana snapshot URL',
        snapshotData: {
          dashboard_title: 'System Performance Dashboard',
          time_range: 'Last 6 hours',
          panels: 12,
        },
      });

      // Auto-populate title if empty
      if (!title && validationResult?.snapshotData?.dashboard_title) {
        setTitle(validationResult.snapshotData.dashboard_title);
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        message: 'Failed to validate Grafana URL. Please check the URL and try again.',
      });
    }

    setIsValidating(false);
  };

  const handleImport = () => {
    if (!validationResult?.valid) {
      return;
    }

    importMutation.mutate({
      incident_id: incidentId,
      evidence_type: 'grafana_snapshot',
      title: title || 'Grafana Snapshot',
      description: description || validationResult.snapshotData?.dashboard_title || '',
      file_url: snapshotUrl,
      metadata: validationResult.snapshotData,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-md">
            <BarChart3 size={24} className="text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Import Grafana Snapshot</h3>
            <p className="text-sm text-gray-600 mt-1">
              Import dashboards and snapshots as incident evidence
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Snapshot URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grafana Snapshot URL *
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link size={18} className="text-gray-400" />
              </div>
              <input
                type="url"
                value={snapshotUrl}
                onChange={(e) => setSnapshotUrl(e.target.value)}
                placeholder="https://grafana.example.com/dashboard/snapshot/..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <button
              onClick={() => validateGrafanaUrl(snapshotUrl)}
              disabled={!snapshotUrl || isValidating}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Validating...
                </>
              ) : (
                'Validate'
              )}
            </button>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div
              className={`mt-2 p-3 rounded-md border ${
                validationResult.valid
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {validationResult.valid ? (
                  <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      validationResult.valid ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {validationResult.message}
                  </p>
                  {validationResult.valid && validationResult.snapshotData && (
                    <div className="mt-2 space-y-1 text-xs text-green-700">
                      <p>Dashboard: {validationResult.snapshotData.dashboard_title}</p>
                      <p>Time Range: {validationResult.snapshotData.time_range}</p>
                      <p>Panels: {validationResult.snapshotData.panels}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Evidence Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., CPU and Memory Metrics During Incident"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional context about this snapshot..."
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Example URLs */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Supported URL Formats:</h4>
          <ul className="space-y-1 text-xs text-blue-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <code className="bg-white px-2 py-0.5 rounded">
                https://grafana.example.com/dashboard/snapshot/xyz123
              </code>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <code className="bg-white px-2 py-0.5 rounded">
                https://grafana.example.com/d/dashboard-id/dashboard-name
              </code>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <a
            href="https://grafana.com/docs/grafana/latest/dashboards/share-dashboards-panels/#publish-a-snapshot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <ExternalLink size={14} />
            How to create Grafana snapshots
          </a>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!validationResult?.valid || !title || importMutation.isPending}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Import Snapshot
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrafanaSnapshotImport;
