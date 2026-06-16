import { create } from 'zustand'

export type TabType =
  | 'dashboard'
  | 'sulamalar'
  | 'tasinmazlar'
  | 'gorevliler'
  | 'ayarlar'
  | 'odemeler'
  | 'profil'
  | 'malikler'

export interface TabItem {
  key: string // unique key, e.g. "dashboard", "profil:Ahmet Yılmaz"
  id: TabType
  label: string
  params?: any // custom arguments like { owner: 'Ahmet Yılmaz' }
}

interface TabState {
  tabs: TabItem[]
  activeTabKey: string
  addTab: (id: TabType, params?: any) => void
  closeTab: (key: string) => string | null // Returns the next active tab key
  setActiveTabKey: (key: string) => void
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
    case 'profil':
      return 'Kişi Profili'
    case 'malikler':
      return 'Malik Listesi'
    default:
      return 'Sekme'
  }
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [{ key: 'dashboard', id: 'dashboard', label: 'Genel Bakış' }],
  activeTabKey: 'dashboard',

  addTab: (id, params) => {
    const { tabs } = get()
    // Generate unique key for profiles based on the landowner's name
    const key = id === 'profil' && params?.owner ? `profil:${params.owner}` : id
    const exists = tabs.some((t) => t.key === key)

    if (!exists) {
      let label = getTabLabel(id)
      if (id === 'profil' && params?.owner) {
        label = `Profil: ${params.owner}`
      }
      const newTabs = [...tabs, { key, id, label, params }]
      set({ tabs: newTabs, activeTabKey: key })
    } else {
      set({ activeTabKey: key })
    }
  },

  closeTab: (key) => {
    if (key === 'dashboard') return null

    const { tabs, activeTabKey } = get()
    const newTabs = tabs.filter((t) => t.key !== key)

    let nextKey: string | null = null

    if (activeTabKey === key) {
      if (newTabs.length > 0) {
        const index = tabs.findIndex((t) => t.key === key)
        const nextIndex = Math.max(0, index - 1)
        nextKey = newTabs[nextIndex].key
      } else {
        nextKey = 'dashboard'
        newTabs.push({ key: 'dashboard', id: 'dashboard', label: 'Genel Bakış' })
      }
    }

    set({ tabs: newTabs, activeTabKey: nextKey || activeTabKey })
    return nextKey
  },

  setActiveTabKey: (key) => {
    set({ activeTabKey: key })
  },

  clearTabs: () => {
    set({
      tabs: [{ key: 'dashboard', id: 'dashboard', label: 'Genel Bakış' }],
      activeTabKey: 'dashboard'
    })
  }
}))
