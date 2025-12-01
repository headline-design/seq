import React, { useState, useEffect } from 'react';
import { DownloadIcon, SpinnerIcon, CheckCircleIcon } from './icons';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartExport: (resolution: '720p' | '1080p', source: 'all' | 'selection') => void;
  progress: number;
  isExporting: boolean;
  downloadUrl: string | null;
  totalDuration: number;
  selectionBounds: { start: number; end: number } | null;
  maxSourceHeight: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onStartExport,
  progress,
  isExporting,
  downloadUrl,
  totalDuration,
  selectionBounds,
  maxSourceHeight
}) => {
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [source, setSource] = useState<'all' | 'selection'>('all');

  // Reset source if selection becomes invalid or on open
  useEffect(() => {
      if (isOpen && !selectionBounds) {
          setSource('all');
      }
  }, [isOpen, selectionBounds]);

  if (!isOpen) return null;

  const exportDuration = source === 'all'
      ? totalDuration
      : (selectionBounds ? selectionBounds.end - selectionBounds.start : totalDuration);

  // Estimation: 1080p ~ 1.5MB/s, 720p ~ 0.8MB/s
  const bitrate = resolution === '1080p' ? 1.5 : 0.8;
  const estimatedSize = (exportDuration * bitrate).toFixed(1);

  const formatTime = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBadge = (targetResHeight: number) => {
      if (targetResHeight === 720) {
          if (maxSourceHeight <= 720) return <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Native</span>;
          return <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Compressed</span>;
      }
      if (targetResHeight === 1080) {
          if (maxSourceHeight <= 720) return <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Upscale</span>;
          return <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Native</span>;
      }
      return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-neutral-700 rounded-xl shadow-2xl w-[500px] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="h-14 px-6 flex items-center justify-between border-b border-neutral-800 bg-[#09090b]">
           <h3 className="text-sm font-bold text-white uppercase tracking-wider">Export Video</h3>
           <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
           </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">

          {downloadUrl ? (
             <div className="flex flex-col items-center gap-4 py-4">
                 <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                    <CheckCircleIcon className="w-8 h-8" />
                 </div>
                 <h4 className="text-lg font-semibold text-white">Export Complete!</h4>
                 <p className="text-sm text-neutral-400 text-center">Your video has been rendered and is ready for download.</p>

                 <a
                   href={downloadUrl}
                   download="veo-project.mp4"
                   className="mt-4 flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-900/40"
                 >
                    <DownloadIcon className="w-5 h-5" />
                    Download MP4
                 </a>

                 <button
                   onClick={onClose}
                   className="text-xs text-neutral-500 hover:text-neutral-300 mt-2"
                 >
                    Close
                 </button>
             </div>
          ) : isExporting ? (
             <div className="flex flex-col gap-4 py-6">
                <div className="flex items-center justify-between text-sm">
                   <span className="text-neutral-200 font-medium">Rendering...</span>
                   <span className="text-indigo-400 font-mono">{Math.round(progress)}%</span>
                </div>

                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                   <div
                      className="h-full bg-indigo-500 transition-all duration-100 ease-out"
                      style={{ width: `${progress}%` }}
                   ></div>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500 justify-center">
                   <SpinnerIcon className="w-4 h-4 animate-spin" />
                   <span>Processing frames and mixing audio...</span>
                </div>

                <div className="flex justify-center mt-4">
                    <button
                        onClick={onClose}
                        className="text-xs text-red-400 hover:text-red-300 border border-red-900/30 bg-red-900/10 px-3 py-1.5 rounded transition-colors"
                    >
                        Cancel Export
                    </button>
                </div>
             </div>
          ) : (
             <>
               <div className="space-y-6">
                  {/* Source Selection */}
                  <div className="space-y-3">
                     <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Source</label>
                     <div className="flex flex-col gap-2">
                        <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${source === 'all' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'}`}>
                           <input type="radio" name="source" value="all" checked={source === 'all'} onChange={() => setSource('all')} className="w-4 h-4 accent-indigo-500" />
                           <div className="ml-3 flex flex-col">
                              <span className={`text-sm font-medium ${source === 'all' ? 'text-white' : 'text-neutral-400'}`}>Entire Timeline</span>
                              <span className="text-[10px] text-neutral-500">Duration: {formatTime(totalDuration)}</span>
                           </div>
                        </label>

                        <label className={`flex items-center p-3 rounded-lg border transition-all ${!selectionBounds ? 'opacity-50 cursor-not-allowed bg-neutral-900 border-neutral-800' : (source === 'selection' ? 'bg-indigo-500/10 border-indigo-500/50 cursor-pointer' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 cursor-pointer')}`}>
                           <input type="radio" name="source" value="selection" checked={source === 'selection'} onChange={() => setSource('selection')} disabled={!selectionBounds} className="w-4 h-4 accent-indigo-500" />
                           <div className="ml-3 flex flex-col">
                              <span className={`text-sm font-medium ${source === 'selection' ? 'text-white' : 'text-neutral-400'}`}>Selection Only</span>
                              <span className="text-[10px] text-neutral-500">
                                  {selectionBounds ? `Duration: ${formatTime(selectionBounds.end - selectionBounds.start)}` : 'No clips selected'}
                              </span>
                           </div>
                        </label>
                     </div>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Resolution</label>
                         <div className="flex flex-col gap-2">
                            <button
                              onClick={() => setResolution('1080p')}
                              className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all flex items-center justify-between ${resolution === '1080p' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                            >
                               <span>1080p (Full HD)</span>
                               {getBadge(1080)}
                            </button>
                            <button
                              onClick={() => setResolution('720p')}
                              className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all flex items-center justify-between ${resolution === '720p' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                            >
                               <span>720p (HD)</span>
                               {getBadge(720)}
                            </button>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Anticipated Output</label>
                         <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-800 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-neutral-500">Format</span>
                               <span className="text-neutral-300 font-mono">MP4 (H.264)</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-neutral-500">Length</span>
                               <span className="text-neutral-300 font-mono">{formatTime(exportDuration)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-neutral-500">Est. Size</span>
                               <span className="text-neutral-300 font-mono">~{estimatedSize} MB</span>
                            </div>
                         </div>
                      </div>
                  </div>
               </div>

               <div className="mt-8 pt-6 border-t border-neutral-800 flex justify-end">
                  <button
                    onClick={() => onStartExport(resolution, source)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-neutral-200 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-white/5"
                  >
                     Start Render
                  </button>
               </div>
             </>
          )}

        </div>
      </div>
    </div>
  );
};