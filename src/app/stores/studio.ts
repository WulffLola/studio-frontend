// stores/studio.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Studio = {
  id: number;
  name: string;
  address?: string;
  is_active?: boolean;
  created_at?: string;
};

interface StudioStore {
  selectedStudio: Studio | null;
  setSelectedStudio: (studio: Studio | null) => void;
  clearStudio: () => void;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

const DEFAULT_STATE: Pick<StudioStore, "selectedStudio" | "hasHydrated"> = {
  selectedStudio: null,
  hasHydrated: false,
};

export const useStudioStore = create<StudioStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      setSelectedStudio: (studio) => set({ selectedStudio: studio }),
      clearStudio: () => set({ selectedStudio: null }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "studio-storage",
      storage: createJSONStorage(() => localStorage),
      version: 2, // ⬅️ subir versión
      // 1) Limpia el estado persistido viejo
      migrate: (_persistedState, _version) => {
        return DEFAULT_STATE as any;
      },
      // 2) Flag para saber cuándo terminó de rehidratar
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // 3) Guardá solo lo necesario
      partialize: (s) => ({ selectedStudio: s.selectedStudio }),
    }
  )
);
