import { ReactNode } from 'react';

interface TwoColumnLayoutProps {
  leftColumn: ReactNode;
  rightColumn: ReactNode;
  leftWidth?: string; // e.g., '35%' or 'w-1/3'
}

const TwoColumnLayout = ({ leftColumn, rightColumn, leftWidth = '35%' }: TwoColumnLayoutProps) => {
  return (
    <div className="flex gap-6 h-full">
      <div style={{ width: leftWidth }} className="flex-shrink-0 overflow-y-auto">
        {leftColumn}
      </div>
      <div className="flex-1 overflow-y-auto">
        {rightColumn}
      </div>
    </div>
  );
};

export default TwoColumnLayout;
