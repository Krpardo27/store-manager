"use client";

import { useEffect, useRef, useState } from "react";

import type { CameraDevice, CameraFacingMode, GlobalWithBarcodeDetector } from "../components/types";

type UseCameraScannerParams = {
  onScanSuccess: (value: string) => void;
  playScanFeedback: () => void;
  getAudioContext: () => Promise<AudioContext | null>;
  setMessage: (msg: string | null) => void;
  setError: (err: string | null) => void;
  setCameraDebugDetail: (detail: string | null) => void;
};

export function useCameraScanner({
  onScanSuccess,
  playScanFeedback,
  getAudioContext,
  setMessage,
  setError,
  setCameraDebugDetail,
}: UseCameraScannerParams) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const scanAttemptsRef = useRef(0);
  const onScanSuccessRef = useRef(onScanSuccess);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [scanEngine, setScanEngine] = useState<"native" | "compatible" | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<CameraFacingMode>("environment");
  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const validateLookupValue = (rawValue: string) => {
    const maxLookupLength = 80;
    const value = rawValue.trim();

    if (!value) {
      return {
        valid: false,
        normalized: "",
        error: "Ingresa o escanea un codigo antes de buscar.",
      };
    }

    if (value.length > maxLookupLength) {
      return {
        valid: false,
        normalized: "",
        error: `El codigo es demasiado largo (maximo ${maxLookupLength} caracteres).`,
      };
    }

    const allowedPattern = /^[\p{L}\p{N}\s\-_.:/]+$/u;
    if (!allowedPattern.test(value)) {
      return {
        valid: false,
        normalized: "",
        error: "El codigo contiene caracteres no validos.",
      };
    }

    return {
      valid: true,
      normalized: value,
      error: null,
    };
  };

  const trackScanAttempt = () => {
    scanAttemptsRef.current += 1;
    if (scanAttemptsRef.current % 4 === 0) {
      setScanAttempts(scanAttemptsRef.current);
    }
  };

  const resetScanMetrics = () => {
    scanAttemptsRef.current = 0;
    setScanAttempts(0);
  };

  const stopCamera = () => {
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
    setScanEngine(null);
  };

  const refreshCameraDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camara ${index + 1}`,
        }));

      setCameraDevices(videos);
      setSelectedCameraId((current) => {
        if (current && videos.some((device) => device.deviceId === current)) {
          return current;
        }

        return videos[0]?.deviceId ?? "";
      });
    } catch {
      // Silencioso: algunos navegadores limitan enumerateDevices antes de permisos.
    }
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

  const startCameraScanner = async (facingMode: CameraFacingMode) => {
    const globalWithDetector = globalThis as GlobalWithBarcodeDetector;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("No se puede acceder a la camara en este dispositivo.");
      return;
    }

    const isSecure =
      window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isSecure) {
      setError("Para usar camara abre la app en HTTPS (o localhost). Revisa la URL actual.");
      return;
    }

    setIsStartingCamera(true);
    setMessage(null);
    setError(null);
    setCameraDebugDetail(null);

    try {
      stopCamera();
      resetScanMetrics();

      const constraintsCandidates: MediaStreamConstraints[] = [];
      if (selectedCameraId) {
        constraintsCandidates.push({
          video: {
            deviceId: {
              exact: selectedCameraId,
            },
          },
          audio: false,
        });
      }

      constraintsCandidates.push(
        {
          video: {
            facingMode: {
              ideal: facingMode,
            },
          },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      );

      let stream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraints of constraintsCandidates) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!stream) {
        throw lastError ?? new Error("No fue posible inicializar la camara.");
      }

      streamRef.current = stream;
      await refreshCameraDevices();

      setIsCameraOpen(true);
      setMessage("Camara activa. Apunta al codigo para agregar producto.");

      const video = await waitForVideoElement();
      if (!video) {
        throw new Error("No se encontro el visor de camara.");
      }

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      let nativeStarted = false;
      if (globalWithDetector.BarcodeDetector) {
        try {
          const detector = new globalWithDetector.BarcodeDetector({
            formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"],
          });
          setScanEngine("native");

          const scanFrame = async () => {
            if (!videoRef.current || !streamRef.current) {
              return;
            }

            try {
              trackScanAttempt();
              const barcodes = await detector.detect(videoRef.current);
              const rawValue = barcodes[0]?.rawValue?.trim();

              if (rawValue) {
                const validated = validateLookupValue(rawValue);
                if (!validated.valid) {
                  frameRequestRef.current = requestAnimationFrame(() => {
                    void scanFrame();
                  });
                  return;
                }

                playScanFeedback();
                stopCamera();
                onScanSuccessRef.current(validated.normalized);
                return;
              }
            } catch {
              // Ignoramos lecturas intermitentes y seguimos intentando en el siguiente frame.
            }

            frameRequestRef.current = requestAnimationFrame(() => {
              void scanFrame();
            });
          };

          frameRequestRef.current = requestAnimationFrame(() => {
            void scanFrame();
          });
          nativeStarted = true;
        } catch (nativeError) {
          const typedNativeError = nativeError as Error | DOMException;
          const nativeName = typedNativeError?.name ?? "NativeError";
          const nativeMessage = typedNativeError?.message ?? "sin detalle";
          setCameraDebugDetail(`Motor nativo: ${nativeName} - ${nativeMessage}`);
        }
      }

      if (nativeStarted) {
        return;
      }

      setScanEngine("compatible");
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader(undefined, {
        delayBetweenScanAttempts: 150,
        delayBetweenScanSuccess: 500,
      });

      const controls = await reader.decodeFromStream(stream, video, (result) => {
        trackScanAttempt();
        const rawValue = result?.getText()?.trim();
        if (!rawValue) {
          return;
        }

        const validated = validateLookupValue(rawValue);
        if (!validated.valid) {
          return;
        }

        playScanFeedback();
        stopCamera();
        onScanSuccessRef.current(validated.normalized);
      });

      zxingControlsRef.current = controls;
      setMessage("Camara activa (modo compatible). Apunta al codigo para agregar producto.");
    } catch (error) {
      stopCamera();

      const typedError = error as DOMException | Error | null;
      const errorName = typedError && "name" in typedError ? typedError.name : "";
      const errorMessage = typedError && "message" in typedError ? typedError.message : "sin detalle";
      setCameraDebugDetail(`${errorName || "Error"}: ${errorMessage}`);

      if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
        setError("No encontramos una camara disponible. Conecta la webcam USB y vuelve a intentar.");
      } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
        setError("La camara esta siendo usada por otra app. Cierra Zoom/Meet/camara y reintenta.");
      } else if (errorName === "OverconstrainedError" || errorName === "ConstraintNotSatisfiedError") {
        setError("No se pudo abrir la camara seleccionada. Prueba otra camara en el selector.");
      } else if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
        setError("Permiso de camara bloqueado por el navegador. Habilitalo en configuracion del sitio.");
      } else {
        setError("No se pudo iniciar la camara. Verifica conexion USB, permisos y que no este en uso.");
      }
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    return () => {
      if (frameRequestRef.current !== null) {
        cancelAnimationFrame(frameRequestRef.current);
      }

      if (zxingControlsRef.current) {
        zxingControlsRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isCameraOpen,
    isStartingCamera,
    scanAttempts,
    scanEngine,
    cameraFacingMode,
    cameraDevices,
    selectedCameraId,
    videoRef,
    stopCamera,
    startCameraScanner,
    setCameraFacingMode,
    setSelectedCameraId,
    validateLookupValue,
  };
}
