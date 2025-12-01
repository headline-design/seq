"use client";

import React from 'react';
import { Editor } from './components/editor';
import { MediaItem, TimelineClip } from './types';

const DEMO_FINAL_SEQUENCE = {
  masterDescription: 'A live-action flashback scene inspired by the "zoom out to the past" effect from Ratatouille.',
  videoConfig: {
    aspectRatio: "16:9" as const,
    useFastModel: true,
  },
  panels: [
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019093771-dgm169.png",
      prompt: "Cinematic close-up of the man eating pie, followed by a rapid, disorienting dolly-zoom in to mid-face.",
      duration: 5,
      linkedImageUrl: undefined,
      videoUrl: "https://v3b.fal.media/files/b/monkey/56rWGsFnPAYOmnYp4ZaKg_output.mp4",
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764027246633-min6rg.png",
      linkedImageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019136430-tlgsun.png",
      prompt: "Extreme close-up on the man's eye, rapidly accelerating into a blurring pullback zoom that transitions cinematically into a warm flashback sequence.",
      duration: 5,
      videoUrl: "https://v3b.fal.media/files/b/monkey/D_Pf7zR9bbiKaRT6twClJ.mp4",
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019136430-tlgsun.png",
      prompt: "Wide shot of rustic kitchen, young boy eating at table with grandmother preparing food in background",
      duration: 5,
      linkedImageUrl: undefined,
      videoUrl: "https://v3b.fal.media/files/b/elephant/l8BSTRj_g7f-pFOfx7siq_TPl6daj3.mp4",
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019157951-gkhlqn.png",
      prompt: "Close-up of boy's joyful face, mouth full of food, warm nostalgic lighting, pure happiness",
      duration: 5,
      linkedImageUrl: undefined,
      videoUrl: "https://v3b.fal.media/files/b/panda/evoI_qve6jM04K-AeG4dd_TV3dmkaY.mp4",
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764027293437-6yhya.png",
      linkedImageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-pro-image-editing-result%20%2826%29.png",
      prompt: "A cinematic wide-angle of the boy and his smiling grandmother, then rapidly accelerating into a blurring pullback zoom that transitions cinematically into a warmer present-day sequence.",
      duration: 5,
      videoUrl: "https://v3b.fal.media/files/b/monkey/ASI6U2FEsmr-xxQI9iAV0.mp4",
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-pro-image-editing-result%20%2826%29.png",
      prompt: "A cinematic close-up of the man's face at a restaurant as he recalls memories of childhood.",
      duration: 5,
      linkedImageUrl: undefined,
      videoUrl: "https://v3b.fal.media/files/b/rabbit/iS5IFUBwrTgZCqEdTZJJo_output.mp4",
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019093771-dgm169.png",
      prompt: "Man in present day taking another bite of pie, savoring the memory and the moment, camera slowly pulls back.",
      duration: 5,
      linkedImageUrl: undefined,
      videoUrl: "https://v3b.fal.media/files/b/zebra/N6ZZnPbVVVpDx1ls0SjMQ_output.mp4",
    },
  ],
};

function App() {
  // Initialize state from the demo sequence
  const initialMedia: MediaItem[] = DEMO_FINAL_SEQUENCE.panels.map((p, i) => ({
      id: `media-${i}`,
      url: p.videoUrl,
      prompt: p.prompt,
      duration: p.duration,
      aspectRatio: DEMO_FINAL_SEQUENCE.videoConfig.aspectRatio,
      status: 'ready',
      type: 'video',
      resolution: { width: 1280, height: 720 }
  }));

  const initialClips: TimelineClip[] = [];
  let startTime = 0;

  initialMedia.forEach((m, i) => {
      initialClips.push({
          id: `clip-${i}`,
          mediaId: m.id,
          trackId: 'v1',
          start: startTime,
          duration: m.duration,
          offset: 0,
          // Removed default transition to ensure manual control only
          transition: undefined
      });
      startTime += m.duration;
  });

  return (
    <Editor
      initialMedia={initialMedia}
      initialClips={initialClips}
      onBack={() => {}}
    />
  );
}

export default App;
