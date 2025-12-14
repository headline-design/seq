import React from 'react';
import {
  LogoIcon,
  ArrowRightIcon,
  MagicIcon,
  FilmIcon,
  GridIcon,
  DownloadIcon,
  ZapIcon,
  GithubIcon,
  PlayIcon,
  BrainIcon,
  LinkIcon,
  CheckSquareIcon,
  SlidersIcon,
  VideoIcon,
  ImageIcon
} from './icons';
import Link from 'next/link';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden selection:bg-indigo-500/30">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <LogoIcon className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Seq</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <Link href="/storyboard" className="hover:text-white transition-colors">Storyboard</Link>
            <Link href="/timeline" className="hover:text-white transition-colors">Timeline</Link>
             <Link href="/image-playground" className="hover:text-white transition-colors">Image Playground</Link>
             <Link href="/demo" className="hover:text-white transition-colors">Demo</Link>
          </div>


          <div className="flex items-center gap-4">
             <a href="https://github.com/headline-design/seq" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                <GithubIcon className="w-5 h-5" />
             </a>
             <Link href="/storyboard" className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-neutral-200 transition-colors">
                Get Started
             </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
         {/* Background Gradients */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] -z-10 pointer-events-none opacity-50"></div>
         <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

         <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
               </span>
               Powered by Gemini Veo 3.1 & Wan 2.5
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
               From Concept to <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient">Cinema.</span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
               The first AI-native NLE designed for storytellers. Generate storyboards, animate panels, and edit on a professional timeline—all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
               <Link href="/storyboard" className="h-12 px-8 rounded-full bg-white text-black font-semibold text-base hover:bg-neutral-200 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105">
                  <BrainIcon className="w-4 h-4" />
                  Start Storyboard
               </Link>
               <Link href="/timeline" className="h-12 px-8 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-base hover:bg-white/10 transition-all flex items-center gap-2">
                  Open Editor
                  <ArrowRightIcon className="w-4 h-4" />
               </Link>
            </div>
         </div>
      </section>

      {/* Product Mockup */}
      <section className="px-4 md:px-6 pb-24 overflow-hidden">
         <div className="max-w-6xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-b from-indigo-500/20 to-transparent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-1000"></div>

            {/* Mockup Container */}
            <div className="relative bg-[#09090b] border border-white/10 rounded-xl shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[21/9]">
               {/* Mockup Header */}
               <div className="h-8 border-b border-white/10 bg-[#0c0c0e] flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  </div>
                  <div className="ml-4 h-4 w-32 bg-white/5 rounded-full"></div>
               </div>

               {/* Mockup Body */}
               <div className="flex h-full">
                  {/* Sidebar Mockup */}
                  <div className="w-16 border-r border-white/10 flex flex-col items-center py-4 gap-6 bg-[#0c0c0e]">
                     <div className="w-8 h-8 rounded bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                        <MagicIcon className="w-4 h-4 text-indigo-400" />
                     </div>
                     <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center"><GridIcon className="w-4 h-4 text-neutral-600" /></div>
                     <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center"><FilmIcon className="w-4 h-4 text-neutral-600" /></div>
                  </div>

                  {/* Content Mockup */}
                  <div className="flex-1 flex flex-col">
                     <div className="flex-1 bg-[#050505] relative flex items-center justify-center">
                        {/* Fake Video Player */}
                        <div className="w-[60%] aspect-video bg-neutral-900 rounded-lg shadow-2xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                             <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20"></div>
                             <PlayIcon className="w-12 h-12 text-white/20" />

                             {/* Floating Elements */}
                             <div className="absolute bottom-4 left-4 flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur"></div>
                                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur"></div>
                             </div>
                        </div>
                     </div>

                     {/* Timeline Mockup */}
                     <div className="h-32 border-t border-white/10 bg-[#0c0c0e] p-4 flex flex-col gap-2 relative overflow-hidden">
                        <div className="flex gap-1 mb-2">
                           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full w-1/3 bg-neutral-700"></div>
                           </div>
                        </div>
                        {/* Tracks */}
                        <div className="flex gap-1 relative">
                            {/* Playhead */}
                            <div className="absolute left-[30%] -top-6 bottom-0 w-px bg-indigo-500 z-10">
                               <div className="absolute top-0 -left-1.5 w-3 h-3 bg-indigo-500 rotate-45"></div>
                            </div>

                            <div className="h-10 w-32 bg-indigo-500/20 border border-indigo-500/40 rounded-md"></div>
                            <div className="h-10 w-48 bg-indigo-500/20 border border-indigo-500/40 rounded-md"></div>
                            <div className="h-10 w-24 bg-indigo-500/20 border border-indigo-500/40 rounded-md"></div>
                        </div>
                        <div className="flex gap-1 mt-1">
                            <div className="h-6 w-24 bg-emerald-500/10 border border-emerald-500/20 rounded-md ml-12"></div>
                            <div className="h-6 w-64 bg-emerald-500/10 border border-emerald-500/20 rounded-md"></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Storyboard Workflow Section */}
      <section id="pipeline" className="py-24 bg-[#0c0c0e] border-y border-white/5 relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 relative z-10">
             <div className="text-center mb-16 max-w-2xl mx-auto">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-300 mb-6">
                    <BrainIcon className="w-3 h-3" />
                    AI Workflow
                 </div>
                 <h2 className="text-3xl md:text-4xl font-bold mb-4">From Text to Timeline in 5 Steps</h2>
                 <p className="text-neutral-400">
                     Our automated pipeline handles the heavy lifting. You focus on the story.
                 </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                 {/* Step 1 */}
                 <div className="p-6 rounded-2xl bg-[#18181b] border border-white/5 relative group hover:border-indigo-500/30 transition-all">
                     <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl font-bold font-mono">01</div>
                     <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                         <BrainIcon className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-semibold mb-2">Master Generator</h3>
                     <p className="text-sm text-neutral-400 leading-relaxed">
                         Uses <strong>Gemini 3 Pro</strong> to brainstorm scenes and generate storyboard panels from your text prompts.
                     </p>
                 </div>

                 {/* Step 2 */}
                 <div className="p-6 rounded-2xl bg-[#18181b] border border-white/5 relative group hover:border-purple-500/30 transition-all">
                     <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl font-bold font-mono">02</div>
                     <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                         <LinkIcon className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-semibold mb-2">Transition Frames</h3>
                     <p className="text-sm text-neutral-400 leading-relaxed">
                         Generates bridging frames between panels to ensure smooth visual continuity before animation.
                     </p>
                 </div>

                 {/* Step 3 */}
                 <div className="p-6 rounded-2xl bg-[#18181b] border border-white/5 relative group hover:border-emerald-500/30 transition-all">
                     <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl font-bold font-mono">03</div>
                     <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                         <CheckSquareIcon className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-semibold mb-2">Panel Selector</h3>
                     <p className="text-sm text-neutral-400 leading-relaxed">
                         Curate your sequence. Select key shots and define "transition slots" for first-to-last frame video generation.
                     </p>
                 </div>

                 {/* Step 4 */}
                 <div className="p-6 rounded-2xl bg-[#18181b] border border-white/5 relative group hover:border-amber-500/30 transition-all">
                     <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl font-bold font-mono">04</div>
                     <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                         <SlidersIcon className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-semibold mb-2">Panel Processor</h3>
                     <p className="text-sm text-neutral-400 leading-relaxed">
                         Auto-enhances prompts and configures timing (3s, 5s, 8s) and motion parameters for each shot.
                     </p>
                 </div>

                 {/* Step 5 */}
                 <div className="p-6 rounded-2xl bg-[#18181b] border border-white/5 relative group hover:border-pink-500/30 transition-all">
                     <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl font-bold font-mono">05</div>
                     <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                         <VideoIcon className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-semibold mb-2">Production</h3>
                     <p className="text-sm text-neutral-400 leading-relaxed">
                         Generates final video using <strong>Veo 3.1</strong> or <strong>Wan 2.5</strong> (High Res), then automatically assembles the timeline.
                     </p>
                 </div>
             </div>
         </div>

         {/* Decorative Grid */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
         <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to create.</h2>
            <p className="text-neutral-400">From prompt to polish, Seq handles the entire workflow.</p>
         </div>

         <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
               <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-6">
                  <MagicIcon className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-semibold mb-3">Multi-Model AI</h3>
               <p className="text-neutral-400 leading-relaxed">
                  Support for <strong>Veo 3.1</strong> (Fast/Standard) and <strong>Wan 2.5</strong>. Use the best model for every shot, from transitions to high-res hero moments.
               </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
               <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-6">
                  <FilmIcon className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-semibold mb-3">Professional Timeline</h3>
               <p className="text-neutral-400 leading-relaxed">
                  Multi-track editing, ripple deletes, and magnetic snapping. A real NLE experience in the browser.
               </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
               <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-6">
                  <DownloadIcon className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-semibold mb-3">4K Export</h3>
               <p className="text-neutral-400 leading-relaxed">
                  Render your projects locally with high-bitrate encoding. No watermarks, just pure quality.
               </p>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-[#050505]">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <LogoIcon className="w-6 h-6 text-indigo-500" />
               <span className="font-bold text-lg">Seq</span>
            </div>

            <div className="text-sm text-neutral-500">
               © 2024 Seq Inc. All rights reserved.
            </div>

            <div className="flex gap-6">
               <a href="#" className="text-neutral-400 hover:text-white transition-colors">Twitter</a>
               <a href="#" className="text-neutral-400 hover:text-white transition-colors">GitHub</a>
               <a href="#" className="text-neutral-400 hover:text-white transition-colors">Discord</a>
            </div>
         </div>
      </footer>

    </div>
  );
};
