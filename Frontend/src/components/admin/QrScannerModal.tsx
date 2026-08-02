"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { X, CameraOff } from "lucide-react";

interface Props {
  onClose: () => void;
  /** Called with the raw decoded QR text once a code is found; the modal stays open until the caller closes it. */
  onDetect: (text: string) => void;
}

/**
 * Opens the device camera and continuously scans frames for a QR code (via jsQR against a
 * hidden canvas snapshot of the video feed). Used by the admin to check students in by pointing
 * the camera at the QR code from their scheduling email, instead of opening it as a link.
 */
export function QrScannerModal({ onClose, onDetect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        tick();
      } catch {
        if (!cancelled) setError("Couldn't access the camera. Check your browser's camera permission and try again.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" });
          if (code?.data && !detectedRef.current) {
            detectedRef.current = true;
            onDetect(code.data);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-ink-900">Scan check-in QR</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 aspect-square w-full overflow-hidden rounded-xl bg-ink-900">
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <CameraOff className="h-8 w-8 text-ink-400" />
              <p className="text-sm text-ink-200">{error}</p>
            </div>
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        <p className="mt-3 text-center text-xs text-ink-400">
          Point the camera at the QR code from the student&apos;s scheduling email.
        </p>
      </div>
    </div>
  );
}
