import { useWebSocket } from '../hooks/useWebSocket';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

const ConnectionStatusBadge = () => {
  const { connectionStatus, isConnected, connect } = useWebSocket({ autoConnect: false });

  const statusConfig = {
    connecting: {
      icon: <RefreshCw size={14} className="animate-spin" />,
      text: 'Connecting',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
    },
    connected: {
      icon: <Wifi size={14} />,
      text: 'Live',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
    },
    disconnected: {
      icon: <WifiOff size={14} />,
      text: 'Offline',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-200',
    },
    error: {
      icon: <WifiOff size={14} />,
      text: 'Error',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
    },
  };

  const config = statusConfig[connectionStatus];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} text-xs font-medium`}
    >
      {config.icon}
      <span>{config.text}</span>
      {!isConnected && connectionStatus !== 'connecting' && (
        <button
          onClick={connect}
          className="ml-1 hover:underline"
          title="Reconnect"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ConnectionStatusBadge;
