"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ProductLookupSuccess = {
  ok: true;
  product: {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    quantity: number;
  };
  matchType: "exact_sku" | "fuzzy";
};

type ProductLookupError = {
  ok: false;
  message: string;
};

type LookupResponse = ProductLookupSuccess | ProductLookupError;

type CartItem = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  quantity: number;
};

type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

type GlobalWithBarcodeDetector = typeof globalThis & {
  BarcodeDetector?: BarcodeDetectorConstructor;
};

type CameraFacingMode = "environment" | "user";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function QuickSaleRegister() {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<CameraFacingMode>("environment");
  const [soundFeedbackEnabled, setSoundFeedbackEnabled] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [cart, setCart] = useState<CartItem[]>([]);

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
  };

  const stopCamera = () => {
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
  };

  const playScanFeedback = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(120);
    }

    if (!soundFeedbackEnabled || typeof window === "undefined") {
      return;
    }

    const globalWithAudio = window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    };

    const AudioContextConstructor = window.AudioContext ?? globalWithAudio.webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    const audioContext = new AudioContextConstructor();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.11);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.12);

    oscillator.onended = () => {
      void audioContext.close();
    };
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
    const value = rawValue.trim();
    if (!value) {
      return;
    }

    setIsSearching(true);
    resetFeedback();

    try {
      const response = await fetch(`/api/dashboard/products/lookup?q=${encodeURIComponent(value)}`);
      const data = (await response.json()) as LookupResponse;

      if (!response.ok || !data.ok) {
        const fallback = "No pudimos agregar ese producto.";
        setError(data.ok ? fallback : data.message || fallback);
        return;
      }

      addProductToCart(data.product);
      setMessage(
        data.matchType === "exact_sku"
          ? `${data.product.name} agregado por codigo.`
          : `${data.product.name} agregado por coincidencia.`,
      );
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

  const decreaseQty = (itemId: string) => {
    resetFeedback();
    setCart((current) =>
      current
        .map((item) => (item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (itemId: string) => {
    resetFeedback();
    setCart((current) => current.filter((item) => item.id !== itemId));
  };

  const closeSale = async () => {
    if (!cart.length) {
      setError("No hay productos para cerrar la venta.");
      return;
    }

    setIsClosing(true);
    resetFeedback();

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const total = formatCurrency(subtotal);
      const items = totalItems;
      setCart([]);
      setMessage(`Venta registrada en modo rapido (${items} items, total ${total}, ${paymentMethod}).`);
      inputRef.current?.focus();
    } finally {
      setIsClosing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (frameRequestRef.current !== null) {
        cancelAnimationFrame(frameRequestRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCameraScanner = async (facingMode: CameraFacingMode) => {
    const globalWithDetector = globalThis as GlobalWithBarcodeDetector;

    if (!globalWithDetector.BarcodeDetector) {
      setError("Tu navegador no soporta escaneo por camara. Usa Chrome/Edge en HTTPS.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("No se puede acceder a la camara en este dispositivo.");
      return;
    }

    setIsStartingCamera(true);
    resetFeedback();

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: facingMode,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error("No se encontro el visor de camara.");
      }

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      setIsCameraOpen(true);
      setMessage("Camara activa. Apunta al codigo para agregar producto.");

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
            playScanFeedback();
            setQuery(rawValue);
            stopCamera();
            void searchAndAdd(rawValue);
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
    } catch {
      stopCamera();
      setError("No se pudo iniciar la camara. Revisa permisos del navegador.");
    } finally {
      setIsStartingCamera(false);
    }
  };

  return (
    <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Caja rapida</p>
        <h2 className="text-2xl font-semibold text-zinc-900">Venta por escaner</h2>
        <p className="text-sm text-zinc-600">
          Escanea codigo de barras y presiona Enter. Cada lectura agrega una unidad al carrito.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Codigo / SKU</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={inputRef}
              type="search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") {
                  return;
                }

                event.preventDefault();
                void searchAndAdd(query);
              }}
              placeholder="Escanea o escribe un codigo"
              className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500"
            />
            <button
              type="button"
              onClick={() => void searchAndAdd(query)}
              disabled={isSearching}
              className="inline-flex h-11 min-w-36 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSearching ? "Buscando..." : "Agregar"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isCameraOpen) {
                  stopCamera();
                  return;
                }

                void startCameraScanner(cameraFacingMode);
              }}
              disabled={isStartingCamera}
              className="inline-flex h-11 min-w-44 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStartingCamera ? "Abriendo camara..." : isCameraOpen ? "Cerrar camara" : "Escanear con camara"}
            </button>
          </div>
        </label>

        <p className="text-xs text-zinc-500">
          Recomendado: conectar scanner USB en modo teclado con sufijo Enter.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Camara</span>
            <select
              value={cameraFacingMode}
              onChange={(event) => {
                const nextMode = event.target.value as CameraFacingMode;
                setCameraFacingMode(nextMode);

                if (isCameraOpen) {
                  void startCameraScanner(nextMode);
                }
              }}
              className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            >
              <option value="environment">Trasera (recomendada)</option>
              <option value="user">Frontal</option>
            </select>
          </label>

          <label className="flex h-10 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-700 sm:mt-6">
            <input
              type="checkbox"
              checked={soundFeedbackEnabled}
              onChange={(event) => setSoundFeedbackEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            Sonido al detectar codigo
          </label>
        </div>

        {isCameraOpen && (
          <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3">
            <p className="text-xs text-zinc-500">Escaneo movil activo. Enfoca el codigo hasta detectar.</p>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-black">
              <video ref={videoRef} className="h-56 w-full object-cover" muted />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-[0.16em] text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">Precio</th>
              <th className="px-4 py-3 font-semibold">Cantidad</th>
              <th className="px-4 py-3 font-semibold">Subtotal</th>
              <th className="px-4 py-3 font-semibold">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {cart.map((item) => (
              <tr key={item.id} className="text-zinc-700">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">{item.name}</p>
                  <p className="text-xs text-zinc-500">SKU: {item.sku ?? "-"} · Stock: {item.stock}</p>
                </td>
                <td className="px-4 py-3">{formatCurrency(item.price)}</td>
                <td className="px-4 py-3">
                  <div className="inline-flex items-center rounded-lg border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => decreaseQty(item.id)}
                      className="h-8 w-8 text-zinc-700 transition-colors hover:bg-zinc-100"
                    >
                      -
                    </button>
                    <span className="inline-flex min-w-10 justify-center text-sm font-semibold text-zinc-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => increaseQty(item.id)}
                      className="h-8 w-8 text-zinc-700 transition-colors hover:bg-zinc-100"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-zinc-900">
                  {formatCurrency(item.price * item.quantity)}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}

            {cart.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No hay productos en esta venta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Pago</span>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="h-10 min-w-48 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            >
              <option value="efectivo">Efectivo</option>
              <option value="debito">Debito</option>
              <option value="credito">Credito</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </label>
        </div>

        <div className="space-y-1 text-right">
          <p className="text-xs text-zinc-500">Items: {totalItems}</p>
          <p className="text-lg font-semibold text-zinc-900">Total: {formatCurrency(subtotal)}</p>
          <button
            type="button"
            onClick={() => void closeSale()}
            disabled={isClosing || !cart.length}
            className="mt-2 inline-flex h-11 min-w-44 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-opacity hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isClosing ? "Guardando..." : "Cerrar venta"}
          </button>
        </div>
      </div>
    </section>
  );
}
