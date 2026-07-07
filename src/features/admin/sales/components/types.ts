export type ProductLookupSuccess = {
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

export type ProductLookupError = {
  ok: false;
  message: string;
};

export type LookupResponse = ProductLookupSuccess | ProductLookupError;

export type CartItem = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  quantity: number;
};

export type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

export type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

export type GlobalWithBarcodeDetector = typeof globalThis & {
  BarcodeDetector?: BarcodeDetectorConstructor;
};

export type CameraFacingMode = "environment" | "user";

export type CameraDevice = {
  deviceId: string;
  label: string;
};
