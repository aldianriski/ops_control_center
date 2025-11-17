import { useQuery } from '@tanstack/react-query';
import { sopApi } from '../api';
import { BookOpen, Search } from 'lucide-react';
import { useState } from 'react';

const SOPs = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { data: sops } = useQuery({
    queryKey: ['sops', search, selectedCategory],
    queryFn: () =>
      sopApi.getSOPs({
        ...(search && { search }),
        ...(selectedCategory && { category: selectedCategory }),
      }),
  });

  const categories = ['provisioning', 'security', 'incident', 'custom'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SOPs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Standard Operating Procedures and workflows
        </p>
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
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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
                <div className="mt-4">
                  <p className="text-xs text-gray-500">
                    {sop.steps?.length || 0} steps
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SOPs;
