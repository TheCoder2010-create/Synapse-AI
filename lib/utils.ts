
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractFramesFromVideo(
  videoDataUrl: string,
  frameCount: number
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoDataUrl;
    video.crossOrigin = 'anonymous'; // Important for canvas operations

    let frames: string[] = [];
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return reject(new Error('Could not get canvas context.'));
    }

    video.onloadeddata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      const interval = duration / frameCount;

      let currentTime = 0;
      let framesExtracted = 0;

      const captureFrame = () => {
        if (framesExtracted >= frameCount) {
          video.pause();
          resolve(frames);
          return;
        }

        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg')); // Or 'image/png'
        framesExtracted++;
        currentTime += interval;

        if (currentTime <= duration) {
          captureFrame();
        } else {
           video.pause();
           resolve(frames);
        }
      };
      
      video.onerror = (e) => {
        reject(new Error('Video loading or seeking failed.'));
      };

      // Start the process
      captureFrame();
    };

    video.load();
  });
}
