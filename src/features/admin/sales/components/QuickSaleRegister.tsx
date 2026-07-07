"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import SaleCartTable from "./SaleCartTable";
import SaleFeedback from "./SaleFeedback";
import SaleScannerControls from "./SaleScannerControls";
import SaleScannerPreview from "./SaleScannerPreview";
import SaleSummary from "./SaleSummary";
import { formatCurrency } from "./formatters";
import type {
  CameraDevice,
  CameraFacingMode,
  CartItem,
  GlobalWithBarcodeDetector,
  LookupResponse,
  ProductLookupSuccess,
} from "./types";

export default function QuickSaleRegister() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const scanAttemptsRef = useRef(0);

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [scanEngine, setScanEngine] = useState<"native" | "compatible" | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<CameraFacingMode>("environment");
  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraDebugDetail, setCameraDebugDetail] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [cart, setCart] = useState<CartItem[]>([]);

  const maxLookupLength = 80;

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const resetFeedback = () => {
    setMessage(null);
    setError(null);
    setCameraDebugDetail(null);
  };

  const resetScanMetrics = () => {
    scanAttemptsRef.current = 0;
    setScanAttempts(0);
  };

  const trackScanAttempt = () => {
    scanAttemptsRef.current += 1;
    if (scanAttemptsRef.current % 4 === 0) {
      setScanAttempts(scanAttemptsRef.current);
    }
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

  const validateLookupValue = (rawValue: string) => {
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

  const getAudioContext = async () => {
    if (typeof window === "undefined") {
      return null;
    }

    const globalWithAudio = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextConstructor = window.AudioContext ?? globalWithAudio.webkitAudioContext;
    if (!AudioContextConstructor) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  };

  const playBeep = async (frequency = 880, durationSeconds = 0.09, gainPeak = 0.1) => {
    const audioContext = await getAudioContext();
    if (!audioContext) {
      return false;
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainPeak, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + durationSeconds);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + durationSeconds);

    return true;
  };

  const playSaleSuccessSound = async (mode: "item" | "checkout") => {
    const audioContext = await getAudioContext();
    if (!audioContext) {
      return;
    }

    const start = audioContext.currentTime;
    const sequence =
      mode === "checkout"
        ? [
            { frequency: 1046, offset: 0, duration: 0.07 },
            { frequency: 1318, offset: 0.08, duration: 0.08 },
            { frequency: 1567, offset: 0.17, duration: 0.16 },
          ]
        : [
            { frequency: 1108, offset: 0, duration: 0.06 },
            { frequency: 1480, offset: 0.07, duration: 0.1 },
          ];

    sequence.forEach((note) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = mode === "checkout" ? "square" : "triangle";
      oscillator.frequency.setValueAtTime(note.frequency, start + note.offset);

      gain.gain.setValueAtTime(0.0001, start + note.offset);
      gain.gain.exponentialRampToValueAtTime(0.2, start + note.offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.offset + note.duration);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start + note.offset);
      oscillator.stop(start + note.offset + note.duration);
    });
  };

  const playScanFeedback = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(120);
    }

    void playBeep(760, 0.06, 0.06);
  };

  const addProductToCart = (incoming: ProductLookupSuccess["product"]) => {
    setCart((current) => {
      const index = current.findIndex((item) => item.id === incoming.id);

      if (index === -1) {
        return [
          {
            id: incoming.id,
            name: incoming.name,
            sku: incoming.sku,
            price: incoming.price,
            stock: incoming.quantity,
            quantity: 1,
          },
          ...current,
        ];
      }

      const target = current[index];
      if (!target || target.quantity >= target.stock) {
        setError(`No hay mas stock disponible para ${incoming.name}.`);
        return current;
      }

      const next = [...current];
      next[index] = {
        ...target,
        quantity: target.quantity + 1,
      };
      return next;
    });
  };

  const searchAndAdd = async (rawValue: string) => {
    const validated = validateLookupValue(rawValue);
    if (!validated.valid) {
      setError(validated.error);
      return;
    }

    const value = validated.normalized;

    setIsSearching(true);
    resetFeedback();

    try {
      const response = await fetch(`/api/dashboard/products/lookup?q=${encodeURIComponent(value)}`);
      const data = (await response.json()) as LookupResponse;

      if (!response.ok || !data.ok) {
        const fallback = "No pudimos agregar ese producto.";

        if (response.status === 404) {
          const result = await Swal.fire({
            icon: "info",
            title: "Producto no encontrado",
            text: "Ese codigo no existe en inventario. ¿Quieres crearlo ahora?",
            showCancelButton: true,
            confirmButtonText: "Crear en inventario",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#18181b",
            cancelButtonColor: "#3f3f46",
            reverseButtons: true,
          });

          if (result.isConfirmed) {
            router.push(`/dashboard/inventario/new?sku=${encodeURIComponent(value)}`);
          }

          setError(data.ok ? fallback : data.message || fallback);
          return;
        }

        setError(data.ok ? fallback : data.message || fallback);
        return;
      }

      addProductToCart(data.product);
      setMessage(
        data.matchType === "exact_sku"
          ? `${data.product.name} agregado por codigo.`
          : `${data.product.name} agregado por coincidencia.`,
      );

      void playSaleSuccessSound("item");

      setQuery("");
      inputRef.current?.focus();
      inputRef.current?.select();
    } catch {
      setError("Error de red al consultar producto.");
    } finally {
      setIsSearching(false);
    }
  };

  const increaseQty = (itemId: string) => {
    resetFeedback();
    setCart((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item;

        if (item.quantity >= item.stock) {
          setError(`No hay mas stock disponible para ${item.name}.`);
          return item;
        }

        return { ...item, quantity: item.quantity + 1 };
      }),
    );
  };

  const decreaseQty = async (itemId: string) => {
    const item = cart.find((line) => line.id === itemId);
    if (!item) {
      return;
    }

    if (item.quantity === 1) {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Quitar producto",
        text: `\"${item.name}\" quedara fuera de la venta.`,
        showCancelButton: true,
        confirmButtonText: "Si, quitar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#3f3f46",
        reverseButtons: true,
      });

      if (!confirm.isConfirmed) {
        return;
      }
    }

    resetFeedback();
    setCart((current) =>
      current
        .map((item) => (item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = async (itemId: string) => {
    const item = cart.find((line) => line.id === itemId);
    if (!item) {
      return;
    }

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Quitar producto",
      text: `\"${item.name}\" se quitara del carrito.`,
      showCancelButton: true,
      confirmButtonText: "Si, quitar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#3f3f46",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) {
      return;
    }

    resetFeedback();
    setCart((current) => current.filter((item) => item.id !== itemId));
  };

  const closeSale = async () => {
    if (!cart.length) {
      setError("No hay productos para cerrar la venta.");
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "Confirmar cierre de venta",
      text: `Se descontaran ${totalItems} item(s) del inventario por ${formatCurrency(subtotal)}.`,
      showCancelButton: true,
      confirmButtonText: "Si, cerrar venta",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#3f3f46",
      reverseButtons: true,
      allowOutsideClick: false,
    });

    if (!confirm.isConfirmed) {
      return;
    }

    setIsClosing(true);
    resetFeedback();

    try {
      const payload = {
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      const response = await fetch("/api/dashboard/sales/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        setError(data.message || "No pudimos cerrar la venta. Verifica stock y permisos.");
        await Swal.fire({
          icon: "error",
          title: "No se pudo cerrar la venta",
          text: data.message || "Verifica stock y permisos.",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#dc2626",
        });
        return;
      }

      const total = formatCurrency(subtotal);
      const items = totalItems;
      setCart([]);
      setMessage(`Venta registrada en modo rapido (${items} items, total ${total}, ${paymentMethod}).`);
      void playSaleSuccessSound("checkout");
      inputRef.current?.focus();

      await Swal.fire({
        icon: "success",
        title: "Venta cerrada",
        text: `Inventario actualizado correctamente (${items} item(s)).`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch {
      setError("Error inesperado al cerrar la venta.");
      await Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: "No se pudo completar el cierre de venta. Intenta nuevamente.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsClosing(false);
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

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        void audioContextRef.current.close();
      }
    };
  }, []);

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
    resetFeedback();

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
                setQuery(validated.normalized);
                stopCamera();
                void searchAndAdd(validated.normalized);
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
        setQuery(validated.normalized);
        stopCamera();
        void searchAndAdd(validated.normalized);
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

  return (
    <section className="min-w-0 space-y-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Caja rapida</p>
        <h2 className="text-2xl font-semibold text-zinc-900">Venta por escaner</h2>
        <p className="text-sm text-zinc-600">
          Escanea codigo de barras y presiona Enter. Cada lectura agrega una unidad al carrito.
        </p>
      </div>

      <SaleScannerControls
        query={query}
        maxLookupLength={maxLookupLength}
        isSearching={isSearching}
        isStartingCamera={isStartingCamera}
        isCameraOpen={isCameraOpen}
        cameraFacingMode={cameraFacingMode}
        cameraDevices={cameraDevices}
        selectedCameraId={selectedCameraId}
        inputRef={inputRef}
        onQueryChange={setQuery}
        onSubmitQuery={() => {
          void searchAndAdd(query);
        }}
        onToggleCamera={() => {
          if (isCameraOpen) {
            stopCamera();
            return;
          }

          void getAudioContext();
          void startCameraScanner(cameraFacingMode);
        }}
        onFacingModeChange={(nextMode) => {
          setCameraFacingMode(nextMode);

          if (isCameraOpen) {
            void startCameraScanner(nextMode);
          }
        }}
        onCameraDeviceChange={(nextDeviceId) => {
          setSelectedCameraId(nextDeviceId);

          if (isCameraOpen) {
            void startCameraScanner(cameraFacingMode);
          }
        }}
      />

      <SaleScannerPreview
        isCameraOpen={isCameraOpen}
        scanAttempts={scanAttempts}
        scanEngine={scanEngine}
        videoRef={videoRef}
      />

      <SaleFeedback
        error={error}
        message={message}
        cameraDebugDetail={cameraDebugDetail}
      />

      <SaleCartTable
        cart={cart}
        increaseQty={increaseQty}
        decreaseQty={decreaseQty}
        removeItem={removeItem}
      />

      <SaleSummary
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        totalItems={totalItems}
        subtotal={subtotal}
        isClosing={isClosing}
        canClose={cart.length > 0}
        onCloseSale={() => {
          void closeSale();
        }}
      />
    </section>
  );
}
