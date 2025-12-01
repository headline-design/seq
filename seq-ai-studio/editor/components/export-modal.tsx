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
  loaded: boolean;
  loading: boolean;
  loadFFmpeg: () => Promise<void>;
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
  loaded,
  loading,
  loadFFmpeg
}) => {
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [source, setSource] = useState<'all' | 'selection'>('all');
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
      if (isOpen && !selectionBounds) {
          setSource('all');
      }
      // Reset initialization state when opening
      if (isOpen) {
          setIsInitializing(false);
      }
  }, [isOpen, selectionBounds]);

  if (!isOpen) return null;

  const exportDuration = source === 'all'
      ? totalDuration
      : (selectionBounds ? selectionBounds.end - selectionBounds.start : totalDuration);

  const formatTime = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartClick = async () => {
      if (!loaded) {
          setIsInitializing(true);
          try {
              await loadFFmpeg();
          } catch (e) {
              console.error("Failed to load engine on demand", e);
              setIsInitializing(false);
              return;
          }
      }
      onStartExport(resolution, source);
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

        {/* Content */}
        <div className="p-6">
          {downloadUrl ? (
             <div className="flex flex-col items-center gap-4 py-4 animate-in zoom-in-95">
                 <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                    <CheckCircleIcon className="w-8 h-8" />
                 </div>
                 <h4 className="text-lg font-semibold text-white">Export Complete!</h4>

                 <a
                   href={downloadUrl}
                   download="project_export.mp4"
                   className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg"
                 >
                    <DownloadIcon className="w-4 h-4" />
                    Download MP4
                 </a>
                 <button onClick={onClose} className="text-sm text-neutral-500 hover:text-white">Close</button>
             </div>
          ) : isExporting || isInitializing ? (
             <div className="flex flex-col gap-4 py-6">
                <div className="flex justify-between text-sm mb-1">
                   <span className="text-neutral-300">
                       {isInitializing ? "Initializing Engine..." : "Rendering..."}
                   </span>
                   {!isInitializing && <span className="text-indigo-400">{Math.round(progress)}%</span>}
                </div>
                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                    {isInitializing ? (
                        <div className="h-full bg-indigo-500/50 w-full animate-pulse"></div>
                    ) : (
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    )}
                </div>
                <p className="text-xs text-center text-neutral-500">
                    {isInitializing
                        ? "Loading FFmpeg core components. This only happens once."
                        : "Processing transitions, audio mixing and video frames..."}
                </p>
             </div>
          ) : (
             <div className="flex flex-col gap-6">
                {/* Source Select */}
                <div className="space-y-3">
                   <label className="text-xs font-bold text-neutral-500 uppercase">Export Range</label>
                   <div className="flex gap-3">
                      <button
                        onClick={() => setSource('all')}
                        className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${source === 'all' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-200' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}`}
                      >
                         Full Timeline
                      </button>
                      <button
                         onClick={() => setSource('selection')}
                         disabled={!selectionBounds}
                         className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${source === 'selection' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-200' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'} ${!selectionBounds && 'opacity-50 cursor-not-allowed'}`}
                      >
                         Selection
                      </button>
                   </div>
                   <p className="text-[11px] text-neutral-500 text-right">Duration: {formatTime(exportDuration)}</p>
                </div>

                {/* Resolution */}
                <div className="space-y-3">
                   <label className="text-xs font-bold text-neutral-500 uppercase">Quality</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button
                         onClick={() => setResolution('1080p')}
                         className={`p-3 rounded-lg border text-left transition-all ${resolution === '1080p' ? 'bg-indigo-500/10 border-indigo-500' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'}`}
                      >
                         <div className={`text-sm font-medium ${resolution === '1080p' ? 'text-indigo-200' : 'text-neutral-300'}`}>1080p High</div>
                         <div className="text-[10px] text-neutral-500 mt-1">1920x1080 • ~{(exportDuration * 1.5).toFixed(1)}MB</div>
                      </button>
                      <button
                         onClick={() => setResolution('720p')}
                         className={`p-3 rounded-lg border text-left transition-all ${resolution === '720p' ? 'bg-indigo-500/10 border-indigo-500' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'}`}
                      >
                         <div className={`text-sm font-medium ${resolution === '720p' ? 'text-indigo-200' : 'text-neutral-300'}`}>720p Fast</div>
                         <div className="text-[10px] text-neutral-500 mt-1">1280x720 • ~{(exportDuration * 0.8).toFixed(1)}MB</div>
                      </button>
                   </div>
                </div>

                <button
                  onClick={handleStartClick}
                  disabled={loading}
                  className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors shadow-lg mt-2 flex items-center justify-center gap-2"
                >
                   {loading ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : null}
                   Start Export
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
