import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface TriggerNodeProps {
  id: string;
  data: {
    name: string;
    description?: string;
    triggerType?: string;
  };
  selected: boolean;
}

const TriggerNode: React.FC<TriggerNodeProps> = ({ id, data, selected }) => {
  return (
    <div className={`p-3 rounded-lg border ${selected ? 'border-blue-500 shadow-md' : 'border-gray-200'} bg-white`}>
      <div className="flex items-center space-x-3">
        <div className="bg-red-100 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        </div>
        <div>
          <p className="font-medium text-gray-800">{data.name || 'Trigger'}</p>
          {data.description && (
            <p className="text-xs text-gray-500 mt-1 max-w-[180px]">
              {data.description}
            </p>
          )}
          {data.triggerType && (
            <div className="mt-2">
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{data.triggerType}</span>
            </div>
          )}
        </div>
      </div>

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

export default memo(TriggerNode);