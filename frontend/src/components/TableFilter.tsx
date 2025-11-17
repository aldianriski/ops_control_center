import { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  filterable?: boolean;
}

interface TableFilterProps<T> {
  data: T[];
  columns: Column[];
  onFilteredDataChange: (filteredData: T[]) => void;
  placeholder?: string;
}

function TableFilter<T extends Record<string, any>>({
  data,
  columns,
  onFilteredDataChange,
  placeholder = 'Search...',
}: TableFilterProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for each filterable column
  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};

    columns
      .filter((col) => col.filterable)
      .forEach((col) => {
        const uniqueValues = Array.from(
          new Set(
            data
              .map((item) => item[col.key])
              .filter((val) => val !== null && val !== undefined)
              .map((val) => String(val))
          )
        ).sort();
        options[col.key] = uniqueValues;
      });

    return options;
  }, [data, columns]);

  // Filter data based on search and filters
  useMemo(() => {
    let filtered = [...data];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((item) => String(item[key]) === value);
      }
    });

    onFilteredDataChange(filtered);
    return filtered;
  }, [data, searchQuery, activeFilters, onFilteredDataChange]);

  const handleFilterChange = (column: string, value: string) => {
    setActiveFilters((prev) => {
      if (value === '') {
        const newFilters = { ...prev };
        delete newFilters[column];
        return newFilters;
      }
      return { ...prev, [column]: value };
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setActiveFilters({});
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className="space-y-3">
      {/* Search Bar and Filter Toggle */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter size={18} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
        {(searchQuery || activeFilterCount > 0) && (
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns
              .filter((col) => col.filterable)
              .map((col) => (
                <div key={col.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {col.label}
                  </label>
                  <select
                    value={activeFilters[col.key] || ''}
                    onChange={(e) => handleFilterChange(col.key, e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">All</option>
                    {filterOptions[col.key]?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active Filters Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            const column = columns.find((col) => col.key === key);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                <span className="font-medium">{column?.label}:</span>
                <span>{value}</span>
                <button
                  onClick={() => handleFilterChange(key, '')}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TableFilter;
