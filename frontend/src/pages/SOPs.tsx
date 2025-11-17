import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { sopApi } from '../api';
import SOPExecutionMode from '../components/SOPExecutionMode';
import { exportToJSON, importFromJSON } from '../utils/export';
import { BookOpen, Search, PlayCircle, Download, Upload } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const SOPs = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const [selectedSOP, setSelectedSOP] = useState<any>(null);
  const [isExecutionOpen, setIsExecutionOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const { data: sops } = useQuery({
    queryKey: ['sops', search, selectedCategory],
    queryFn: () =>
      sopApi.getSOPs({
        ...(search && { search }),
        ...(selectedCategory && { category: selectedCategory }),
      }),
  });

  const handleExecuteSOP = (sop: any) => {
    setSelectedSOP(sop);
    setIsExecutionOpen(true);
  };

  const handleExportSOPs = () => {
    if (!sops || sops.length === 0) {
      toast.error('No SOPs to export');
      return;
    }
    exportToJSON(sops, 'sops-export');
  };

  const handleImportSOPs = () => {
    importFromJSON<any[]>(
      (data) => {
        // Validate SOP structure
        if (!Array.isArray(data)) {
          toast.error('Invalid file format. Expected an array of SOPs.');
          return;
        }

        const hasValidStructure = data.every(
          (sop) =>
            sop.title &&
            sop.category &&
            Array.isArray(sop.steps)
        );

        if (!hasValidStructure) {
          toast.error('Invalid SOP structure in file');
          return;
        }

        // In production, this would call an API to bulk import
        toast.success(`Ready to import ${data.length} SOPs. (API integration pending)`);
        console.log('SOPs to import:', data);

        // Refresh the list
        queryClient.invalidateQueries({ queryKey: ['sops'] });
      },
      (data) => {
        // Validator function
        return (
          Array.isArray(data) &&
          data.every((sop) => sop.title && sop.category && Array.isArray(sop.steps))
        );
      }
    );
  };

  const categories = ['provisioning', 'security', 'incident', 'custom'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SOPs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Standard Operating Procedures and workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportSOPs}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Upload size={16} />
            Import
          </button>
          <button
            onClick={handleExportSOPs}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search SOPs..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SOPs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sops?.map((sop) => (
          <div key={sop.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                <BookOpen size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{sop.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{sop.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {sop.category}
                  </span>
                  {sop.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {sop.steps?.length || 0} steps
                  </p>
                  <button
                    onClick={() => handleExecuteSOP(sop)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <PlayCircle size={16} />
                    Execute
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SOP Execution Mode */}
      {selectedSOP && (
        <SOPExecutionMode
          sopId={selectedSOP.id}
          sopTitle={selectedSOP.title}
          steps={selectedSOP.steps || []}
          isOpen={isExecutionOpen}
          onClose={() => {
            setIsExecutionOpen(false);
            setSelectedSOP(null);
          }}
        />
      )}
    </div>
  );
};

export default SOPs;
