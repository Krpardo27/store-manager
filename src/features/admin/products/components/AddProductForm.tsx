"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import {
  createProductAction,
  type ProductActionState,
} from "../actions/create-products-actions";

const initialProductActionState: ProductActionState = {
  status: "idle",
  message: "",
};

function fieldError(state: ProductActionState, field: string) {
  return state.fieldErrors?.[field as keyof NonNullable<ProductActionState["fieldErrors"]>]?.[0];
}

type AddProductFormProps = {
  initialSku?: string;
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

export default function AddProductForm({ initialSku = "" }: AddProductFormProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);

  const [isTransitionPending, startTransition] = useTransition();
  const [skuValue, setSkuValue] = useState(initialSku.toUpperCase());
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isStartingScanner, setIsStartingScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [state, formAction, isActionPending] = useActionState(
    createProductAction,
    initialProductActionState,
  );
  const isPending = isActionPending || isTransitionPending;

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const result = await Swal.fire({
      title: "Crear producto",
      text: "Se agregara este producto al inventario.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Crear producto",
      cancelButtonText: "Volver",
      confirmButtonColor: "#18181b",
      cancelButtonColor: "#71717a",
    });

    if (!result.isConfirmed) {
      return;
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.status === "success") {
      Swal.fire({
        title: "Producto creado",
        text: state.message,
        icon: "success",
        confirmButtonText: "Ver inventario",
        confirmButtonColor: "#18181b",
      }).then(() => {
        router.push("/dashboard/inventario");
      });

      return;
    }

    if (state.status === "error") {
      Swal.fire({
        title: "No se pudo crear",
        text: state.message,
        icon: "error",
        confirmButtonText: "Revisar",
        confirmButtonColor: "#18181b",
      });
    }
  }, [router, state.message, state.status]);

  useEffect(() => {
    return () => {
      stopSkuScanner();
    };
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Inventario
        </p>
        <h3 className="mt-2 text-xl font-semibold text-zinc-900">Agregar producto</h3>
        <p className="mt-2 text-sm text-zinc-600">
          Registra productos para controlar precio, stock disponible y reposicion.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-zinc-700">
          Nombre
          <input
            name="name"
            minLength={2}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
          />
          {fieldError(state, "name") && <p className="text-xs text-red-600">{fieldError(state, "name")}</p>}
        </label>

        <div className="space-y-1.5 text-sm font-medium text-zinc-700">
          <label htmlFor="new-product-sku">SKU</label>
          <input
            id="new-product-sku"
            name="sku"
            value={skuValue}
            onChange={(event) => setSkuValue(event.target.value.toUpperCase())}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm uppercase text-zinc-900 outline-none transition-colors focus:border-zinc-500"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (isScannerOpen) {
                  stopSkuScanner();
                  return;
                }

                void startSkuScanner();
              }}
              disabled={isStartingScanner}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isStartingScanner ? "Abriendo camara..." : isScannerOpen ? "Cerrar camara" : "Escanear SKU"}
            </button>
          </div>

          {scanError && <p className="text-xs text-red-600">{scanError}</p>}

          {isScannerOpen && (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-black">
              <video ref={videoRef} className="h-44 w-full object-cover" muted />
            </div>
          )}

          {fieldError(state, "sku") && <p className="text-xs text-red-600">{fieldError(state, "sku")}</p>}
        </div>

        <label className="space-y-1.5 text-sm font-medium text-zinc-700">
          Precio
          <input
            name="price"
            type="number"
            min={0}
            step={100}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
          />
          {fieldError(state, "price") && <p className="text-xs text-red-600">{fieldError(state, "price")}</p>}
        </label>

        <label className="space-y-1.5 text-sm font-medium text-zinc-700">
          Cantidad
          <input
            name="quantity"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
          />
          {fieldError(state, "quantity") && <p className="text-xs text-red-600">{fieldError(state, "quantity")}</p>}
        </label>

        <label className="space-y-1.5 text-sm font-medium text-zinc-700">
          Stock minimo
          <input
            name="minStock"
            type="number"
            min={0}
            step={1}
            defaultValue={0}
            className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
          />
          {fieldError(state, "minStock") && <p className="text-xs text-red-600">{fieldError(state, "minStock")}</p>}
        </label>

        <label className="flex items-center gap-2 self-end rounded-xl border border-zinc-200 px-3 py-3 text-sm font-medium text-zinc-700">
          <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-zinc-900" />
          Activo
        </label>
      </div>

      <label className="mt-4 block space-y-1.5 text-sm font-medium text-zinc-700">
        Descripcion
        <textarea
          name="description"
          rows={3}
          className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500"
        />
        {fieldError(state, "description") && <p className="text-xs text-red-600">{fieldError(state, "description")}</p>}
      </label>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={state.status === "error" ? "text-sm text-red-600" : "text-sm text-emerald-700"}
          aria-live="polite"
        >
          {state.message}
        </p>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Agregar producto"}
        </button>
      </div>
    </form>
  );
}