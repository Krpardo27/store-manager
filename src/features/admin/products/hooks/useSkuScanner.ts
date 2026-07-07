"use client";

import { useRef, useState } from "react";
import Swal from "sweetalert2";

type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

type GlobalWithBarcodeDetector = typeof globalThis & {
  BarcodeDetector?: BarcodeDetectorConstructor;
};

export function useSkuScanner(initialSku = "") {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);

  const [skuValue, setSkuValue] = useState(() => initialSku.toUpperCase());
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isStartingScanner, setIsStartingScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const stopSkuScanner = () => {
    if (zxingControlsRef.current) {
      zxingControlsRef.current.stop();
      zxingControlsRef.current = null;
    }

    if (frameRequestRef.current !== null) {
      cancelAnimationFrame(frameRequestRef.current);
      frameRequestRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setIsScannerOpen(false);
  };

  const waitForVideoElement = async (attempts = 8) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (videoRef.current) {
        return videoRef.current;
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    }

    return null;
  };

  const startSkuScanner = async () => {
    const globalWithDetector = globalThis as GlobalWithBarcodeDetector;

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("No se puede acceder a la camara en este dispositivo.");
      return;
    }

    const isSecure =
      window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isSecure) {
      setScanError("Para usar camara abre la app en HTTPS (o localhost).");
      return;
    }

    setIsStartingScanner(true);
    setScanError(null);

    try {
      stopSkuScanner();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsScannerOpen(true);

      const video = await waitForVideoElement();
      if (!video) {
        throw new Error("No se encontro el visor de camara.");
      }

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      const onDetected = (rawValue: string) => {
        const normalized = rawValue.trim().toUpperCase();
        if (!normalized) {
          return;
        }

        setSkuValue(normalized);
        stopSkuScanner();
        void Swal.fire({
          icon: "success",
          title: "SKU detectado",
          text: `Codigo capturado: ${normalized}`,
          timer: 1300,
          showConfirmButton: false,
        });
      };

      if (globalWithDetector.BarcodeDetector) {
        const detector = new globalWithDetector.BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"],
        });

        const scanFrame = async () => {
          if (!videoRef.current || !streamRef.current) {
            return;
          }

          try {
            const barcodes = await detector.detect(videoRef.current);
            const rawValue = barcodes[0]?.rawValue?.trim();
            if (rawValue) {
              onDetected(rawValue);
              return;
            }
          } catch {
            // Seguimos intentando en el siguiente frame.
          }

          frameRequestRef.current = requestAnimationFrame(() => {
            void scanFrame();
          });
        };

        frameRequestRef.current = requestAnimationFrame(() => {
          void scanFrame();
        });

        return;
      }

      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader(undefined, {
        delayBetweenScanAttempts: 150,
        delayBetweenScanSuccess: 500,
      });

      const controls = await reader.decodeFromStream(stream, video, (result) => {
        const rawValue = result?.getText()?.trim();
        if (rawValue) {
          onDetected(rawValue);
        }
      });

      zxingControlsRef.current = controls;
    } catch {
      stopSkuScanner();
      setScanError("No se pudo iniciar el escaner de SKU. Revisa camara y permisos.");
    } finally {
      setIsStartingScanner(false);
    }
  };

  return {
    skuValue,
    setSkuValue,
    isScannerOpen,
    isStartingScanner,
    scanError,
    videoRef,
    startSkuScanner,
    stopSkuScanner,
  };
}
