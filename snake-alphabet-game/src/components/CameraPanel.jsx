// src/components/CameraPanel.jsx
import { useEffect, useRef } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';

export default function CameraPanel({ onDirectionChange }) {
  const videoRef = useRef();

  useEffect(() => {
    async function setupCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    async function runDetection() {
      const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
      );

      const detect = async () => {
        if (videoRef.current.readyState === 4) {
          const predictions = await model.estimateFaces({ input: videoRef.current });
          if (predictions.length > 0) {
            const keypoints = predictions[0].scaledMesh;
            const nose = keypoints[1]; // nose tip

            // Use nose x,y to determine direction
            const [x, y] = nose;

            const centerX = videoRef.current.videoWidth / 2;
            const centerY = videoRef.current.videoHeight / 2;

            const dx = x - centerX;
            const dy = y - centerY;

            let direction = null;
            if (Math.abs(dx) > Math.abs(dy)) {
              direction = dx > 30 ? 'right' : dx < -30 ? 'left' : null;
            } else {
              direction = dy > 30 ? 'down' : dy < -30 ? 'up' : null;
            }

            if (direction) {
              // send direction to parent
              if (onDirectionChange) {
                const map = {
                  up: { x: 0, y: -1 },
                  down: { x: 0, y: 1 },
                  left: { x: -1, y: 0 },
                  right: { x: 1, y: 0 },
                };
                onDirectionChange(map[direction]);
              }
            }
          }
        }
        requestAnimationFrame(detect);
      };

      detect();
    }

    setupCamera();
    runDetection();
  }, [onDirectionChange]);

  return (
    <div className="camera-panel">
      <video ref={videoRef} autoPlay muted playsInline />
    </div>
  );
}
