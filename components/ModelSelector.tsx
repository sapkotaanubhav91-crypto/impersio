
import React from 'react';
import { ModelOption } from '../types';

interface ModelSelectorProps {
  selectedModel: ModelOption;
  models: ModelOption[];
  onSelect: (model: ModelOption) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel, 
  models, 
  onSelect, 
  isOpen, 
  onToggle 
}) => {
  return (
    <div className="relative group">
      <button 
        onClick={onToggle}
        className="flex items-center justify-center h-8 px-3 rounded-full text-muted hover:text-primary hover:bg-surface-hover transition-colors text-xs font-medium border border-border/50"
        title="Change Model"
      >
        {selectedModel.name}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-[#1E1E1E] border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5">
           <div className="px-3 py-2 text-xs font-medium text-muted border-b border-border/50 mb-1">
              Select Model
           </div>
           
           <div className="flex flex-col gap-0.5">
             {models.map((model) => (
               <button
                 key={model.id}
                 onClick={() => {
                   onSelect(model);
                   onToggle();
                 }}
                 className={`w-full flex items-center px-3 py-2 text-sm text-left rounded-lg transition-colors group/item
                   ${selectedModel.id === model.id ? 'bg-[#2A2A2A] text-white' : 'text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-white'}
                 `}
               >
                 <span className="flex-1 font-medium">{model.name}</span>
               </button>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};
