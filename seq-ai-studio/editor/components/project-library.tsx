

import React, { useRef, useState } from 'react';
import { MediaItem } from '../types';
import { MusicIcon, PanelLeftClose, TrashIcon } from './icons';

interface ProjectLibraryProps {
  media: MediaItem[];
  onSelect: (item: MediaItem) => void;
  selectedId: string | null;
  onAddToTimeline: (item: MediaItem) => void;
  onImport: (file: File) => void;
  onRemove: (item: MediaItem) => void;
  onClose: () => void;
}

interface LibraryItemProps {
  item: MediaItem;
  isSelected: boolean;
  onSelect: () => void;
  onAddToTimeline: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
  thumbnailSize: number;
}

const LibraryItem: React.FC<LibraryItemProps> = ({
  item,
  isSelected,
  onSelect,
  onAddToTimeline,
  onRemove,
  thumbnailSize
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current && item.status === 'ready' && item.type === 'video') {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => { });
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const height = Math.round(thumbnailSize * (9 / 16));

  return (
    <div
      className={`flex gap-3 p-2 rounded-lg group transition-all border relative cursor-pointer select-none ${isSelected
        ? 'bg-[#18181b] border-neutral-700 ring-1 ring-inset ring-neutral-700'
        : 'bg-transparent border-transparent hover:bg-[#18181b] hover:border-neutral-800'
        }`}
      onClick={onSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail / Preview */}
      <div
        style={{ width: thumbnailSize, height: height }}
        className="bg-black rounded overflow-hidden relative shrink-0 border border-neutral-800 shadow-sm transition-all duration-200 flex items-center justify-center"
      >
        {item.type === 'audio' ? (
          <div className="text-neutral-500">
            <MusicIcon className="w-6 h-6" />
          </div>
        ) : (
          item.status === 'ready' ? (
            <video
              ref={videoRef}
              src={item.url}
              className={`w-full h-full object-cover transition-opacity ${isHovering ? 'opacity-100' : 'opacity-70'}`}
              muted
              loop
              preload="metadata"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-900">
              <div className="animate-spin h-3 w-3 border border-neutral-600 border-t-white rounded-full"></div>
            </div>
          )
        )}
        {item.type === 'audio' && (
          <div className="absolute bottom-1 right-1 text-[8px] bg-black/50 text-white px-1 rounded">MP3</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <p className={`text-[11px] font-medium leading-tight truncate ${isSelected ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'
          }`}>
          {item.prompt || (item.type === 'audio' ? 'Audio Track' : 'Untitled Media')}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-neutral-600">{item.duration.toFixed(1)}s</span>
            <span className="text-[9px] text-neutral-600 border border-neutral-800 px-1 rounded bg-neutral-900 uppercase">{item.type}</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1.5 hover:bg-red-900/30 rounded text-neutral-600 hover:text-red-400 transition-all transform hover:scale-110"
              title="Remove from Library"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(e);
              }}
            >
              <TrashIcon className="w-3 h-3" />
            </button>
            <button
              className="p-1.5 bg-neutral-800 hover:bg-indigo-600 hover:text-white rounded text-neutral-500 transition-all transform hover:scale-110"
              title="Add to Timeline"
              onClick={(e) => {
                e.stopPropagation();
                onAddToTimeline(e);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ProjectLibrary: React.FC<ProjectLibraryProps> = ({
  media,
  onSelect,
  selectedId,
  onAddToTimeline,
  onImport,
  onRemove,
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailSize, setThumbnailSize] = useState(84);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full flex flex-col bg-[#09090b] border-r border-neutral-800 h-full">

      {/* Panel Header */}
      <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Project Library</h2>
        </div>
        <div
          className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer text-neutral-500 transition-colors"
          onClick={onClose}
        >
          <PanelLeftClose className="w-4 h-4" />
        </div>
      </div>

      {/* Media Count & Controls */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-800/50 bg-[#09090b] gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider shrink-0">Media ({media.length})</span>

          {/* Thumbnail Sizer */}
          <div className="flex items-center gap-1.5 flex-1 max-w-[80px] group" title="Adjust Thumbnail Size">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-600"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            <input
              type="range"
              min="60"
              max="160"
              value={thumbnailSize}
              onChange={(e) => setThumbnailSize(Number(e.target.value))}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-neutral-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:bg-neutral-300"
            />
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*,audio/*"
          className="hidden"
        />

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-[10px] font-medium text-white transition-all shadow-sm shadow-indigo-900/20 shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
          Import
        </button>
      </div>

      {/* Clips List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
        {media.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-3 text-neutral-600">
            <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
            </div>
            <p className="text-xs">Import or Generate clips to start.</p>
          </div>
        )}
        {media.map(item => (
          <LibraryItem
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            onSelect={() => onSelect(item)}
            onAddToTimeline={(e) => onAddToTimeline(item)}
            onRemove={(e) => onRemove(item)}
            thumbnailSize={thumbnailSize}
          />
        ))}
      </div>
    </div>
  );
};
