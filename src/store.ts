import { create } from "zustand";
import type { ServiceItem } from "./types";

interface Store {
  activeService: ServiceItem | null;

  setService: (service: ServiceItem) => void;
  clear: () => void;
}

export const useStore = create<Store>((set) => ({
  activeService: null,

  setService: (service) => set({ activeService: service }),

  clear: () => set({ activeService: null }),
}));
