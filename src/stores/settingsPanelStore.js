// src/stores/settingsPanelStore.js
import { create } from 'zustand'

export const useSettingsPanelStore = create((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false })
}))
