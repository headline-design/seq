import React from 'react';
import { TransitionType } from '../types';
import { CrossDissolveIcon, FadeIcon, TransitionIcon, PanelLeftClose } from './icons';

interface TransitionsPanelProps {
  onClose: () => void;
  onApplyTransition: (type: TransitionType) => void;
  selectedClipId: string | null;
}

const TRANSITIONS: { type: TransitionType; label: string; icon: React.ReactNode }[] = [
  { type: 'cross-dissolve', label: 'Cross Dissolve', icon: <CrossDissolveIcon className="w-6 h-6" /> },
  { type: 'fade-black', label: 'Dip to Black', icon: <div className="w-6 h-6 bg-black rounded border border-neutral-700" /> },
  { type: 'fade-white', label: 'Dip to White', icon: <div className="w-6 h-6 bg-white rounded" /> },
  { type: 'wipe-left', label: 'Wipe Left', icon: <TransitionIcon className="w-6 h-6 rotate-90" /> },
  { type: 'wipe-right', label: 'Wipe Right', icon: <TransitionIcon className="w-6 h-6 -rotate-90" /> },
];

export const TransitionsPanel: React.FC<TransitionsPanelProps> = ({ onClose, onApplyTransition, selectedClipId }) => {
  return (
    <div className="w-full flex flex-col bg-[#09090b] border-r border-neutral-800 h-full">
      {/* Header */}
      <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-neutral-800">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Transitions</h2>
        <div
          className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer text-neutral-500 transition-colors"
          onClick={onClose}
        >
           <PanelLeftClose className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
        {!selectedClipId && (
            <div className="p-3 mb-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-200/70 text-xs">
                Select a clip on the timeline to apply a transition.
            </div>
        )}

        {TRANSITIONS.map((trans) => (
            <div
                key={trans.type}
                className={`group flex items-center gap-4 p-3 rounded-lg border border-transparent transition-all cursor-pointer ${
                    selectedClipId
                    ? 'hover:bg-[#18181b] hover:border-neutral-700 active:bg-[#202023]'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => {
                    if (selectedClipId) onApplyTransition(trans.type);
                }}
            >
                <div className="w-10 h-10 bg-neutral-900 rounded flex items-center justify-center text-neutral-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                    {trans.icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-300 group-hover:text-white">{trans.label}</span>
                    <span className="text-[10px] text-neutral-500">1.0s Duration</span>
                </div>
                {selectedClipId && (
                    <div className="ml-auto opacity-0 group-hover:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
                )}
            </div>
        ))}

        <div className="h-px bg-neutral-800 my-2"></div>

        <div
             className={`group flex items-center gap-4 p-3 rounded-lg border border-transparent transition-all cursor-pointer ${
                selectedClipId
                ? 'hover:bg-red-900/10 hover:border-red-900/30'
                : 'opacity-50 cursor-not-allowed'
            }`}
             onClick={() => {
                if (selectedClipId) onApplyTransition('none');
             }}
        >
             <div className="w-10 h-10 bg-neutral-900 rounded flex items-center justify-center text-neutral-500 group-hover:text-red-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-medium text-neutral-300 group-hover:text-red-200">Remove Transition</span>
             </div>
        </div>
      </div>
    </div>
  );
};
