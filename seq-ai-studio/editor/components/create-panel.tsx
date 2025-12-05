import React from 'react';
import { MagicIcon, PanelLeftClose } from './icons'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface CreatePanelProps {
  onGenerate: (prompt: string, aspectRatio: string, type: 'video' | 'image', model: string, image?: string) => void;
  isGenerating: boolean;
  onClose: () => void;
  generatedItem: { url: string; type: 'video' | 'image' } | null;
}

export const CreatePanel: React.FC<CreatePanelProps> = ({ onGenerate, isGenerating, onClose, generatedItem }) => {
  const [activeTab, setActiveTab] = React.useState<'video' | 'image'>('video');
  const [prompt, setPrompt] = React.useState('');
  const [aspectRatio, setAspectRatio] = React.useState('16:9');
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const [videoModel, setVideoModel] = React.useState('fal-ai/minimax-video');
  const [imageModel, setImageModel] = React.useState('google/gemini-3-pro-image');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      const model = activeTab === 'video' ? videoModel : imageModel;
      onGenerate(prompt, aspectRatio, activeTab, model, selectedImage || undefined);
      // Don't clear image automatically as user might want to generate again with different prompt
      // but if successful, typically we might want to? leave it for now.
      setPrompt('');
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#09090b] border-r border-neutral-800 h-full">
      {/* Header */}
      <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-neutral-800">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Create</h2>
        <div
          className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer text-neutral-500 transition-colors"
          onClick={onClose}
        >
          <PanelLeftClose className="w-4 h-4" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 pt-4 gap-2">
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'video'
            ? 'bg-neutral-800 text-white shadow-sm'
            : 'text-neutral-500 hover:text-neutral-300'
            }`}
        >
          Video
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'image'
            ? 'bg-neutral-800 text-white shadow-sm'
            : 'text-neutral-500 hover:text-neutral-300'
            }`}
        >
          Image
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300">Model</label>
            {activeTab === 'video' ? (
              <select
                value={videoModel}
                onChange={(e) => setVideoModel(e.target.value)}
                className="w-full bg-[#18181b] border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500/50"
              >
                <option value="fal-ai/minimax-video">Minimax (Fast)</option>
                <option value="fal-ai/hunyuan-video">Hunyuan (Best Quality)</option>
              </select>
            ) : (
              <div className="w-full bg-[#18181b]/50 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-400 cursor-not-allowed flex items-center justify-between">
                <span>Nano Banana Pro</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">DEFAULT</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300">Image Input (Optional)</label>
            {!selectedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-neutral-700 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-800/50 hover:border-neutral-600 transition-all group"
              >
                <div className="p-2 rounded-full bg-neutral-800 group-hover:bg-neutral-700 transition-colors">
                  <Upload className="w-4 h-4 text-neutral-400 group-hover:text-neutral-300" />
                </div>
                <span className="text-xs text-neutral-500 group-hover:text-neutral-400">Click to upload image</span>
              </div>
            ) : (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-neutral-700 group">
                <img src={selectedImage} alt="Input" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={handleRemoveImage}
                    className="p-1.5 rounded-full bg-neutral-800/80 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10 hover:border-red-500/50 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />
          </div>
        </div>

        {generatedItem && (
          <div className="space-y-2 pb-4 border-b border-neutral-800">
            <label className="text-xs font-medium text-neutral-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Last Generated Result
            </label>
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-neutral-700 shadow-sm">
              {generatedItem.type === 'video' ? (
                <video src={generatedItem.url} controls className="w-full h-full object-contain" />
              ) : (
                <img src={generatedItem.url} alt="Generated" className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300">Prompt</label>
            <textarea
              className="w-full bg-[#18181b] border border-neutral-700 rounded-lg p-3 text-[13px] text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 min-h-[120px] resize-none transition-all shadow-sm"
              placeholder={activeTab === 'video' ? "Describe the video you want to generate..." : "Describe the image you want to generate..."}
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
                  className={`py-2 px-3 rounded-md text-xs font-medium border transition-all ${aspectRatio === ratio
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
            className={`mt-4 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-all ${isGenerating || !prompt.trim()
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
                <span>Generate {activeTab === 'video' ? 'Video' : 'Image'}</span>
              </>
            )}
          </button>
        </form>

        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg">
          <h4 className="text-amber-500 text-[11px] font-bold uppercase mb-1">Note</h4>
          <p className="text-xs text-amber-200/60 leading-relaxed">
            {activeTab === 'video'
              ? "Generation usually takes 20-60 seconds depending on the model."
              : "Generation usually takes 5-10 seconds."}
          </p>
        </div>
      </div>
    </div>
  );
};