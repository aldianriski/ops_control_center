import React, { useState } from 'react';
import useDashboardStore from '../store/dashboardStore';
import { Plus, Trash2, StarIcon } from 'lucide-react';
import { StarIcon as StarSolidIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardSelector: React.FC = () => {
  const {
    dashboards,
    activeDashboardId,
    setActiveDashboard,
    addDashboard,
    deleteDashboard,
    updateDashboard,
  } = useDashboardStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');

  const handleCreateDashboard = () => {
    if (!dashboardName.trim()) {
      toast.error('Please enter a dashboard name');
      return;
    }

    const id = addDashboard({
      name: dashboardName,
      description: dashboardDescription,
      isDefault: dashboards.length === 0,
      widgets: [],
      layout: [],
    });

    toast.success('Dashboard created');
    setShowCreateDialog(false);
    setDashboardName('');
    setDashboardDescription('');
    setActiveDashboard(id);
  };

  const handleDeleteDashboard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const dashboard = dashboards.find((d) => d.id === id);
    if (dashboard && window.confirm(`Delete dashboard "${dashboard.name}"?`)) {
      deleteDashboard(id);
      toast.success('Dashboard deleted');
    }
  };

  const handleSetDefault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dashboards.forEach((dash) => {
      updateDashboard(dash.id, { isDefault: dash.id === id });
    });
    toast.success('Default dashboard updated');
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Dashboard Tabs */}
        {dashboards.map((dashboard) => (
          <button
            key={dashboard.id}
            onClick={() => setActiveDashboard(dashboard.id)}
            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeDashboardId === dashboard.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {dashboard.isDefault && (
              <StarSolidIcon className="w-4 h-4 text-yellow-400" />
            )}
            <span className="font-medium">{dashboard.name}</span>
            {dashboard.widgets.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {dashboard.widgets.length}
              </span>
            )}

            {/* Dashboard Actions */}
            <div className="hidden group-hover:flex items-center gap-1 ml-2">
              {!dashboard.isDefault && (
                <button
                  onClick={(e) => handleSetDefault(dashboard.id, e)}
                  className="p-1 hover:bg-white/20 rounded"
                  title="Set as default"
                >
                  <StarIcon className="w-3 h-3" />
                </button>
              )}
              {dashboards.length > 1 && (
                <button
                  onClick={(e) => handleDeleteDashboard(dashboard.id, e)}
                  className="p-1 hover:bg-red-500/20 rounded"
                  title="Delete dashboard"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </button>
        ))}

        {/* Create Dashboard Button */}
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Dashboard</span>
        </button>
      </div>

      {/* Create Dashboard Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create Dashboard
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dashboard Name *
                </label>
                <input
                  type="text"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  placeholder="e.g., Operations Overview"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={dashboardDescription}
                  onChange={(e) => setDashboardDescription(e.target.value)}
                  placeholder="Describe what this dashboard shows..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setDashboardName('');
                  setDashboardDescription('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDashboard}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dialog */}
      {showCreateDialog && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
};

export default DashboardSelector;
