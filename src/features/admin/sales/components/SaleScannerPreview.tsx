import type { RefObject } from "react";

type SaleScannerPreviewProps = {
  isCameraOpen: boolean;
  scanAttempts: number;
  scanEngine: "native" | "compatible" | null;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export default function SaleScannerPreview({
  isCameraOpen,
  scanAttempts,
  scanEngine,
  videoRef,
}: SaleScannerPreviewProps) {
  if (!isCameraOpen) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Escaneando...
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-600">
          Intentos: {scanAttempts}
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-600">
          Motor: {scanEngine === "compatible" ? "Compatible" : "Nativo"}
        </span>
      </div>
      <p className="text-xs text-zinc-500">Escaneo movil activo. Enfoca el codigo hasta detectar.</p>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-black">
        <video ref={videoRef} className="h-56 w-full object-cover" muted />
      </div>
    </div>
  );
}
