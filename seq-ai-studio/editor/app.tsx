"use client";

import React from 'react';
import { MediaItem, TimelineClip } from './types';
import dynamic from 'next/dynamic';
import { DEMO_FINAL_SEQUENCE } from '@/lib/demo-data';
import { useRouter } from 'next/navigation';

const Editor = dynamic(() => import('./components/editor').then(mod => mod.Editor), { ssr: false });

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

  const router = useRouter();

  return (
    <Editor
      initialMedia={initialMedia}
      initialClips={initialClips}
      onBack={() => {
        router.push('/');
      }}
    />
  );
}

export default App;
