import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface DelayNodeProps {
  id: string;
  data: {
    name: string;
    description?: string;
    duration?: number;
    unit?: string;
  };
  selected: boolean;
}

const DelayNode: React.FC<DelayNodeProps> = ({ id, data, selected }) => {
  return (
    <div className={`p-3 rounded-lg border ${selected ? 'border-blue-500 shadow-md' : 'border-gray-200'} bg-white`}>
      <div className="flex items-center space-x-3">
        <div className="bg-purple-100 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div>
          <p className="font-medium text-gray-800">{data.name || 'Delay'}</p>
          {data.description && (
            <p className="text-xs text-gray-500 mt-1 max-w-[180px]">
              {data.description}
            </p>
          )}
          {data.duration && data.unit && (
            <div className="mt-2">
              <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
                {data.duration} {data.unit}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="b"
        className="w-3 h-3 border-2 border-gray-300 bg-white"
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        className="w-3 h-3 border-2 border-gray-300 bg-white"
      />
    </div>
  );
};

export default memo(DelayNode);