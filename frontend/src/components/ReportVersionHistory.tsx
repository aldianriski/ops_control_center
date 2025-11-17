import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Eye, Clock, User, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import DetailPanel from './DetailPanel';

interface ReportVersion {
  id: string;
  report_id: string;
  report_name: string;
  version: number;
  generated_by: string;
  generated_at: string;
  file_url: string;
  format: 'pdf' | 'markdown';
  status: 'generating' | 'completed' | 'failed';
  file_size?: number;
  metadata?: {
    period_start?: string;
    period_end?: string;
    sections_count?: number;
    total_incidents?: number;
    total_cost?: number;
  };
  changes?: string[];
}

interface ReportVersionHistoryProps {
  reportId?: string;
  reportName?: string;
}

const ReportVersionHistory = ({ reportId, reportName }: ReportVersionHistoryProps) => {
  const [selectedVersion, setSelectedVersion] = useState<ReportVersion | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Mock data for demonstration
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['report-versions', reportId],
    queryFn: async (): Promise<ReportVersion[]> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return [
        {
          id: '1',
          report_id: reportId || 'weekly-ops-001',
          report_name: reportName || 'Weekly Operations Report',
          version: 5,
          generated_by: 'system',
          generated_at: '2025-01-16T14:30:00Z',
          file_url: '/reports/weekly-ops-v5.pdf',
          format: 'pdf',
          status: 'completed',
          file_size: 2457600,
          metadata: {
            period_start: '2025-01-09',
            period_end: '2025-01-15',
            sections_count: 8,
            total_incidents: 23,
          },
          changes: ['Updated SLA metrics section', 'Added new infrastructure metrics'],
        },
        {
          id: '2',
          report_id: reportId || 'weekly-ops-001',
          report_name: reportName || 'Weekly Operations Report',
          version: 4,
          generated_by: 'john.doe',
          generated_at: '2025-01-09T15:45:00Z',
          file_url: '/reports/weekly-ops-v4.pdf',
          format: 'pdf',
          status: 'completed',
          file_size: 2234880,
          metadata: {
            period_start: '2025-01-02',
            period_end: '2025-01-08',
            sections_count: 7,
            total_incidents: 18,
          },
        },
        {
          id: '3',
          report_id: reportId || 'weekly-ops-001',
          report_name: reportName || 'Weekly Operations Report',
          version: 3,
          generated_by: 'system',
          generated_at: '2025-01-02T16:20:00Z',
          file_url: '/reports/weekly-ops-v3.pdf',
          format: 'pdf',
          status: 'completed',
          file_size: 2089984,
        },
        {
          id: '4',
          report_id: reportId || 'weekly-ops-001',
          report_name: reportName || 'Weekly Operations Report',
          version: 2,
          generated_by: 'jane.smith',
          generated_at: '2024-12-26T10:15:00Z',
          file_url: '/reports/weekly-ops-v2.pdf',
          format: 'markdown',
          status: 'completed',
          file_size: 153600,
        },
        {
          id: '5',
          report_id: reportId || 'weekly-ops-001',
          report_name: reportName || 'Weekly Operations Report',
          version: 1,
          generated_by: 'system',
          generated_at: '2024-12-19T14:00:00Z',
          file_url: '/reports/weekly-ops-v1.pdf',
          format: 'pdf',
          status: 'failed',
          metadata: {
            total_incidents: 15,
          },
        },
      ];
    },
  });

  const handleDownload = (version: ReportVersion) => {
    // In production, this would trigger actual download
    console.log(`Downloading report version ${version.version}: ${version.file_url}`);
    window.open(version.file_url, '_blank');
  };

  const handleViewDetails = (version: ReportVersion) => {
    setSelectedVersion(version);
    setIsDetailOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const statusIcons: Record<ReportVersion['status'], JSX.Element> = {
    generating: <Clock size={18} className="text-blue-500 animate-spin" />,
    completed: <CheckCircle size={18} className="text-green-500" />,
    failed: <AlertCircle size={18} className="text-red-500" />,
  };

  const statusColors: Record<ReportVersion['status'], string> = {
    generating: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock size={20} className="text-blue-600" />
          Version History
        </h3>
        <span className="text-sm text-gray-600">{versions.length} versions</span>
      </div>

      {/* Version List */}
      <div className="space-y-3">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={`bg-white border-2 rounded-lg p-5 transition-all hover:shadow-md ${
              index === 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              {/* Left: Version Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-gray-600" />
                    <span className="font-semibold text-gray-900">
                      Version {version.version}
                    </span>
                  </div>
                  {index === 0 && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                      LATEST
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${
                      statusColors[version.status]
                    }`}
                  >
                    {statusIcons[version.status]}
                    <span className="ml-1">{version.status}</span>
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded uppercase">
                    {version.format}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>{format(new Date(version.generated_at), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span>by {version.generated_by}</span>
                  </div>
                  {version.file_size && (
                    <div className="flex items-center gap-2">
                      <FileText size={14} />
                      <span>{formatFileSize(version.file_size)}</span>
                    </div>
                  )}
                </div>

                {version.metadata && (
                  <div className="flex gap-4 text-xs text-gray-600">
                    {version.metadata.period_start && version.metadata.period_end && (
                      <span>
                        Period: {format(new Date(version.metadata.period_start), 'MMM dd')} -{' '}
                        {format(new Date(version.metadata.period_end), 'MMM dd')}
                      </span>
                    )}
                    {version.metadata.sections_count && (
                      <span>Sections: {version.metadata.sections_count}</span>
                    )}
                    {version.metadata.total_incidents !== undefined && (
                      <span>Incidents: {version.metadata.total_incidents}</span>
                    )}
                  </div>
                )}

                {version.changes && version.changes.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    <span className="text-xs text-gray-500">Changes:</span>
                    <div className="flex flex-wrap gap-1">
                      {version.changes.map((change, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                          {change}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  {formatDistanceToNow(new Date(version.generated_at), { addSuffix: true })}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleViewDetails(version)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="View details"
                >
                  <Eye size={18} />
                </button>
                {version.status === 'completed' && (
                  <button
                    onClick={() => handleDownload(version)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedVersion && (
        <DetailPanel
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedVersion(null);
          }}
          title={`${selectedVersion.report_name} - Version ${selectedVersion.version}`}
        >
          <div className="space-y-6">
            {/* Status */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Status</h4>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border font-medium ${
                  statusColors[selectedVersion.status]
                }`}
              >
                {statusIcons[selectedVersion.status]}
                <span>{selectedVersion.status.toUpperCase()}</span>
              </div>
            </div>

            {/* Generation Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Generation Info</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Generated:</span>
                  <span className="font-medium">
                    {format(new Date(selectedVersion.generated_at), 'MMMM dd, yyyy HH:mm:ss')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Generated by:</span>
                  <span className="font-medium">{selectedVersion.generated_by}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium uppercase">{selectedVersion.format}</span>
                </div>
                {selectedVersion.file_size && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Size:</span>
                    <span className="font-medium">{formatFileSize(selectedVersion.file_size)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            {selectedVersion.metadata && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Report Metadata</h4>
                <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
                  {selectedVersion.metadata.period_start && selectedVersion.metadata.period_end && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Reporting Period:</span>
                      <span className="font-medium text-blue-900">
                        {format(new Date(selectedVersion.metadata.period_start), 'MMM dd, yyyy')} -{' '}
                        {format(new Date(selectedVersion.metadata.period_end), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  {selectedVersion.metadata.sections_count && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Sections:</span>
                      <span className="font-medium text-blue-900">{selectedVersion.metadata.sections_count}</span>
                    </div>
                  )}
                  {selectedVersion.metadata.total_incidents !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Incidents:</span>
                      <span className="font-medium text-blue-900">{selectedVersion.metadata.total_incidents}</span>
                    </div>
                  )}
                  {selectedVersion.metadata.total_cost !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Cost:</span>
                      <span className="font-medium text-blue-900">
                        ${selectedVersion.metadata.total_cost.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Changes */}
            {selectedVersion.changes && selectedVersion.changes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Changes in This Version</h4>
                <ul className="space-y-2">
                  {selectedVersion.changes.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Download Button */}
            {selectedVersion.status === 'completed' && (
              <button
                onClick={() => handleDownload(selectedVersion)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                <Download size={18} />
                Download Report
              </button>
            )}
          </div>
        </DetailPanel>
      )}
    </div>
  );
};

export default ReportVersionHistory;
