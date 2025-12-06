import React from 'react';
import { SettingsIcon, PanelLeftClose } from './icons';

interface SettingsPanelProps {
  onClose: () => void;
  onClearTimeline: () => void;
  defaultDuration: number;
  onDurationChange: (val: number) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onClearTimeline, defaultDuration, onDurationChange }) => {
  return (
    <div className="w-full flex flex-col bg-[#09090b] border-r border-neutral-800 h-full">
      {/* Header */}
      <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-neutral-800">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Project Settings</h2>
        <div
          className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer text-neutral-500 transition-colors"
          onClick={onClose}
        >
          <PanelLeftClose className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">

        {/* Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-neutral-200">
            <SettingsIcon className="w-4 h-4" />
            <h3 className="text-sm font-semibold">Timeline Defaults</h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400">Default Clip Duration (Seconds)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={defaultDuration}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              className="w-full bg-[#18181b] border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="h-px bg-neutral-800" />

        {/* Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear the timeline? This cannot be undone.')) {
                onClearTimeline();
              }
            }}
            className="w-full py-2 px-4 rounded border border-red-900/30 bg-red-900/10 text-red-400 hover:bg-red-900/20 text-xs font-medium transition-colors"
          >
            Clear All Timeline Clips
          </button>
        </div>

        <div className="mt-auto pt-8 text-center">
          <p className="text-[10px] text-neutral-600">Seq v1.0.2</p>
        </div>
      </div>
    </div>
  );
};
