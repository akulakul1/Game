import React, { useEffect, useRef } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import "./CameraPanel.css";

export default function CameraPanel({ onDirectionChange }) {
  const videoRef = useRef(null);
  const lastDirection = useRef(null);
  const lastTime = useRef(Date.now());

  useEffect(() => {
    if (!videoRef.current) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    faceMesh.onResults((results) => {
      if (!results.multiFaceLandmarks?.length) return;
      const lm = results.multiFaceLandmarks[0];
      const nose = lm[1];
      const leftCheek = lm[234];
      const rightCheek = lm[454];
      const chin = lm[152];
      const forehead = lm[10];

      const noseXRatio = (nose.x - leftCheek.x) / (rightCheek.x - leftCheek.x);
      const noseYRatio = (nose.y - forehead.y) / (chin.y - forehead.y);

      let newDir = null;

      // Loosened thresholds for clearer head movement detection
      if (noseXRatio < 0.35) newDir = 'left';
      else if (noseXRatio > 0.65) newDir = 'right';
      else if (noseYRatio < 0.35) newDir = 'up';
      else if (noseYRatio > 0.65) newDir = 'down';

      const now = Date.now();
      if (
        newDir &&
        newDir !== lastDirection.current &&
        now - lastTime.current > 400
      ) {
        lastDirection.current = newDir;
        lastTime.current = now;
        onDirectionChange(newDir);
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceMesh.send({ image: videoRef.current });
      },
      width: 300,
      height: 300,
    });
    camera.start();

    return () => camera.stop();
  }, [onDirectionChange]);

  return (
    <div className="camera-panel">
      <video ref={videoRef} autoPlay muted playsInline />
    </div>
  );
}
