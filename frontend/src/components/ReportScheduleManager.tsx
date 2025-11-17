import React, { useState } from 'react';
import useReportScheduleStore, { ReportSchedule, ReportFormat, ScheduleFrequency } from '../store/reportScheduleStore';
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ReportScheduleManager: React.FC = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule, toggleSchedule } = useReportScheduleStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'weekly' as const,
    format: 'pdf' as ReportFormat,
    frequency: 'weekly' as ScheduleFrequency,
    scheduleTime: '09:00',
    scheduleDays: [1] as number[], // Monday
    recipients: '',
    includeModules: {
      infraops: true,
      secops: true,
      finops: true,
      sops: false,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a schedule name');
      return;
    }

    if (!formData.recipients.trim()) {
      toast.error('Please enter at least one recipient email');
      return;
    }

    const recipientsList = formData.recipients.split(',').map(e => e.trim()).filter(e => e);

    const scheduleData = {
      ...formData,
      recipients: recipientsList,
      enabled: true,
    };

    if (editingSchedule) {
      updateSchedule(editingSchedule.id, scheduleData);
      toast.success('Schedule updated successfully');
    } else {
      addSchedule(scheduleData);
      toast.success('Schedule created successfully');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'weekly',
      format: 'pdf',
      frequency: 'weekly',
      scheduleTime: '09:00',
      scheduleDays: [1],
      recipients: '',
      includeModules: {
        infraops: true,
        secops: true,
        finops: true,
        sops: false,
      },
    });
    setEditingSchedule(null);
    setShowCreateDialog(false);
  };

  const handleEdit = (schedule: ReportSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      type: schedule.type,
      format: schedule.format,
      frequency: schedule.frequency,
      scheduleTime: schedule.scheduleTime,
      scheduleDays: schedule.scheduleDays || [1],
      recipients: schedule.recipients.join(', '),
      includeModules: schedule.includeModules,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (schedule && window.confirm(`Delete schedule "${schedule.name}"?`)) {
      deleteSchedule(id);
      toast.success('Schedule deleted');
    }
  };

  const getFrequencyText = (schedule: ReportSchedule) => {
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${schedule.scheduleTime}`;
      case 'weekly':
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayNames = schedule.scheduleDays?.map(d => days[d]).join(', ') || 'Monday';
        return `Weekly on ${dayNames} at ${schedule.scheduleTime}`;
      case 'monthly':
        const dates = schedule.scheduleDays?.join(', ') || '1';
        return `Monthly on day ${dates} at ${schedule.scheduleTime}`;
      default:
        return schedule.frequency;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scheduled Reports</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Automate report generation and distribution
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Schedule</span>
        </button>
      </div>

      {/* Schedules List */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">No scheduled reports yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Create a schedule to automate report generation
            </p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                      {schedule.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      schedule.enabled
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {schedule.enabled ? 'Active' : 'Paused'}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-full capitalize">
                      {schedule.format}
                    </span>
                  </div>

                  {schedule.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {schedule.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{getFrequencyText(schedule)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <PaperAirplaneIcon className="w-4 h-4" />
                      <span>{schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {schedule.lastRun && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Last run: {new Date(schedule.lastRun).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleSchedule(schedule.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      schedule.enabled
                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title={schedule.enabled ? 'Pause' : 'Resume'}
                  >
                    {schedule.enabled ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <XCircleIcon className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schedule Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekly Ops Report"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Format
                  </label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value as ReportFormat })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pdf">PDF</option>
                    <option value="markdown">Markdown</option>
                    <option value="excel">Excel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as ScheduleFrequency })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.scheduleTime}
                  onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recipients * (comma-separated emails)
                </label>
                <input
                  type="text"
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  placeholder="user1@example.com, user2@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Include Modules
                </label>
                <div className="space-y-2">
                  {Object.entries(formData.includeModules).map(([module, enabled]) => (
                    <label key={module} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          includeModules: { ...formData.includeModules, [module]: e.target.checked }
                        })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {module}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingSchedule ? 'Update' : 'Create'} Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportScheduleManager;
