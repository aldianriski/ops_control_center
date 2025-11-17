import React, { useState } from 'react';
import { Filter, BookmarkIcon, Trash2, Edit, Copy, ShareIcon } from 'lucide-react';
import { BookmarkIcon as BookmarkSolidIcon } from 'lucide-react';
import useFilterViewsStore, { FilterView } from '../store/filterViewsStore';
import toast from 'react-hot-toast';

interface SavedFilterViewsProps {
  page: FilterView['page'];
  currentFilters: Record<string, any>;
  onLoadFilters: (filters: Record<string, any>) => void;
}

const SavedFilterViews: React.FC<SavedFilterViewsProps> = ({
  page,
  currentFilters,
  onLoadFilters,
}) => {
  const { views, activeViewId, addView, updateView, deleteView, setActiveView, getViewsByPage, duplicateView } = useFilterViewsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editingView, setEditingView] = useState<FilterView | null>(null);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  const [isShared, setIsShared] = useState(false);

  const pageViews = getViewsByPage(page);
  const activeView = views.find((v) => v.id === activeViewId);

  const handleSaveView = () => {
    if (!viewName.trim()) {
      toast.error('Please enter a filter view name');
      return;
    }

    if (editingView) {
      updateView(editingView.id, {
        name: viewName,
        description: viewDescription,
        filters: currentFilters,
        isShared,
      });
      toast.success('Filter view updated successfully');
    } else {
      addView({
        name: viewName,
        description: viewDescription,
        page,
        filters: currentFilters,
        isShared,
        createdBy: 'current-user', // TODO: Get from auth context
      });
      toast.success('Filter view saved successfully');
    }

    setShowSaveDialog(false);
    setEditingView(null);
    setViewName('');
    setViewDescription('');
    setIsShared(false);
  };

  const handleLoadView = (view: FilterView) => {
    setActiveView(view.id);
    onLoadFilters(view.filters);
    toast.success(`Loaded filter view: ${view.name}`);
    setIsOpen(false);
  };

  const handleDeleteView = (view: FilterView, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${view.name}"?`)) {
      deleteView(view.id);
      toast.success('Filter view deleted');
    }
  };

  const handleEditView = (view: FilterView, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingView(view);
    setViewName(view.name);
    setViewDescription(view.description || '');
    setIsShared(view.isShared);
    setShowSaveDialog(true);
  };

  const handleDuplicateView = (view: FilterView, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = `${view.name} (Copy)`;
    duplicateView(view.id, newName);
    toast.success(`Duplicated filter view: ${newName}`);
  };

  const handleClearFilters = () => {
    setActiveView(null);
    onLoadFilters({});
    toast.success('Filters cleared');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Saved Filters Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          activeView
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        {activeView ? <BookmarkSolidIcon className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
        <span className="font-medium">
          {activeView ? activeView.name : 'Saved Filters'}
        </span>
        {pageViews.length > 0 && (
          <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {pageViews.length}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Saved Filter Views</h3>
              <button
                onClick={() => {
                  setShowSaveDialog(true);
                  setIsOpen(false);
                }}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Current
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Save and load your favorite filter combinations
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {pageViews.length === 0 ? (
              <div className="p-8 text-center">
                <Filter className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">No saved filters yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Apply filters and click "Save Current" to create your first view
                </p>
              </div>
            ) : (
              <div className="p-2">
                {pageViews.map((view) => (
                  <div
                    key={view.id}
                    onClick={() => handleLoadView(view)}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors group ${
                      activeViewId === view.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <BookmarkIcon className={`w-4 h-4 flex-shrink-0 ${
                            activeViewId === view.id ? 'text-indigo-600' : 'text-gray-400'
                          }`} />
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {view.name}
                          </h4>
                          {view.isShared && (
                            <span title="Shared with team">
                              <ShareIcon size={16} className="text-green-600" />
                            </span>
                          )}
                        </div>
                        {view.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {view.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{Object.keys(view.filters).length} filters</span>
                          <span>•</span>
                          <span>{new Date(view.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleEditView(view, e)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDuplicateView(view, e)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteView(view, e)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeView && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Active Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Save/Edit Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingView ? 'Edit Filter View' : 'Save Filter View'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  View Name *
                </label>
                <input
                  type="text"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  placeholder="e.g., Critical Incidents Only"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={viewDescription}
                  onChange={(e) => setViewDescription(e.target.value)}
                  placeholder="Describe what this filter view shows..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isShared"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isShared" className="text-sm text-gray-700 dark:text-gray-300">
                  Share with team
                </label>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{Object.keys(currentFilters).length} filters</span> will be saved in this view
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setEditingView(null);
                  setViewName('');
                  setViewDescription('');
                  setIsShared(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveView}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingView ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SavedFilterViews;
