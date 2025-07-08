import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface ConditionNodeProps {
  id: string;
  data: {
    name: string;
    description?: string;
    conditionType?: string;
    expression?: string;
  };
  selected: boolean;
}

const ConditionNode: React.FC<ConditionNodeProps> = ({ id, data, selected }) => {
  return (
    <div className={`p-3 rounded-lg border ${selected ? 'border-blue-500 shadow-md' : 'border-gray-200'} bg-white`}>
      <div className="flex items-center space-x-3">
        <div className="bg-yellow-100 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </div>
        <div>
          <p className="font-medium text-gray-800">{data.name || 'Condition'}</p>
          {data.description && (
            <p className="text-xs text-gray-500 mt-1 max-w-[180px]">
              {data.description}
            </p>
          )}
          {data.expression && (
            <div className="mt-2 p-1 bg-gray-100 rounded text-xs font-mono">
              {data.expression.length > 20 ? data.expression.slice(0, 20) + '...' : data.expression}
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
      
      {/* Output handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 -ml-4 border-2 border-green-400 bg-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 ml-4 border-2 border-red-400 bg-white"
      />
    </div>
  );
};

export default memo(ConditionNode);