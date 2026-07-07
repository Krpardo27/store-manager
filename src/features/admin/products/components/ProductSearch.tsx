"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

type GlobalWithBarcodeDetector = typeof globalThis & {
  BarcodeDetector?: BarcodeDetectorConstructor;
};

type ProductSearchProps = {
  placeholder?: string;
  autoFocus?: boolean;
  showScannerHint?: boolean;
  enableCameraScan?: boolean;
};

export default function ProductSearch({
  placeholder = "Buscar por nombre, SKU o descripcion...",
  autoFocus = false,
  showScannerHint = false,
  enableCameraScan = false,
}: ProductSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const commitSearch = useCallback((rawValue: string) => {
    const normalized = rawValue.trim();
    const urlQuery = (searchParams.get("q") ?? "").trim();

    if (normalized === urlQuery) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (normalized) {
      params.set("q", normalized);
    } else {
      params.delete("q");
    }

    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const stopCamera = useCallback(() => {
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

    setIsCameraOpen(false);
  }, []);

  const waitForVideoElement = useCallback(async (attempts = 8) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (videoRef.current) {
        return videoRef.current;
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    }

    return null;
  }, []);

  const startCameraScan = useCallback(async () => {
    const globalWithDetector = globalThis as GlobalWithBarcodeDetector;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("No se puede acceder a la camara en este dispositivo.");
      return;
    }

    const isSecure =
      window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isSecure) {
      setCameraError("Para usar camara abre la app en HTTPS (o localhost).");
      return;
    }

    setIsStartingCamera(true);
    setCameraError(null);

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);

      const video = await waitForVideoElement();
      if (!video) {
        throw new Error("No se encontro el visor de camara.");
      }

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      const onDetected = (rawValue: string) => {
        const normalized = rawValue.trim();
        if (!normalized) {
          return;
        }

        setQuery(normalized);
        commitSearch(normalized);
        stopCamera();
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
    } catch (error) {
      stopCamera();
      const typedError = error as DOMException | Error;
      setCameraError(typedError.message || "No se pudo iniciar la camara.");
    } finally {
      setIsStartingCamera(false);
    }
  }, [commitSearch, stopCamera, waitForVideoElement]);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      commitSearch(query);
    }, 250);

    return () => {
      clearTimeout(timeout);
    };
  }, [commitSearch, query]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="w-full sm:max-w-md">
      <label className="block w-full">
        <span className="sr-only">Buscar productos</span>
        <div className="relative">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }

              event.preventDefault();
              commitSearch(query);
              inputRef.current?.select();
            }}
            placeholder={placeholder}
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 pr-16 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                commitSearch("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              Limpiar
            </button>
          )}
        </div>
      </label>

      {enableCameraScan && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => {
              if (isCameraOpen) {
                stopCamera();
                return;
              }

              void startCameraScan();
            }}
            disabled={isStartingCamera}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStartingCamera ? "Abriendo camara..." : isCameraOpen ? "Cerrar camara" : "Escanear para buscar"}
          </button>

          {cameraError && (
            <p className="mt-2 text-xs text-red-600">{cameraError}</p>
          )}

          {isCameraOpen && (
            <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200 bg-black">
              <video ref={videoRef} className="h-44 w-full object-cover" muted aria-label="Vista previa de la cámara para buscar productos" />
            </div>
          )}
        </div>
      )}

      {showScannerHint && (
        <p className="mt-2 text-xs text-zinc-500">
          Modo lector: escanea el codigo y el Enter del dispositivo buscara al instante.
        </p>
      )}
    </div>
  );
}
