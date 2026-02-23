
import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { ModelOption } from '../types';

interface ModelSelectorProps {
  selectedModel: ModelOption;
  models: ModelOption[];
  onSelect: (model: ModelOption) => void;
  isOpen: boolean;
  onToggle: () => void;
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
            <div className="absolute bottom-full right-0 mb-2 w-[280px] bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col py-1.5 max-h-[400px] overflow-y-auto">
            
            <div className="flex flex-col">
                {['Stable', 'Experimental'].map((category) => {
                    const categoryModels = models.filter(m => m.category === category);
                    if (categoryModels.length === 0) return null;

                    return (
                        <div key={category} className="flex flex-col">
                            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {category}
                            </div>
                            {categoryModels.map((model) => {
                                const isSelected = selectedModel.id === model.id;
                                return (
                                    <button
                                        key={model.id}
                                        onClick={() => {
                                            onSelect(model);
                                            onToggle();
                                        }}
                                        className={`
                                            relative w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                                            ${isSelected ? 'bg-gray-50 dark:bg-[#2A2A2A] text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] hover:text-primary'}
                                        `}
                                    >
                                        <div className={`shrink-0 p-1.5 rounded-md ${isSelected ? 'bg-black text-white' : 'bg-gray-100 dark:bg-[#333] text-gray-500'}`}>
                                            {React.createElement(model.icon, { className: "w-4 h-4" })}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <span className="text-[14px] font-medium truncate text-primary">
                                                {model.name}
                                            </span>
                                            <span className="text-[11px] text-gray-500 truncate">
                                                {model.description}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
            </div>
        </>
      )}
    </div>
  );
};
