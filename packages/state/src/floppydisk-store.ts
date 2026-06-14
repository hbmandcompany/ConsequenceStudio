import { create } from "zustand";
import type { FloppydiskAsset } from "@consequence/stream";
import type { FloppydiskAssetFilter } from "./floppydisk-utils.js";

export interface FloppydiskState {
  query: string;
  assetFilter: FloppydiskAssetFilter;
  results: FloppydiskAsset[];
  isSearching: boolean;
  searchError: string | null;
}

export interface FloppydiskActions {
  setQuery: (query: string) => void;
  setAssetFilter: (filter: FloppydiskAssetFilter) => void;
  setResults: (results: FloppydiskAsset[]) => void;
  setSearching: (isSearching: boolean) => void;
  setSearchError: (error: string | null) => void;
  resetSearch: () => void;
}

export const useFloppydiskStore = create<FloppydiskState & FloppydiskActions>((set) => ({
  query: "",
  assetFilter: "all",
  results: [],
  isSearching: false,
  searchError: null,
  setQuery: (query) => set({ query }),
  setAssetFilter: (assetFilter) => set({ assetFilter }),
  setResults: (results) => set({ results }),
  setSearching: (isSearching) => set({ isSearching }),
  setSearchError: (searchError) => set({ searchError }),
  resetSearch: () =>
    set({
      query: "",
      assetFilter: "all",
      results: [],
      isSearching: false,
      searchError: null,
    }),
}));
