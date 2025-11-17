import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { evidenceApi } from '../api/extended';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Server, Cpu, HardDrive, Network, Activity, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface InfraMetric {
  id: string;
  environment: string;
  metric_type: 'node_health' | 'oom_events' | 'nf_conntrack' | 'ebs_throughput' | 'nat_traffic';
  timestamp: string;
  value: number;
  metadata?: any;
}

const InfrastructureMetrics = () => {
  const { selectedEnvironment } = useAppStore();
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['infra-metrics', selectedEnvironment, timeRange],
    queryFn: () => evidenceApi.getMetrics({ environment: selectedEnvironment, hours: 24 }),
  });

  // Mock data for demonstration
  const nodeHealthData = [
    { time: '00:00', cpu: 45, memory: 62, disk: 38 },
    { time: '04:00', cpu: 52, memory: 65, disk: 39 },
    { time: '08:00', cpu: 78, memory: 71, disk: 41 },
    { time: '12:00', cpu: 85, memory: 76, disk: 42 },
    { time: '16:00', cpu: 72, memory: 73, disk: 43 },
    { time: '20:00', cpu: 58, memory: 68, disk: 44 },
  ];

  const oomEventsData = [
    { date: 'Mon', count: 3, node: 'worker-01' },
    { date: 'Tue', count: 1, node: 'worker-02' },
    { date: 'Wed', count: 0, node: '-' },
    { date: 'Thu', count: 5, node: 'api-server' },
    { date: 'Fri', count: 2, node: 'worker-03' },
    { date: 'Sat', count: 0, node: '-' },
    { date: 'Sun', count: 1, node: 'db-cache' },
  ];

  const nfConntrackData = [
    { time: '00:00', used: 45000, max: 100000, percentage: 45 },
    { time: '04:00', used: 52000, max: 100000, percentage: 52 },
    { time: '08:00', used: 68000, max: 100000, percentage: 68 },
    { time: '12:00', used: 85000, max: 100000, percentage: 85 },
    { time: '16:00', used: 78000, max: 100000, percentage: 78 },
    { time: '20:00', used: 62000, max: 100000, percentage: 62 },
  ];

  const ebsThroughputData = [
    { time: '00:00', read: 120, write: 85 },
    { time: '04:00', read: 135, write: 92 },
    { time: '08:00', read: 245, write: 178 },
    { time: '12:00', read: 312, write: 225 },
    { time: '16:00', read: 275, write: 198 },
    { time: '20:00', read: 185, write: 132 },
  ];

  const natTrafficData = [
    { time: '00:00', inbound: 450, outbound: 520 },
    { time: '04:00', inbound: 380, outbound: 445 },
    { time: '08:00', inbound: 720, outbound: 890 },
    { time: '12:00', inbound: 950, outbound: 1150 },
    { time: '16:00', inbound: 820, outbound: 980 },
    { time: '20:00', inbound: 620, outbound: 745 },
  ];

  const oomSeverityCount = oomEventsData.reduce((sum, day) => sum + day.count, 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Infrastructure Metrics</h2>
          <p className="text-sm text-gray-600 mt-1">Real-time system health and performance indicators</p>
        </div>
        <div className="flex gap-2">
          {(['1h', '6h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Avg CPU Usage</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">65%</p>
            </div>
            <Cpu size={28} className="text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Memory Usage</p>
              <p className="text-2xl font-bold text-green-900 mt-1">69%</p>
            </div>
            <Activity size={28} className="text-green-600" />
          </div>
        </div>

        <div className={`bg-gradient-to-br rounded-lg p-4 border ${
          oomSeverityCount > 5
            ? 'from-red-50 to-red-100 border-red-200'
            : 'from-yellow-50 to-yellow-100 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${oomSeverityCount > 5 ? 'text-red-700' : 'text-yellow-700'}`}>
                OOM Events (7d)
              </p>
              <p className={`text-2xl font-bold mt-1 ${oomSeverityCount > 5 ? 'text-red-900' : 'text-yellow-900'}`}>
                {oomSeverityCount}
              </p>
            </div>
            <AlertCircle size={28} className={oomSeverityCount > 5 ? 'text-red-600' : 'text-yellow-600'} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Active Nodes</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">24</p>
            </div>
            <Server size={28} className="text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Node Health (CPU, Memory, Disk) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Node Health (24h)</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={nodeHealthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#3B82F6" strokeWidth={2} name="CPU %" />
              <Line type="monotone" dataKey="memory" stroke="#10B981" strokeWidth={2} name="Memory %" />
              <Line type="monotone" dataKey="disk" stroke="#F59E0B" strokeWidth={2} name="Disk %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* OOM Events Heatmap */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">OOM Events (Last 7 Days)</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={oomEventsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                      <p className="font-semibold">{data.date}</p>
                      <p className="text-sm text-red-600">Events: {data.count}</p>
                      {data.count > 0 && <p className="text-xs text-gray-600">Node: {data.node}</p>}
                    </div>
                  );
                }
                return null;
              }} />
              <Legend />
              <Bar dataKey="count" fill="#DC2626" name="OOM Events" />
            </BarChart>
          </ResponsiveContainer>
          {oomSeverityCount > 5 && (
            <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-700 font-medium">
                ⚠️ High OOM event count detected. Consider scaling memory or optimizing applications.
              </p>
            </div>
          )}
        </div>

        {/* nf_conntrack Usage */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Network size={20} className="text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">nf_conntrack Usage</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={nfConntrackData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                      <p className="font-semibold">{data.time}</p>
                      <p className="text-sm text-purple-600">Used: {data.used.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Max: {data.max.toLocaleString()}</p>
                      <p className="text-sm text-orange-600">Usage: {data.percentage}%</p>
                    </div>
                  );
                }
                return null;
              }} />
              <Legend />
              <Area type="monotone" dataKey="percentage" stroke="#9333EA" fill="#C084FC" name="Usage %" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-gray-600">Current: 62,000 / 100,000 connections</span>
            <span className="text-purple-600 font-semibold">62% Utilized</span>
          </div>
        </div>

        {/* EBS Throughput */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive size={20} className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">EBS Throughput (MB/s)</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={ebsThroughputData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="read" stroke="#10B981" fill="#6EE7B7" name="Read MB/s" />
              <Area type="monotone" dataKey="write" stroke="#F59E0B" fill="#FCD34D" name="Write MB/s" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-green-600 font-semibold">Peak Read: 312 MB/s</span>
            <span className="text-orange-600 font-semibold">Peak Write: 225 MB/s</span>
          </div>
        </div>

        {/* NAT Gateway Traffic */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Network size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">NAT Gateway Traffic (Mbps)</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={natTrafficData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="inbound" stroke="#3B82F6" fill="#93C5FD" name="Inbound Mbps" />
              <Area type="monotone" dataKey="outbound" stroke="#8B5CF6" fill="#C4B5FD" name="Outbound Mbps" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <p className="text-gray-600">Peak Inbound</p>
              <p className="text-blue-600 font-semibold text-lg">950 Mbps</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Peak Outbound</p>
              <p className="text-purple-600 font-semibold text-lg">1,150 Mbps</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Avg Total</p>
              <p className="text-gray-900 font-semibold text-lg">1,265 Mbps</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureMetrics;
