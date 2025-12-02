export const DEMO_STORYBOARD = {
  masterImageUrl: "/images/download-20-281-29.png",
  masterDescription: 'A live-action flashback scene inspired by the "zoom out to the past" effect from Ratatouille.',
  panelCount: 9,
  panels: [
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019093771-dgm169.png",
      prompt: "Man in modern cafe takes first bite of tart, eyes widen slightly with surprise",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019115301-8i4ia.png",
      prompt: "Extreme close-up of eye with swirling transition effect, colors shift to warm sepia tones",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019136430-tlgsun.png",
      prompt: "Wide shot of rustic kitchen, young boy eating at table with grandmother preparing food in background",
      duration: 5 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019157951-gkhlqn.png",
      prompt: "Close-up of boy's joyful face, mouth full of food, warm nostalgic lighting, pure happiness",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019181130-fco6if.png",
      prompt: "Swirling temporal transition effect, man and boy's faces blend together, zoom effect accelerates",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl:
        "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-pro-image-editing-result%20%2826%29.png",
      prompt: "Man in present day, eyes glistening with tears, emotional realization washing over his face",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/sb-6.png",
      prompt: "Close-up of boy's messy grin, food remnants on face, capturing pure childhood joy and innocence",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019246354-h8szr.png",
      prompt: "Man looks down at the tart on his plate, processing the flood of memories, slow contemplative tilt",
      duration: 3 as const,
      aspectRatio: "16:9" as const,
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019267745-a7c3lw.png",
      prompt: "Man takes another contemplative bite, savoring both food and memory, camera slowly pushes in",
      duration: 5 as const,
      aspectRatio: "16:9" as const,
    },
  ],
}

export const DEMO_TRANSITION_STORYBOARD = {
  transitionImageUrl: "/images/nano-banana-pro-image-editing-result-20-2824-29.png",
  description:
    "There are 2 transition panels. For transition 1, I need the first frame to be identical to the current transition panel except no warp effect and background should still be restaurant. For transition 2, the first frame should be very similar to the last frame from transition 1.",
  panelCount: 5,
  panels: [
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764027246633-min6rg.png",
      label: "Transition 1 - First Frame",
      description: "Clean close-up of man's face in modern restaurant (no warp effect)",
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764027269235-np18ja.png",
      label: "Transition 1 - Last Frame",
      description: "Boy eating in rustic kitchen with grandmother",
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764027293437-6yhya.png",
      label: "Transition 2 - First Frame",
      description: "Boy eating in kitchen (similar angle to transition 1 last frame)",
    },
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764027315445-k5mqr4.png",
      label: "Visual Reference",
      description: "Warped overlay effect showing transition merge (for reference, not for video generation)",
    },
    {
      imageUrl:
        "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-pro-image-editing-result%20%2826%29.png",
      label: "Transition 2 - Last Frame",
      description: "Man in present day (clean frame for transition 2 ending)",
    },
  ],
}

export const DEMO_FINAL_SEQUENCE = {
  masterDescription: 'A live-action flashback scene inspired by the "zoom out to the past" effect from Ratatouille.',
  videoConfig: {
    aspectRatio: "16:9" as const,
    useFastModel: true,
  },
  panels: [
    // Panel 0 - Regular panel
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019093771-dgm169.png",
      prompt: "Cinematic close-up of the man eating pie, followed by a rapid, disorienting dolly-in to mid-face.",
      duration: 8 as const,
      linkedImageUrl: undefined,
      videoUrl: "https://v3b.fal.media/files/b/0a84a235/Z9sIv_PFVXLU8uDcb9Hey_output.mp4",
    },
    // Panel 1 - Transition (first frame: transition panel 0, last frame: main panel 2)
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764027246633-min6rg.png",
      linkedImageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019136430-tlgsun.png",
      prompt:
        "Extreme close-up on the man's eye, rapidly accelerating into a blurring pullback zoom that transitions cinematically into a warm flashback sequence.",
      duration: 5 as const,
      videoUrl: "https://v3b.fal.media/files/b/monkey/D_Pf7zR9bbiKaRT6twClJ.mp4",
    },
    // Panel 2 - Regular panel
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019136430-tlgsun.png",
      prompt: "Wide shot of rustic kitchen, young boy eating at table with grandmother preparing food in background",
      duration: 5 as const,
      linkedImageUrl: undefined,
      videoUrl: "https://v3b.fal.media/files/b/elephant/l8BSTRj_g7f-pFOfx7siq_TPl6daj3.mp4",
    },
    // Panel 3 - Regular panel
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019157951-gkhlqn.png",
      prompt: "Close-up of boy's joyful face, mouth full of food, warm nostalgic lighting, pure happiness",
      duration: 5 as const,
      linkedImageUrl: undefined,
      videoUrl: "https://v3b.fal.media/files/b/panda/evoI_qve6jM04K-AeG4dd_TV3dmkaY.mp4",
    },
    // Panel 4 - Transition (first frame: transition panel 2, last frame: transition panel 4)
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764027293437-6yhya.png",
      linkedImageUrl:
        "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-pro-image-editing-result%20%2826%29.png",
      prompt:
        "A cinematic wide-angle of the boy and his smiling grandmother, then rapidly accelerating into a blurring pullback zoom that transitions cinematically into a warmer present-day sequence.",
      duration: 5 as const,
      videoUrl: "https://v3b.fal.media/files/b/monkey/ASI6U2FEsmr-xxQI9iAV0.mp4",
    },
    // Panel 5 - Regular panel
    {
      imageUrl:
        "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-pro-image-editing-result%20%2826%29.png",
      prompt: "A cinematic close-up of the man's face at a restaurant as he recalls memories of childhood.",
      duration: 8 as const,
      linkedImageUrl: undefined,
      videoUrl: "https://v3b.fal.media/files/b/rabbit/iS5IFUBwrTgZCqEdTZJJo_output.mp4",
    },
    // Panel 6 - Regular panel
    {
      imageUrl: "https://ijzqgoxsir9e5xch.public.blob.vercel-storage.com/nano-banana-1764019093771-dgm169.png",
      prompt:
        "Man in present day taking another bite of pie, savoring the memory and the moment, camera slowly pulls back.",
      duration: 8 as const,
      linkedImageUrl: undefined,
      videoUrl: "https://v3b.fal.media/files/b/zebra/N6ZZnPbVVVpDx1ls0SjMQ_output.mp4",
    },
  ],
}
