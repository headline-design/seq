import React from 'react';
import { KeyboardIcon } from './icons';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause' },
    { key: 'Ctrl + Z', desc: 'Undo' },
    { key: 'Ctrl + Shift + Z', desc: 'Redo' },
    { key: 'Ctrl + C', desc: 'Razor Tool Toggle' },
    { key: 'Ctrl + D', desc: 'Duplicate Clip' },
    { key: 'Delete / Backspace', desc: 'Delete Clip' },
    { key: 'Shift + Delete', desc: 'Ripple Delete' },
    { key: 'Left / Right Arrow', desc: 'Nudge Playhead (0.1s)' },
    { key: 'Shift + Scroll', desc: 'Horizontal Timeline Scroll' },
    { key: 'Ctrl + Scroll', desc: 'Zoom Timeline' },
    { key: 'Enter', desc: 'Add Clip from Library' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#18181b] border border-neutral-700 rounded-xl shadow-2xl w-[500px] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="h-14 px-6 flex items-center gap-3 border-b border-neutral-800 bg-[#09090b]">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <KeyboardIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Keyboard Shortcuts</h3>
        </div>

        <div className="p-2 grid grid-cols-1 gap-1 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-neutral-800/50 rounded-lg transition-colors border border-transparent hover:border-neutral-800">
              <span className="text-neutral-400 text-sm font-medium">{s.desc}</span>
              <span className="flex items-center gap-1">
                {s.key.split(' ').map((k, idx) => (
                  <span key={idx} className={`${k === '+' ? 'text-neutral-600' : 'bg-neutral-900 border border-neutral-700 px-2 py-1 rounded text-xs text-neutral-200 font-mono shadow-sm'}`}>
                    {k}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 bg-[#09090b] border-t border-neutral-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};
