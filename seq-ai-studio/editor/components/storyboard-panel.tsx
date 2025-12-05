


import React, { useState } from 'react';
import { StoryboardPanel as IStoryboardPanel, VideoConfig } from '../types';
import { PanelLeftClose, PlusIcon, TrashIcon, MagicIcon, FilmIcon, Sparkles, SettingsIcon, CheckIcon } from './icons';

interface StoryboardPanelProps {
    onClose: () => void;
    panels: IStoryboardPanel[];
    masterDescription: string;
    isEnhancingMaster: boolean;
    setIsEnhancingMaster: (isEnhancing: boolean) => void;
    setIsEnhancing: (isEnhancing: boolean) => void;
    setMasterDescription: (desc: string) => void;
    setPrompt: (prompt: string) => void;
    videoConfig: VideoConfig;
    setVideoConfig: (config: VideoConfig) => void;
    onAddPanel: () => void;
    onUpdatePanel: (id: string, changes: Partial<IStoryboardPanel>) => void;
    onDeletePanel: (id: string) => void;
    onGenerateImage: (id: string, prompt: string) => void;
    onGenerateVideo: (id: string, prompt: string, image1Base64?: string, image2Base64?: string, useFastModel?: boolean) => void;
    onAddToTimeline: (panel: IStoryboardPanel) => void;
}

export const StoryboardPanel: React.FC<StoryboardPanelProps> = ({
    onClose,
    panels,
    masterDescription,
    setMasterDescription,
    setIsEnhancing,
    setPrompt,
    isEnhancingMaster,
    setIsEnhancingMaster,
    videoConfig,
    setVideoConfig,
    onAddPanel,
    onUpdatePanel,
    onDeletePanel,
    onGenerateImage,
    onGenerateVideo,
    onAddToTimeline
}) => {

    const handleEnhance = async (panelId: string, prompt: string) => {
        if (!prompt.trim()) return

        setIsEnhancing(true)
        try {
            const response = await fetch("/api/enhance-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            })

            if (!response.ok) {
                throw new Error("Enhancement failed")
            }

            const data = await response.json()
            if (data.enhancedPrompt) {
                setPrompt(data.enhancedPrompt)
            }
        } catch (error) {
            console.error("Error enhancing prompt:", error)
        } finally {
            setIsEnhancing(false)
        }
    }


    const handleEnhanceMaster = async () => {
        if (!masterDescription.trim()) return;
        setIsEnhancingMaster(true);
        const response = await fetch("/api/enhance-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: masterDescription }),
        });
        if (!response.ok) {
            setIsEnhancingMaster(false);
            console.error("Enhancement failed");
            return;
        }
        const data = await response.json();
        const enhanced = data.enhancedPrompt || masterDescription;


        setMasterDescription(enhanced);
        setIsEnhancingMaster(false);
    };

    return (
        <div className="w-full flex flex-col bg-[#09090b] border-r border-neutral-800 h-full">
            {/* Header */}
            <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-neutral-800 bg-[#09090b] z-10">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Storyboard</h2>
                <div
                    className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer text-neutral-500 transition-colors"
                    onClick={onClose}
                >
                    <PanelLeftClose className="w-4 h-4" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-4 flex flex-col gap-6">

                    {/* Master Context */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Master Context</label>
                            <button
                                onClick={handleEnhanceMaster}
                                disabled={isEnhancingMaster || !masterDescription.trim()}
                                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-colors"
                            >
                                {isEnhancingMaster ? (
                                    <div className="animate-spin w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                ) : (
                                    <Sparkles className="w-3 h-3" />
                                )}
                                Enhance
                            </button>
                        </div>
                        <textarea
                            value={masterDescription}
                            onChange={(e) => setMasterDescription(e.target.value)}
                            placeholder="Describe the overall story, style, and atmosphere..."
                            className="w-full bg-[#18181b] border border-neutral-800 rounded p-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 min-h-[60px] resize-y"
                        />
                    </div>

                    {/* Global Settings */}
                    <div className="flex flex-col gap-2 bg-[#18181b] p-3 rounded-lg border border-neutral-800">
                        <div className="flex items-center gap-2 mb-2 text-neutral-400">
                            <SettingsIcon className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Video Settings</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-neutral-500">Aspect Ratio</span>
                                <div className="flex gap-1 bg-black/20 rounded p-0.5">
                                    {['16:9', '9:16'].map(ratio => (
                                        <button
                                            key={ratio}
                                            onClick={() => setVideoConfig({ ...videoConfig, aspectRatio: ratio as any })}
                                            className={`flex-1 py-1 text-[9px] rounded ${videoConfig.aspectRatio === ratio ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                                        >
                                            {ratio}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] text-neutral-500">Model Quality</span>
                                <div className="flex gap-1 bg-black/20 rounded p-0.5">
                                    <button
                                        onClick={() => setVideoConfig({ ...videoConfig, useFastModel: true })}
                                        className={`flex-1 py-1 text-[9px] rounded ${videoConfig.useFastModel ? 'bg-indigo-600/80 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                                    >
                                        Fast
                                    </button>
                                    <button
                                        onClick={() => setVideoConfig({ ...videoConfig, useFastModel: false })}
                                        className={`flex-1 py-1 text-[9px] rounded ${!videoConfig.useFastModel ? 'bg-purple-600/80 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                                    >
                                        High
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Panels */}
                    <div className="flex flex-col gap-4 pb-20">
                        {panels.length === 0 && (
                            <div className="text-center py-8 opacity-50 text-xs text-neutral-500">
                                Add panels to start your sequence.
                            </div>
                        )}

                        {panels.map((panel, index) => {
                            const isTransition = panel.type === 'transition';

                            return (
                                <div key={panel.id} className={`rounded-lg border overflow-hidden shadow-sm group transition-all ${isTransition ? 'bg-[#13131f] border-indigo-500/20' : 'bg-[#18181b] border-neutral-800'}`}>

                                    {/* Panel Header */}
                                    <div className={`px-3 py-2 border-b flex justify-between items-center ${isTransition ? 'bg-[#1a1a2e] border-indigo-900/30' : 'bg-[#202024] border-neutral-800'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold ${isTransition ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white'}`}>
                                                {index + 1}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase ${isTransition ? 'text-indigo-400' : 'text-neutral-500'}`}>
                                                {isTransition ? `Keyframes` : `Shot`}
                                            </span>

                                            {/* Type Toggle */}
                                            <div className="flex bg-black/20 rounded p-0.5 ml-2">
                                                <button
                                                    onClick={() => onUpdatePanel(panel.id, { type: 'scene', linkedImageUrl: undefined })}
                                                    className={`px-1.5 py-0.5 text-[8px] rounded ${!isTransition ? 'bg-neutral-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                                                >
                                                    Shot
                                                </button>
                                                <button
                                                    onClick={() => onUpdatePanel(panel.id, { type: 'transition' })}
                                                    className={`px-1.5 py-0.5 text-[8px] rounded ${isTransition ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                                                >
                                                    Keyframes
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onDeletePanel(panel.id)}
                                            className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <TrashIcon className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <div className="p-3 flex flex-col gap-3">
                                        {/* Prompt Input */}
                                        <div className="relative">
                                            <textarea
                                                value={panel.prompt}
                                                onChange={(e) => onUpdatePanel(panel.id, { prompt: e.target.value })}
                                                placeholder={isTransition ? "Describe the motion between keyframes (e.g. 'Morph smoothly')..." : "Describe the shot..."}
                                                className="w-full bg-[#0c0c0e] border border-neutral-700 rounded p-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 min-h-[60px] resize-y pr-6"
                                            />
                                            <button
                                                onClick={() => handleEnhance(panel.id, panel.prompt)}
                                                disabled={!panel.prompt || panel.status === 'enhancing'}
                                                className="absolute bottom-2 right-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-colors"
                                                title="Enhance Prompt using Master Context"
                                            >
                                                {panel.status === 'enhancing' ? (
                                                    <div className="animate-spin w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                                ) : (
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Duration Selector */}
                                        <div className="flex justify-end gap-2">
                                            {[5, 8].map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => onUpdatePanel(panel.id, { duration: d as 5 | 8 })}
                                                    className={`px-2 py-0.5 text-[9px] rounded border ${panel.duration === d ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-transparent border-transparent text-neutral-600 hover:text-neutral-400'}`}
                                                >
                                                    {d}s
                                                </button>
                                            ))}
                                        </div>

                                        {/* Media Area */}
                                        {isTransition ? (
                                            /* Transition Layout: Start -> End */
                                            <div className="flex gap-2 items-center">
                                                <div className="relative flex-1 aspect-video bg-[#0c0c0e] rounded border border-neutral-800 overflow-hidden group/media">
                                                    {panel.imageUrl ? (
                                                        <img src={panel.imageUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-700 gap-1">
                                                            <span className="text-[9px]">Start</span>
                                                            <span className="text-[8px] opacity-50">(Use prev)</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-neutral-600">→</div>
                                                <div className="relative flex-1 aspect-video bg-[#0c0c0e] rounded border border-neutral-800 overflow-hidden group/media">
                                                    {panel.linkedImageUrl ? (
                                                        <img src={panel.linkedImageUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-700 gap-1">
                                                            <span className="text-[9px]">End</span>
                                                            <span className="text-[8px] opacity-50">(Use next)</span>
                                                        </div>
                                                    )}
                                                    {/* Simple input for linking if empty */}
                                                    {!panel.linkedImageUrl && (
                                                        <input
                                                            type="text"
                                                            placeholder="Paste URL"
                                                            className="absolute inset-x-1 bottom-1 bg-black/50 text-[8px] border border-white/10 rounded px-1 text-white focus:outline-none"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') onUpdatePanel(panel.id, { linkedImageUrl: e.currentTarget.value });
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Scene Layout */
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="relative aspect-video bg-[#0c0c0e] rounded border border-neutral-800 overflow-hidden group/media">
                                                    {panel.imageUrl ? (
                                                        <img src={panel.imageUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            {panel.status === 'generating-image' ? (
                                                                <div className="animate-spin w-4 h-4 border-2 border-neutral-600 border-t-neutral-400 rounded-full" />
                                                            ) : (
                                                                <span className="text-[9px] text-neutral-700">No Image</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {!panel.imageUrl && !panel.status.startsWith('generating') && panel.prompt && (
                                                        <button
                                                            onClick={() => onGenerateImage(panel.id, panel.prompt)}
                                                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity hover:bg-black/60"
                                                        >
                                                            <div className="flex flex-col items-center gap-1 text-neutral-300">
                                                                <MagicIcon className="w-4 h-4" />
                                                                <span className="text-[9px] font-medium">Gen Image</span>
                                                            </div>
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="relative aspect-video bg-[#0c0c0e] rounded border border-neutral-800 overflow-hidden">
                                                    {panel.videoUrl ? (
                                                        <video src={panel.videoUrl} className="w-full h-full object-cover" controls muted />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            {panel.status === 'generating-video' ? (
                                                                <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-indigo-400 rounded-full" />
                                                            ) : (
                                                                <span className="text-[9px] text-neutral-700">No Video</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Bar */}
                                        <div className="flex justify-between items-center pt-1">
                                            <div className="text-[9px] text-neutral-600 font-mono">
                                                {videoConfig.useFastModel ? 'Veo Fast' : 'Veo Quality'}
                                            </div>

                                            <div className="flex gap-2">
                                                {!panel.videoUrl && !panel.status.startsWith('generating') && (
                                                    <button
                                                        onClick={() => onGenerateVideo(panel.id, panel.prompt, panel.imageUrl, panel.linkedImageUrl, videoConfig.useFastModel)}
                                                        disabled={!panel.prompt || (isTransition && (!panel.imageUrl || !panel.linkedImageUrl))}
                                                        className="flex items-center gap-1.5 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <FilmIcon className="w-3 h-3" />
                                                        {isTransition ? 'Interpolate' : 'Animate'}
                                                    </button>
                                                )}

                                                {panel.videoUrl && (
                                                    <button
                                                        onClick={() => onAddToTimeline(panel)}
                                                        className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-medium rounded border border-indigo-500/30 transition-colors"
                                                    >
                                                        <PlusIcon className="w-3 h-3" /> Timeline
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {panel.error && (
                                            <div className="text-[10px] text-red-400 bg-red-900/10 p-2 rounded border border-red-900/30">
                                                Error: {panel.error}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        <button
                            onClick={onAddPanel}
                            className="w-full py-3 rounded-lg border border-dashed border-neutral-700 hover:border-neutral-500 text-neutral-500 hover:text-neutral-300 transition-all flex items-center justify-center gap-2 text-xs font-medium"
                        >
                            <PlusIcon className="w-4 h-4" /> Add Panel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
