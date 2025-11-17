import React, { useState } from 'react';
import useDashboardStore, { WidgetType } from '../store/dashboardStore';
import KPIWidget from './widgets/KPIWidget';
import RecentIncidentsWidget from './widgets/RecentIncidentsWidget';
import { Plus, Edit, Check, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardBuilder: React.FC = () => {
  const {
    dashboards,
    activeDashboardId,
    isEditMode,
    setEditMode,
    getActiveDashboard,
    addWidget,
    removeWidget,
    updateWidget,
  } = useDashboardStore();

  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const activeDashboard = getActiveDashboard();

  const widgetTypes: { type: WidgetType; label: string; description: string }[] = [
    { type: 'kpi-card', label: 'KPI Card', description: 'Display a key performance indicator' },
    { type: 'recent-incidents', label: 'Recent Incidents', description: 'Show latest incidents' },
    { type: 'line-chart', label: 'Line Chart', description: 'Trend analysis over time' },
    { type: 'bar-chart', label: 'Bar Chart', description: 'Compare values across categories' },
    { type: 'pie-chart', label: 'Pie Chart', description: 'Show proportions' },
    { type: 'table', label: 'Data Table', description: 'Display tabular data' },
    { type: 'cost-breakdown', label: 'Cost Breakdown', description: 'FinOps cost analysis' },
    { type: 'sla-status', label: 'SLA Status', description: 'Track SLA performance' },
  ];

  const handleAddWidget = (type: WidgetType) => {
    if (!activeDashboard) {
      toast.error('No active dashboard');
      return;
    }

    const widgetConfig = {
      type,
      title: widgetTypes.find((w) => w.type === type)?.label || type,
      dataSource: '',
      config: getDefaultConfig(type),
    };

    const layout = {
      x: 0,
      y: Infinity, // Add to bottom
      w: getDefaultWidth(type),
      h: getDefaultHeight(type),
    };

    addWidget(activeDashboard.id, widgetConfig, layout);
    setShowWidgetSelector(false);
    toast.success('Widget added');
  };

  const getDefaultConfig = (type: WidgetType): Record<string, any> => {
    switch (type) {
      case 'kpi-card':
        return {
          value: '0',
          previousValue: '0',
          change: 0,
          unit: '',
          format: 'number',
          positiveIsGood: true,
        };
      case 'recent-incidents':
        return {
          limit: 5,
          severityFilter: null,
        };
      default:
        return {};
    }
  };

  const getDefaultWidth = (type: WidgetType): number => {
    switch (type) {
      case 'kpi-card':
        return 1;
      case 'recent-incidents':
        return 1;
      case 'line-chart':
      case 'bar-chart':
        return 2;
      case 'table':
        return 3;
      default:
        return 2;
    }
  };

  const getDefaultHeight = (type: WidgetType): number => {
    switch (type) {
      case 'kpi-card':
        return 1;
      case 'recent-incidents':
        return 2;
      default:
        return 2;
    }
  };

  const renderWidget = (widget: any) => {
    const handleRemove = () => {
      if (activeDashboard && window.confirm('Remove this widget?')) {
        removeWidget(activeDashboard.id, widget.id);
        toast.success('Widget removed');
      }
    };

    const handleConfigure = () => {
      toast('Widget configuration coming soon');
    };

    switch (widget.type) {
      case 'kpi-card':
        return (
          <KPIWidget
            widget={widget}
            onRemove={handleRemove}
            onConfigure={handleConfigure}
            isEditMode={isEditMode}
          />
        );
      case 'recent-incidents':
        return (
          <RecentIncidentsWidget
            widget={widget}
            onRemove={handleRemove}
            onConfigure={handleConfigure}
            isEditMode={isEditMode}
          />
        );
      default:
        return (
          <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <LayoutGrid className="w-12 h-12 mx-auto mb-2" />
              <p className="font-medium">{widget.type}</p>
              <p className="text-sm mt-1">Widget type not implemented yet</p>
            </div>
          </div>
        );
    }
  };

  if (!activeDashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-gray-500">
          <LayoutGrid className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg font-medium">No Dashboard Selected</p>
          <p className="text-sm mt-2">Create or select a dashboard to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeDashboard.name}</h2>
          {activeDashboard.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{activeDashboard.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isEditMode
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {isEditMode ? (
              <>
                <Check className="w-5 h-5" />
                Done Editing
              </>
            ) : (
              <>
                <Edit className="w-5 h-5" />
                Edit Dashboard
              </>
            )}
          </button>

          {isEditMode && (
            <button
              onClick={() => setShowWidgetSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Widget
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeDashboard.widgets.map((widget) => (
          <div
            key={widget.id}
            className={`h-80 ${isEditMode ? 'ring-2 ring-indigo-300 dark:ring-indigo-600' : ''}`}
          >
            {renderWidget(widget)}
          </div>
        ))}

        {activeDashboard.widgets.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
            <div className="text-center">
              <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Widgets Added</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Click "Edit Dashboard" and then "Add Widget" to get started
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Widget Selector Modal */}
      {showWidgetSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Widget</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {widgetTypes.map((widgetType) => (
                <button
                  key={widgetType.type}
                  onClick={() => handleAddWidget(widgetType.type)}
                  className="p-4 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">{widgetType.label}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{widgetType.description}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowWidgetSelector(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close modal */}
      {showWidgetSelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowWidgetSelector(false)}
        />
      )}
    </div>
  );
};

export default DashboardBuilder;
