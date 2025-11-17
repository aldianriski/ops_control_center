import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import WidgetWrapper from './WidgetWrapper';
import { WidgetConfig } from '../../store/dashboardStore';

interface KPIWidgetProps {
  widget: WidgetConfig;
  onRemove?: () => void;
  onConfigure?: () => void;
  isEditMode?: boolean;
}

const KPIWidget: React.FC<KPIWidgetProps> = ({
  widget,
  onRemove,
  onConfigure,
  isEditMode,
}) => {
  // Mock data - in real implementation, this would come from the dataSource
  const value = widget.config.value || '0';
  const previousValue = widget.config.previousValue || '0';
  const change = widget.config.change || 0;
  const unit = widget.config.unit || '';
  const format = widget.config.format || 'number'; // 'number', 'currency', 'percentage'

  const formatValue = (val: string | number) => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    switch (format) {
      case 'currency':
        return `$${numVal.toLocaleString()}`;
      case 'percentage':
        return `${numVal.toFixed(1)}%`;
      default:
        return numVal.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    if (change > 0) return <TrendingUp className="w-5 h-5" />;
    if (change < 0) return <TrendingDown className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  const getTrendColor = () => {
    const isPositiveGood = widget.config.positiveIsGood !== false;
    if (change > 0) return isPositiveGood ? 'text-green-600' : 'text-red-600';
    if (change < 0) return isPositiveGood ? 'text-red-600' : 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <WidgetWrapper
      title={widget.title}
      onRemove={onRemove}
      onConfigure={onConfigure}
      isEditMode={isEditMode}
      refreshInterval={widget.refreshInterval}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {formatValue(value)}
            {unit && <span className="text-2xl ml-1 text-gray-500">{unit}</span>}
          </p>

          {change !== 0 && (
            <div className={`flex items-center justify-center gap-1 mt-3 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {Math.abs(change)}% vs previous period
              </span>
            </div>
          )}

          {previousValue && change === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Previous: {formatValue(previousValue)}
            </p>
          )}
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default KPIWidget;
