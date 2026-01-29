
import React from 'react';
import { ChevronRight } from 'lucide-react';
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
        className="flex items-center justify-center w-8 h-8 rounded-full text-muted hover:text-primary hover:bg-surface-hover transition-colors"
        title="Reasoning Model"
      >
        <selectedModel.icon className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-[#1E1E1E] border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5">
           <div className="px-3 py-2 text-xs font-medium text-muted border-b border-border/50 mb-1">
              Upgrade for best models
           </div>
           
           <div className="flex flex-col gap-0.5">
             {models.map((model) => (
               <button
                 key={model.id}
                 onClick={() => {
                   onSelect(model);
                   onToggle();
                 }}
                 className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-lg transition-colors group/item
                   ${selectedModel.id === model.id ? 'bg-[#2A2A2A] text-white' : 'text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-white'}
                 `}
               >
                 <model.icon className={`w-4 h-4 ${selectedModel.id === model.id ? 'text-white' : 'text-muted group-hover/item:text-white'}`} />
                 <span className="flex-1 font-medium">{model.name}</span>
                 {model.id === 'claude-opus-4.5' && (
                    <span className="text-[9px] font-bold text-[#F5A623] border border-[#F5A623] px-1 rounded">MAX</span>
                 )}
               </button>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};
