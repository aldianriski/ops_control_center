import React from 'react';
import { X, Cog6ToothIcon, ArrowsPointingOutIcon } from 'lucide-react';

interface WidgetWrapperProps {
  title: string;
  children: React.ReactNode;
  onRemove?: () => void;
  onConfigure?: () => void;
  onExpand?: () => void;
  isEditMode?: boolean;
  refreshInterval?: number;
  lastUpdated?: Date;
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  title,
  children,
  onRemove,
  onConfigure,
  onExpand,
  isEditMode = false,
  refreshInterval,
  lastUpdated,
}) => {
  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h3>
          {lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Widget Actions */}
        <div className="flex items-center gap-1 ml-2">
          {refreshInterval && (
            <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {refreshInterval}s
            </span>
          )}

          {onExpand && (
            <button
              onClick={onExpand}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Expand"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </button>
          )}

          {onConfigure && (
            <button
              onClick={onConfigure}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
              title="Configure"
            >
              <Cog6ToothIcon className="w-4 h-4" />
            </button>
          )}

          {isEditMode && onRemove && (
            <button
              onClick={onRemove}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </div>
  );
};

export default WidgetWrapper;
