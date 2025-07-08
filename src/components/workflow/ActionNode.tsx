import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { providerConfig } from '../../config/providerConfig';

interface ActionNodeProps {
  id: string;
  data: {
    name: string;
    description?: string;
    service?: string;
    action?: string;
  };
  selected: boolean;
}

const ActionNode: React.FC<ActionNodeProps> = ({ id, data, selected }) => {
  // Find the provider details if a service is selected
  const provider = data.service ? providerConfig.find(p => p.id === data.service) : null;
  
  return (
    <div className={`p-3 rounded-lg border ${selected ? 'border-blue-500 shadow-md' : 'border-gray-200'} bg-white`}>
      <div className="flex items-center space-x-3">
        <div className="bg-blue-100 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
          {provider?.logoUrl ? (
            <img 
              src={provider.logoUrl}
              alt={provider.name}
              className="w-6 h-6 object-contain"
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-800">{data.name || 'Action'}</p>
          {data.description && (
            <p className="text-xs text-gray-500 mt-1 max-w-[180px]">
              {data.description}
            </p>
          )}
          {(data.service || data.action) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {data.service && (
                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {provider?.name || data.service}
                </span>
              )}
              {data.action && (
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                  {data.action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              )}
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

export default memo(ActionNode);