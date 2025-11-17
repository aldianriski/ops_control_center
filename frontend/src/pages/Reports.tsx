import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../api';
import ReportVersionHistory from '../components/ReportVersionHistory';
import ReportScheduleManager from '../components/ReportScheduleManager';
import { FileText, Download } from 'lucide-react';
import { useState } from 'react';

const Reports = () => {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.getReports(),
  });

  const generateWeeklyMutation = useMutation({
    mutationFn: (format: 'pdf' | 'markdown') => reportsApi.generateWeeklyReport(format),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setGenerating(false);
    },
  });

  const generateMonthlyMutation = useMutation({
    mutationFn: (format: 'pdf' | 'markdown') => reportsApi.generateMonthlyReport(format),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setGenerating(false);
    },
  });

  const handleGenerateWeekly = async () => {
    setGenerating(true);
    await generateWeeklyMutation.mutateAsync('pdf');
  };

  const handleGenerateMonthly = async () => {
    setGenerating(true);
    await generateMonthlyMutation.mutateAsync('pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and download operational reports
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerateWeekly}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            Generate Weekly Report
          </button>
          <button
            onClick={handleGenerateMonthly}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            Generate Monthly Report
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-200">
          {reports?.map((report) => (
            <div key={report.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Generated on {new Date(report.generated_at).toLocaleDateString()}
                    {' • '}
                    {report.format.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Period: {new Date(report.period_start).toLocaleDateString()} -{' '}
                    {new Date(report.period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    report.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : report.status === 'generating'
                      ? 'bg-yellow-100 text-yellow-800'
                      : report.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {report.status}
                </span>
                {report.status === 'completed' && (
                  <button
                    onClick={() => window.open(`/api/v1/reports/${report.id}/download`, '_blank')}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Download size={16} />
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Version History */}
      <div>
        <ReportVersionHistory reportId="weekly-ops-001" reportName="Weekly Operations Report" />
      </div>

      {/* Report Scheduling */}
      <div>
        <ReportScheduleManager />
      </div>
    </div>
  );
};

export default Reports;
