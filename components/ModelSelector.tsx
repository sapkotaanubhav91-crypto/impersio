
import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { ModelOption } from '../types';

interface ModelSelectorProps {
  selectedModel: ModelOption;
  models: ModelOption[];
  onSelect: (model: ModelOption) => void;
  isOpen: boolean;
  onToggle: () => void;
  isPro: boolean;
  onOpenProModal: () => void;
  trigger?: React.ReactNode;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel, 
  models, 
  onSelect, 
  isOpen, 
  onToggle,
  trigger
}) => {
  return (
    <div className="relative group">
      <div onClick={onToggle}>
        {trigger}
      </div>
      
      {isOpen && (
        <>
            <div 
                className="fixed inset-0 z-40" 
                onClick={onToggle}
            />
            <div className="absolute bottom-full right-0 mb-2 w-[240px] bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col py-1.5">
            
            <div className="flex flex-col">
                {models.map((model) => {
                const isSelected = selectedModel.id === model.id;
                
                return (
                    <button
                        key={model.id}
                        onClick={() => {
                            onSelect(model);
                            onToggle();
                        }}
                        className={`
                            relative w-full flex items-center gap-3 px-4 py-2 text-left transition-colors
                            ${isSelected ? 'bg-gray-50 dark:bg-[#2A2A2A] text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] hover:text-primary'}
                        `}
                    >
                        <div className={`shrink-0 ${isSelected ? 'text-[#1c7483]' : 'text-current'}`}>
                            {React.createElement(model.icon, { className: "w-4 h-4" })}
                        </div>
                        
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                            <span className="text-[13px] font-medium truncate">
                                {model.name}
                            </span>
                            {model.isReasoning && (
                                <span className="ml-2 text-[9px] font-bold bg-gray-100 dark:bg-[#333] text-gray-500 px-1.5 py-0.5 rounded">Max</span>
                            )}
                        </div>
                    </button>
                );
                })}
            </div>
            </div>
        </>
      )}
    </div>
  );
};
