import { create } from 'zustand'

export type TabType = 'dashboard' | 'sulamalar' | 'tasinmazlar' | 'gorevliler' | 'ayarlar' | 'odemeler'

export interface TabItem {
  id: TabType
  label: string
}

interface TabState {
  tabs: TabItem[]
  activeTab: TabType
  addTab: (id: TabType) => void
  closeTab: (id: TabType) => TabType | null // Returns the next active tab ID
  setActiveTab: (id: TabType) => void
  clearTabs: () => void
}

export function getTabLabel(id: TabType): string {
  switch (id) {
    case 'dashboard':
      return 'Genel Bakış'
    case 'sulamalar':
      return 'Fiş Girişi'
    case 'odemeler':
      return 'Ödeme Takibi'
    case 'tasinmazlar':
      return 'Taşınmaz Tanımları'
    case 'gorevliler':
      return 'Sulama Görevlileri'
    case 'ayarlar':
      return 'Sistem Ayarları'
    default:
      return 'Sekme'
  }
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [{ id: 'dashboard', label: 'Genel Bakış' }],
  activeTab: 'dashboard',

  addTab: (id) => {
    const { tabs } = get()
    const exists = tabs.some((t) => t.id === id)

    if (!exists) {
      const label = getTabLabel(id)
      const newTabs = [...tabs, { id, label }]
      set({ tabs: newTabs, activeTab: id })
    } else {
      set({ activeTab: id })
    }
  },

  closeTab: (id) => {
    if (id === 'dashboard') return null

    const { tabs, activeTab } = get()
    const newTabs = tabs.filter((t) => t.id !== id)

    let nextTab: TabType | null = null

    if (activeTab === id) {
      if (newTabs.length > 0) {
        const index = tabs.findIndex((t) => t.id === id)
        const nextIndex = Math.max(0, index - 1)
        nextTab = newTabs[nextIndex].id
      } else {
        nextTab = 'dashboard'
        newTabs.push({ id: 'dashboard', label: 'Genel Bakış' })
      }
    }

    set({ tabs: newTabs, activeTab: nextTab || activeTab })
    return nextTab
  },

  setActiveTab: (id) => {
    set({ activeTab: id })
  },

  clearTabs: () => {
    set({ tabs: [{ id: 'dashboard', label: 'Genel Bakış' }], activeTab: 'dashboard' })
  }
}))
