

import React from 'react';
import { TimelineClip, MediaItem, Track } from '../types';
import { FilmIcon, MusicIcon, InfoIcon, PanelLeftClose, VolumeIcon } from './icons';

interface InspectorPanelProps {
    onClose: () => void;
    selectedClipId: string | null;
    clips: TimelineClip[];
    mediaMap: Record<string, MediaItem>;
    tracks: Track[];
    onUpdateClip: (id: string, changes: Partial<TimelineClip>) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ onClose, selectedClipId, clips, mediaMap, tracks, onUpdateClip }) => {

    const clip = clips.find(c => c.id === selectedClipId);
    const media = clip ? mediaMap[clip.mediaId] : null;
    const track = clip ? tracks.find(t => t.id === clip.trackId) : null;

    return (
        <div className="w-full flex flex-col bg-[#09090b] border-r border-neutral-800 h-full">
            {/* Header */}
            <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-neutral-800">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Inspector</h2>
                <div
                    className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer text-neutral-500 transition-colors"
                    onClick={onClose}
                >
                    <PanelLeftClose className="w-4 h-4" />
                </div>
            </div>

            <div className="p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
                {!clip || !media ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 opacity-50">
                        <InfoIcon className="w-8 h-8 text-neutral-600" />
                        <p className="text-xs text-neutral-500">Select a clip to view properties</p>
                    </div>
                ) : (
                    <>
                        {/* Media Identity */}
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                <div className="w-16 h-16 bg-black rounded border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                                    {media.type === 'video' ? (
                                        <video src={media.url} className="w-full h-full object-cover opacity-70" />
                                    ) : (
                                        <MusicIcon className="w-6 h-6 text-neutral-600" />
                                    )}
                                </div>
                                <div className="flex flex-col justify-center min-w-0">
                                    <h3 className="text-sm font-semibold text-neutral-200 truncate pr-2" title={media.prompt}>{media.prompt || 'Untitled Clip'}</h3>
                                    <span className="text-[10px] text-neutral-500 font-mono mt-1">{clip.id}</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-neutral-800" />

                        {/* Clip Adjustments */}
                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] uppercase font-bold text-neutral-500">Audio</label>
                            <div className="bg-[#18181b] rounded-lg border border-neutral-800 p-3 flex flex-col gap-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <div className="flex items-center gap-2 text-neutral-300">
                                        <VolumeIcon className="w-3.5 h-3.5 text-neutral-500" />
                                        <span>Volume</span>
                                    </div>
                                    <span className="font-mono text-neutral-400">{Math.round((clip.volume ?? 1) * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={clip.volume ?? 1}
                                    onChange={(e) => onUpdateClip(clip.id, { volume: parseFloat(e.target.value) })}
                                    className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                />
                            </div>
                        </div>

                        {/* Properties Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-neutral-600">Track</label>
                                <div className="p-2 bg-[#18181b] rounded border border-neutral-800 text-xs text-neutral-300 flex flex-col gap-0.5">
                                    <span className="font-semibold text-neutral-200">{track?.name || clip.trackId}</span>
                                    <span className="text-[10px] text-neutral-500 capitalize">{track?.type || 'Unknown'} Track</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] uppercase font-bold text-neutral-600">Media Type</label>
                                <div className="p-2 bg-[#18181b] rounded border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2 h-full">
                                    {media.type === 'video' ? <FilmIcon className="w-3.5 h-3.5 text-indigo-400" /> : <MusicIcon className="w-3.5 h-3.5 text-emerald-400" />}
                                    <span className="capitalize">{media.type}</span>
                                </div>
                            </div>
                        </div>

                        {/* Timing */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1">Timing</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-[#18181b] rounded border border-neutral-800 flex flex-col gap-0.5">
                                    <span className="text-[9px] text-neutral-600">Timeline Start</span>
                                    <span className="text-xs font-mono text-indigo-300">{clip.start.toFixed(2)}s</span>
                                </div>
                                <div className="p-2 bg-[#18181b] rounded border border-neutral-800 flex flex-col gap-0.5">
                                    <span className="text-[9px] text-neutral-600">Timeline End</span>
                                    <span className="text-xs font-mono text-neutral-300">{(clip.start + clip.duration).toFixed(2)}s</span>
                                </div>
                                <div className="p-2 bg-[#18181b] rounded border border-neutral-800 flex flex-col gap-0.5">
                                    <span className="text-[9px] text-neutral-600">Duration</span>
                                    <span className="text-xs font-mono text-neutral-300">{clip.duration.toFixed(2)}s</span>
                                </div>
                                <div className="p-2 bg-[#18181b] rounded border border-neutral-800 flex flex-col gap-0.5">
                                    <span className="text-[9px] text-neutral-600">Source Offset</span>
                                    <span className="text-xs font-mono text-neutral-300">{clip.offset.toFixed(2)}s</span>
                                </div>
                            </div>
                        </div>

                        {/* Media Details */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1">Source Info</label>
                            <div className="bg-[#18181b] rounded-lg border border-neutral-800 p-3 space-y-2">
                                {media.type === 'video' && media.resolution && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-neutral-500">Resolution</span>
                                        <span className="text-neutral-300 font-mono">{media.resolution.width} x {media.resolution.height}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500">Aspect Ratio</span>
                                    <span className="text-neutral-300 font-mono">{media.aspectRatio}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500">Total Length</span>
                                    <span className="text-neutral-300 font-mono">{media.duration.toFixed(2)}s</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500">Source ID</span>
                                    <span className="text-neutral-300 font-mono text-[10px] truncate max-w-[120px]">{media.id}</span>
                                </div>
                            </div>
                        </div>

                        {/* Transition */}
                        {clip.transition && clip.transition.type !== 'none' && (
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold text-neutral-500 mb-1">Effects</label>
                                <div className="bg-indigo-900/10 rounded-lg border border-indigo-500/20 p-3 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-indigo-300 capitalize">{clip.transition.type.replace('-', ' ')}</span>
                                        <span className="text-[10px] text-neutral-500">Transition</span>
                                    </div>
                                    <div className="text-xs font-mono text-indigo-300/80">
                                        {clip.transition.duration}s
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};