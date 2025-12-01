import React from 'react';
import { MagicIcon, PanelLeftClose } from './icons'

interface CreatePanelProps {
  onGenerate: (prompt: string, aspectRatio: string) => void;
  isGenerating: boolean;
  onClose: () => void;
}

export const CreatePanel: React.FC<CreatePanelProps> = ({ onGenerate, isGenerating, onClose }) => {
  const [prompt, setPrompt] = React.useState('');
  const [aspectRatio, setAspectRatio] = React.useState('16:9');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, aspectRatio);
      setPrompt('');
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#09090b] border-r border-neutral-800 h-full">
      {/* Header */}
      <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-neutral-800">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Generate Video</h2>
        <div
          className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer text-neutral-500 transition-colors"
          onClick={onClose}
        >
           <PanelLeftClose className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300">Model</label>
            <div className="p-3 bg-[#18181b] border border-neutral-700 rounded-lg flex items-center justify-between">
                <span className="text-sm text-neutral-200">Veo 3.1 (Preview)</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">Fast</span>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300">Prompt</label>
            <textarea
              className="w-full bg-[#18181b] border border-neutral-700 rounded-lg p-3 text-[13px] text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 min-h-[120px] resize-none transition-all shadow-sm"
              placeholder="Describe the video you want to generate in detail..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
                {['16:9', '9:16', '1:1'].map((ratio) => (
                    <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 px-3 rounded-md text-xs font-medium border transition-all ${
                            aspectRatio === ratio
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-[#18181b] border-neutral-700 text-neutral-400 hover:border-neutral-600'
                        }`}
                    >
                        {ratio}
                    </button>
                ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className={`mt-4 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-all ${
              isGenerating || !prompt.trim()
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-900/25 border border-white/10'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <MagicIcon className="w-4 h-4" />
                <span>Generate Video</span>
              </>
            )}
          </button>
        </form>

        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg">
            <h4 className="text-amber-500 text-[11px] font-bold uppercase mb-1">Note</h4>
            <p className="text-xs text-amber-200/60 leading-relaxed">
                Generation usually takes 10-20 seconds. Ensure your API key has access to the Veo models.
            </p>
        </div>
      </div>
    </div>
  );
};