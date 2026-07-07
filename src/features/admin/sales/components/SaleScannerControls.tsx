import type { CameraDevice, CameraFacingMode } from "./types";

type SaleScannerControlsProps = {
  query: string;
  maxLookupLength: number;
  isSearching: boolean;
  isStartingCamera: boolean;
  isCameraOpen: boolean;
  cameraFacingMode: CameraFacingMode;
  cameraDevices: CameraDevice[];
  selectedCameraId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onSubmitQuery: () => void;
  onToggleCamera: () => void;
  onFacingModeChange: (value: CameraFacingMode) => void;
  onCameraDeviceChange: (value: string) => void;
};

export default function SaleScannerControls({
  query,
  maxLookupLength,
  isSearching,
  isStartingCamera,
  isCameraOpen,
  cameraFacingMode,
  cameraDevices,
  selectedCameraId,
  inputRef,
  onQueryChange,
  onSubmitQuery,
  onToggleCamera,
  onFacingModeChange,
  onCameraDeviceChange,
}: SaleScannerControlsProps) {
  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Codigo / SKU</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={inputRef}
            type="search"
            autoFocus
            value={query}
            maxLength={maxLookupLength}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }

              event.preventDefault();
              onSubmitQuery();
            }}
            placeholder="Escanea o escribe un codigo"
            className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500"
          />
          <button
            type="button"
            onClick={onSubmitQuery}
            disabled={isSearching}
            className="inline-flex h-11 min-w-36 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSearching ? "Buscando..." : "Buscar y agregar"}
          </button>
          <button
            type="button"
            onClick={onToggleCamera}
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
            onChange={(event) => onFacingModeChange(event.target.value as CameraFacingMode)}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          >
            <option value="environment">Trasera (recomendada)</option>
            <option value="user">Frontal</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Dispositivo</span>
          <select
            value={selectedCameraId}
            onChange={(event) => onCameraDeviceChange(event.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          >
            {cameraDevices.length === 0 && <option value="">Camara automatica</option>}
            {cameraDevices.length > 0 && <option value="">Seleccion automatica</option>}
            {cameraDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
