import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useSearchStore, { SearchResult } from '../store/searchStore';
import { infraApi, sopApi } from '../api';
import { assetsApi } from '../api/extended';
import {
  Search,
  Terminal,
  FileText,
  ServerIcon,
  AlertTriangle,
  ClipboardList,
  HomeIcon,
  BarChart,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { isOpen, query, recentItems, setOpen, setQuery, addRecentSearch, addRecentItem } = useSearchStore();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick navigation pages
  const quickPages: SearchResult[] = [
    { id: 'page-dashboard', type: 'page', title: 'Dashboard', description: 'Operational overview', url: '/' },
    { id: 'page-infra', type: 'page', title: 'InfraOps', description: 'Incidents, tasks, and SLA', url: '/infra' },
    { id: 'page-secops', type: 'page', title: 'SecOps', description: 'Assets and vulnerabilities', url: '/secops' },
    { id: 'page-finops', type: 'page', title: 'FinOps', description: 'Cost tracking and budgets', url: '/finops' },
    { id: 'page-sops', type: 'page', title: 'SOPs', description: 'Standard operating procedures', url: '/sops' },
    { id: 'page-reports', type: 'page', title: 'Reports', description: 'Generate and download reports', url: '/reports' },
    { id: 'page-admin', type: 'page', title: 'Admin', description: 'System administration', url: '/admin' },
  ];

  // Fetch data for search
  const { data: incidents } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => infraApi.getIncidents(),
    enabled: isOpen && query.length > 0,
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => infraApi.getTasks(),
    enabled: isOpen && query.length > 0,
  });

  const { data: assets } = useQuery({
    queryKey: ['assets-search'],
    queryFn: () => assetsApi.getAssets(),
    enabled: isOpen && query.length > 0,
  });

  const { data: sops } = useQuery({
    queryKey: ['sops'],
    queryFn: () => sopApi.getSOPs(),
    enabled: isOpen && query.length > 0,
  });

  // Search functionality
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchQuery = query.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search pages
    quickPages.forEach((page) => {
      if (
        page.title.toLowerCase().includes(searchQuery) ||
        page.description?.toLowerCase().includes(searchQuery)
      ) {
        allResults.push(page);
      }
    });

    // Search incidents
    incidents?.forEach((incident: any) => {
      if (
        incident.jira_id?.toLowerCase().includes(searchQuery) ||
        incident.title?.toLowerCase().includes(searchQuery)
      ) {
        allResults.push({
          id: incident.id,
          type: 'incident',
          title: `${incident.jira_id} - ${incident.title}`,
          description: `${incident.severity} | ${incident.status}`,
          url: `/infra?tab=incidents&id=${incident.id}`,
          metadata: incident,
        });
      }
    });

    // Search tasks
    tasks?.forEach((task: any) => {
      if (
        task.jira_id?.toLowerCase().includes(searchQuery) ||
        task.title?.toLowerCase().includes(searchQuery)
      ) {
        allResults.push({
          id: task.id,
          type: 'task',
          title: `${task.jira_id} - ${task.title}`,
          description: `${task.status} | ${task.assignee || 'Unassigned'}`,
          url: `/infra?tab=tasks&id=${task.id}`,
          metadata: task,
        });
      }
    });

    // Search assets
    assets?.forEach((asset: any) => {
      if (
        asset.hostname?.toLowerCase().includes(searchQuery) ||
        asset.ip_address?.toLowerCase().includes(searchQuery)
      ) {
        allResults.push({
          id: asset.id,
          type: 'asset',
          title: asset.hostname,
          description: `${asset.asset_type} | ${asset.ip_address || 'No IP'}`,
          url: `/secops?tab=assets&id=${asset.id}`,
          metadata: asset,
        });
      }
    });

    // Search SOPs
    sops?.forEach((sop: any) => {
      if (
        sop.title?.toLowerCase().includes(searchQuery) ||
        sop.description?.toLowerCase().includes(searchQuery)
      ) {
        allResults.push({
          id: sop.id,
          type: 'sop',
          title: sop.title,
          description: sop.description || `${sop.category} | ${sop.environment}`,
          url: `/sops/${sop.id}`,
          metadata: sop,
        });
      }
    });

    setResults(allResults.slice(0, 20)); // Limit to 20 results
    setSelectedIndex(0);
  }, [query, incidents, tasks, assets, sops, quickPages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }

      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }

      // Navigate results
      if (isOpen) {
        const displayResults = query ? results : [...quickPages, ...recentItems];

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % displayResults.length);
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + displayResults.length) % displayResults.length);
        }

        if (e.key === 'Enter' && displayResults.length > 0) {
          e.preventDefault();
          handleSelect(displayResults[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, query, results, selectedIndex, quickPages, recentItems, setOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (result: SearchResult) => {
    addRecentItem(result);
    if (query) {
      addRecentSearch(query);
    }
    navigate(result.url);
    setOpen(false);
    toast.success(`Navigating to ${result.title}`);
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'incident':
        return <AlertTriangle className="w-5 h-5" />;
      case 'task':
        return <ClipboardList className="w-5 h-5" />;
      case 'asset':
        return <ServerIcon className="w-5 h-5" />;
      case 'sop':
        return <FileText className="w-5 h-5" />;
      case 'report':
        return <BarChart className="w-5 h-5" />;
      case 'page':
        return <HomeIcon className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'incident':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'task':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'asset':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'sop':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'report':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'page':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (!isOpen) return null;

  const displayResults = query ? results : [...quickPages, ...recentItems.slice(0, 5)];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed inset-x-0 top-20 mx-auto max-w-2xl z-50 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search incidents, tasks, assets, SOPs... or type a command"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-700 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {displayResults.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Terminal className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No results found</p>
                <p className="text-sm mt-1">Try searching for incidents, tasks, assets, or SOPs</p>
              </div>
            ) : (
              <>
                {!query && recentItems.length > 0 && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    Recent Items
                  </div>
                )}

                {!query && quickPages.length > 0 && recentItems.length === 0 && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    Quick Navigation
                  </div>
                )}

                <div className="py-2">
                  {displayResults.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-indigo-50 dark:bg-indigo-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                        {getIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {result.title}
                        </p>
                        {result.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {result.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-400 uppercase">
                        {result.type}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">↵</kbd>
                Select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">⌘K</kbd>
              Toggle
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
