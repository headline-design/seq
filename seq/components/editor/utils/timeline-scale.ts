export interface ZoomConfig {
  pixelsPerSecond: number;
  majorInterval: number; // seconds between major numbered ticks
  minorDivisions: number; // number of subdivisions between major ticks
}

// Discrete zoom levels optimized for video editing
export const ZOOM_CONFIGS: ZoomConfig[] = [
  { pixelsPerSecond: 5, majorInterval: 60, minorDivisions: 12 },  // ~5px/s: Show 1m, ticks every 5s
  { pixelsPerSecond: 10, majorInterval: 30, minorDivisions: 6 },  // ~10px/s: Show 30s, ticks every 5s
  { pixelsPerSecond: 20, majorInterval: 10, minorDivisions: 10 }, // ~20px/s: Show 10s, ticks every 1s
  { pixelsPerSecond: 40, majorInterval: 5, minorDivisions: 5 },   // ~40px/s: Show 5s, ticks every 1s (Default)
  { pixelsPerSecond: 80, majorInterval: 1, minorDivisions: 2 },   // ~80px/s: Show 1s, ticks every 0.5s
  { pixelsPerSecond: 160, majorInterval: 1, minorDivisions: 5 },  // ~160px/s: Show 1s, ticks every 0.2s
  { pixelsPerSecond: 320, majorInterval: 0.5, minorDivisions: 5 },// ~320px/s: Show 0.5s, ticks every 0.1s
];

export function getZoomConfig(zoom: number): ZoomConfig {
    // Find the configuration that closest matches the current zoom level
    return ZOOM_CONFIGS.reduce((prev, curr) => 
        Math.abs(curr.pixelsPerSecond - zoom) < Math.abs(prev.pixelsPerSecond - zoom) ? curr : prev
    );
}

export function getNextZoom(currentZoom: number): number {
    let closestIdx = -1;
    let minDiff = Infinity;
    
    ZOOM_CONFIGS.forEach((cfg, idx) => {
        const diff = Math.abs(cfg.pixelsPerSecond - currentZoom);
        if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
        }
    });
    
    const targetIdx = Math.min(ZOOM_CONFIGS.length - 1, closestIdx + 1);
    if (ZOOM_CONFIGS[closestIdx].pixelsPerSecond < currentZoom && closestIdx < ZOOM_CONFIGS.length - 1) {
        return ZOOM_CONFIGS[closestIdx + 1].pixelsPerSecond;
    }

    return ZOOM_CONFIGS[targetIdx].pixelsPerSecond;
}

export function getPrevZoom(currentZoom: number): number {
    let closestIdx = -1;
    let minDiff = Infinity;
    
    ZOOM_CONFIGS.forEach((cfg, idx) => {
        const diff = Math.abs(cfg.pixelsPerSecond - currentZoom);
        if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
        }
    });

    if (ZOOM_CONFIGS[closestIdx].pixelsPerSecond < currentZoom) {
        return ZOOM_CONFIGS[closestIdx].pixelsPerSecond;
    }

    const targetIdx = Math.max(0, closestIdx - 1);
    return ZOOM_CONFIGS[targetIdx].pixelsPerSecond;
}
