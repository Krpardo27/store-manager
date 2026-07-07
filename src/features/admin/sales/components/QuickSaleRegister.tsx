"use client";

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import SaleCartTable from "./SaleCartTable";
import SaleFeedback from "./SaleFeedback";
import SaleScannerControls from "./SaleScannerControls";
import SaleScannerPreview from "./SaleScannerPreview";
import SaleSummary from "./SaleSummary";
import { useSaleAudio } from "../hooks/useSaleAudio";
import { useSaleCart } from "../hooks/useSaleCart";
import { useCameraScanner } from "../hooks/useCameraScanner";
import type { LookupResponse } from "./types";

export default function QuickSaleRegister() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraDebugDetail, setCameraDebugDetail] = useState<string | null>(null);

  const { getAudioContext, playSaleSuccessSound, playScanFeedback } = useSaleAudio();

  const {
    cart,
    paymentMethod,
    setPaymentMethod,
    subtotal,
    totalItems,
    isClosing,
    addProductToCart,
    increaseQty,
    decreaseQty,
    removeItem,
    closeSale,
  } = useSaleCart({ playSaleSuccessSound, setMessage, setError });

  const searchAndAdd = async (rawValue: string) => {
    const value = rawValue.trim();
    if (!value) {
      setError("Ingresa o escanea un codigo antes de buscar.");
      return;
    }

    setIsSearching(true);
    setMessage(null);
    setError(null);
    setCameraDebugDetail(null);

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

  const handleScanSuccess = (value: string) => {
    setQuery(value);
    void searchAndAdd(value);
  };

  const {
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
  } = useCameraScanner({
    onScanSuccess: handleScanSuccess,
    playScanFeedback,
    getAudioContext,
    setMessage,
    setError,
    setCameraDebugDetail,
  });

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
        maxLookupLength={80}
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
