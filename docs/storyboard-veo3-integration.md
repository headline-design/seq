# Nano Banana Pro: Storyboard & Veo3 Integration Technical Design

## 1. Objective
To extend the Nano Banana Pro Playground with a "Storyboard Mode" that allows users to generate a sequence of 2-6 visual panels (images) and subsequently transform these panels into video clips using the Veo3 model via Fal AI. This creates an end-to-end workflow for AI video creation starting from static visual references.

## 2. User Workflow
1.  **Select Mode**: User switches to "Storyboard Mode".
2.  **Define Structure**: User selects the number of panels (2-6).
3.  **Generate Panels**:
    -   User provides a prompt (or individual prompts per panel).
    -   Nano Banana (using Google Gemini) generates high-quality static images for each panel.
    -   User can regenerate individual panels until satisfied.
4.  **Generate Video**:
    -   User clicks "Animate" or "Generate Video" for specific panels or the entire storyboard.
    -   The system sends the image + prompt to Fal AI (Veo3).
    -   Veo3 returns a video clip (e.g., 5-10s).
5.  **Review & Export**:
    -   User views the generated videos in a loop or sequence.
    -   Options to download individual clips or the full sequence.

## 3. Technical Architecture

### 3.1. Frontend Components
-   **`StoryboardContainer`**: Main wrapper for the new mode. Manages the state of the panels (images/videos).
-   **`StoryboardGrid`**: A flexible grid layout that adapts to the number of panels (e.g., 2-up, 3-up, 2x2, 2x3).
-   **`PanelItem`**: Individual component for a storyboard slot. Handles:
    -   Empty state (prompt input).
    -   Loading state.
    -   Image display.
    -   Video playback.
    -   Controls (Regenerate Image, Animate/Generate Video).
-   **`VideoPlayer`**: A lightweight wrapper around the HTML5 `<video>` tag for looping previews.

### 3.2. Backend Integration
-   **New API Route**: `app/api/generate-video/route.ts`
    -   **Method**: POST
    -   **Input**: `imageUrl` (source), `prompt` (optional guidance), `aspectRatio`.
    -   **Integration**: Uses `@fal-ai/serverless` to call the Veo3 model.
    -   **Output**: JSON object with `videoUrl` and metadata.

### 3.3. State Management
-   Extend existing `Generation` type or create a new `StoryboardPanel` type:
    \`\`\`typescript
    interface StoryboardPanel {
      id: string;
      prompt: string;
      imageUrl?: string;
      videoUrl?: string;
      status: 'empty' | 'generating-image' | 'image-ready' | 'generating-video' | 'video-ready' | 'error';
      error?: string;
    }
    \`\`\`
-   New hook `useStoryboard` to manage the array of panels and their transitions.

### 3.4. Environment Variables
-   **Required**: `FAL_KEY` (for Veo3 access).
-   **Existing**: `AI_GATEWAY_API_KEY` (for Google Gemini image generation).

## 4. Implementation Steps
1.  **Setup Fal Integration**: Install SDK and configure environment.
2.  **UI Construction**: Build the Storyboard grid and panel controls.
3.  **Image Logic**: Connect panels to the existing Gemini image generation logic.
4.  **Video Logic**: Implement the Veo3 connection and handle the async nature of video generation.
5.  **Refinement**: Polish the UI, add transitions, and ensure robust error handling.

## 5. Veo3 Specifics
-   **Model**: `fal-ai/veo-v3` (or specific endpoint).
-   **Inputs**:
    -   `image_url`: The reference image from Nano Banana.
    -   `prompt`: Text description of the motion.
-   **Outputs**: Video file URL (MP4).
