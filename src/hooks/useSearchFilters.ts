import { useSyncExternalStore } from "react";
import type { EquineFeature } from "@/data/listings";

export interface SearchFilters {
  location: string;
  minAcres: number;
  minStalls: number;
  priceMax: number;
  features: EquineFeature[];
}

export const DEFAULT_FILTERS: SearchFilters = {
  location: "",
  minAcres: 0,
  minStalls: 0,
  priceMax: 5_000_000,
  features: [],
};

let state: SearchFilters = { ...DEFAULT_FILTERS };
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const searchFiltersStore = {
  get: () => state,
  set: (patch: Partial<SearchFilters>) => {
    state = { ...state, ...patch };
    emit();
  },
  replace: (next: SearchFilters) => {
    state = next;
    emit();
  },
  reset: () => {
    state = { ...DEFAULT_FILTERS };
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export const useSearchFilters = () =>
  useSyncExternalStore(searchFiltersStore.subscribe, searchFiltersStore.get, searchFiltersStore.get);
