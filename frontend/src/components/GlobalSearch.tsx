import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Server, Shield, BookOpen, Command, X } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'incident' | 'task' | 'sop' | 'report' | 'asset';
  title: string;
  subtitle?: string;
  path: string;
  icon: any;
}

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Mock search data - replace with actual API call
  const mockData: SearchResult[] = [
    {
      id: '1',
      type: 'incident',
      title: 'Database Connection Timeout',
      subtitle: 'INC-001 • Critical • InfraOps',
      path: '/infra?tab=incidents&id=1',
      icon: Server,
    },
    {
      id: '2',
      type: 'incident',
      title: 'API Gateway High Latency',
      subtitle: 'INC-002 • High • InfraOps',
      path: '/infra?tab=incidents&id=2',
      icon: Server,
    },
    {
      id: '3',
      type: 'asset',
      title: 'web-server-01',
      subtitle: 'Production • Medium Risk',
      path: '/secops?tab=assets&id=3',
      icon: Shield,
    },
    {
      id: '4',
      type: 'sop',
      title: 'PostgreSQL Backup Procedure',
      subtitle: 'Database • Provisioning',
      path: '/sops?id=4',
      icon: BookOpen,
    },
    {
      id: '5',
      type: 'report',
      title: 'Weekly Operations Report',
      subtitle: 'Generated Jan 15, 2025',
      path: '/reports?id=5',
      icon: FileText,
    },
  ];

  // Search function
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const filtered = mockData.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setResults(filtered);
    setSelectedIndex(0);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      // Close with Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }

      // Navigate results with arrow keys
      if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSelect(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    performSearch(value);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <Search size={20} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search incidents, SOPs, reports, assets..."
              className="flex-1 outline-none text-gray-900 placeholder-gray-500"
              autoFocus
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          {/* Search Results */}
          {query && (
            <div className="max-h-[60vh] overflow-y-auto">
              {results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => {
                    const Icon = result.icon;
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                          index === selectedIndex ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="p-2 bg-gray-100 rounded-md flex-shrink-0">
                          <Icon size={18} className="text-gray-600" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </p>
                          {result.subtitle && (
                            <p className="text-xs text-gray-500 truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded capitalize">
                            {result.type}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Search size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm">No results found for "{query}"</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try searching for incidents, SOPs, reports, or assets
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer with shortcuts */}
          {!query && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
                      ↑↓
                    </kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
                      ↵
                    </kbd>
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
                      Esc
                    </kbd>
                    <span>Close</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span>Powered by</span>
                  <Command size={12} />
                  <span>Search</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GlobalSearch;
