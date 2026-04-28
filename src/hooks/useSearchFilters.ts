import { useSyncExternalStore } from "react";
import type { EquineFeature } from "@/data/listings";

export type ArenaType = "indoor" | "outdoor" | "covered" | "round_pen";
export type FencingType = "board" | "pipe" | "no_climb" | "electric" | "combination";
export type FacilityType = "tack_room" | "wash_rack" | "hot_walker" | "hay_storage" | "mare_motel";
export type ViewType = "mountain" | "water" | "valley" | "plains";
export type ListingStatus = "active" | "coming_soon" | "pending" | "sold";

export interface SearchFilters {
  // Core
  location: string;
  priceMin: number;
  priceMax: number;
  acreageMin: number;
  acreageMax: number | null;
  states: string[];
  counties: string[];
  status: ListingStatus[];
  bedsMin: number;
  bathsMin: number;
  // Equine
  arenaTypes: ArenaType[];
  stallCountMin: number;
  pastureAcresMin: number;
  irrigated: boolean;
  hayProduction: boolean;
  waterRights: boolean;
  fencing: FencingType[];
  facilities: FacilityType[];
  views: ViewType[];
  hunting: boolean;
  conservationEasement: boolean;
  // Legacy fallback for existing code paths
  features: EquineFeature[];
  minAcres: number; // mirror of acreageMin for back-compat
  minStalls: number; // mirror of stallCountMin
}

export const DEFAULT_FILTERS: SearchFilters = {
  location: "",
  priceMin: 500_000,
  priceMax: 5_000_000,
  acreageMin: 0,
  acreageMax: null,
  states: ["CO"],
  counties: [],
  status: ["active", "coming_soon"],
  bedsMin: 0,
  bathsMin: 0,
  arenaTypes: [],
  stallCountMin: 0,
  pastureAcresMin: 0,
  irrigated: false,
  hayProduction: false,
  waterRights: false,
  fencing: [],
  facilities: [],
  views: [],
  hunting: false,
  conservationEasement: false,
  features: [],
  minAcres: 0,
  minStalls: 0,
};

let state: SearchFilters = { ...DEFAULT_FILTERS };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const searchFiltersStore = {
  get: () => state,
  set: (patch: Partial<SearchFilters>) => {
    state = { ...state, ...patch };
    // Keep legacy mirrors in sync
    if (patch.acreageMin !== undefined) state.minAcres = patch.acreageMin;
    if (patch.stallCountMin !== undefined) state.minStalls = patch.stallCountMin;
    if (patch.minAcres !== undefined) state.acreageMin = patch.minAcres;
    if (patch.minStalls !== undefined) state.stallCountMin = patch.minStalls;
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

export const ALL_STATES = ["CO", "TX", "MT", "TN", "WY", "AZ"];
export const CO_COUNTIES = [
  "Douglas", "Jefferson", "El Paso", "Elbert", "Larimer", "Weld", "Boulder",
  "Park", "Teller", "Adams", "Arapahoe", "Lincoln",
];

export const ARENA_LABELS: Record<ArenaType, string> = {
  indoor: "Indoor", outdoor: "Outdoor", covered: "Covered", round_pen: "Round pen",
};
export const FENCING_LABELS: Record<FencingType, string> = {
  board: "Board", pipe: "Pipe", no_climb: "No-climb", electric: "Electric", combination: "Combination",
};
export const FACILITY_LABELS: Record<FacilityType, string> = {
  tack_room: "Tack room", wash_rack: "Wash rack", hot_walker: "Hot walker",
  hay_storage: "Hay storage", mare_motel: "Mare motel",
};
export const VIEW_LABELS: Record<ViewType, string> = {
  mountain: "Mountain", water: "Water feature", valley: "Valley", plains: "Plains",
};
export const STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Active", coming_soon: "Coming Soon", pending: "Pending", sold: "Sold",
};
