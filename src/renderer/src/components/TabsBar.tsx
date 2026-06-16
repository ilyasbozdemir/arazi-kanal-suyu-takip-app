import React, { useRef, useEffect } from 'react'
import {
  X,
  LayoutDashboard,
  Receipt,
  Coins,
  Layers,
  Users,
  Settings,
  User,
  LucideIcon
} from 'lucide-react'
import { useTabStore, TabType } from '../store/tabStore'

const tabIcons: Record<TabType, LucideIcon> = {
  dashboard: LayoutDashboard,
  sulamalar: Receipt,
  odemeler: Coins,
  tasinmazlar: Layers,
  gorevliler: Users,
  ayarlar: Settings,
  profil: User
}

export default function TabsBar(): React.JSX.Element {
  const { tabs, activeTabKey, closeTab, setActiveTabKey } = useTabStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to active tab on change
  useEffect(() => {
    if (!scrollContainerRef.current) return
    const activeElement = scrollContainerRef.current.querySelector('[data-active="true"]')
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  }, [activeTabKey])

  const handleTabClick = (key: string) => {
    setActiveTabKey(key)
  }

  const handleCloseClick = (e: React.MouseEvent, key: string) => {
    e.stopPropagation()
    closeTab(key)
  }

  // Mouse wheel horizontal scrolling support
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY
    }
  }

  return (
    <div
      ref={scrollContainerRef}
      onWheel={handleWheel}
      className="flex items-end gap-[2px] bg-slate-900/40 border-b border-white/5 px-4 h-11 overflow-x-auto overflow-y-hidden select-none custom-scrollbar scroll-smooth shrink-0 no-print"
    >
      {tabs.map((tab) => {
        const Icon = tabIcons[tab.id] || LayoutDashboard
        const isActive = activeTabKey === tab.key

        return (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            data-active={isActive}
            className={`group flex items-center gap-2 h-9 px-4 text-xs font-semibold rounded-t-xl transition-all duration-200 border-x border-t border-transparent relative shrink-0 cursor-pointer min-w-[120px] max-w-[220px] ${
              isActive
                ? 'bg-slate-950/80 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-white/10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-900/20'
            }`}
          >
            {/* Top Indicator bar for active tab */}
            {isActive && (
              <span className="absolute top-0 left-0 right-0 h-[3px] bg-indigo-500 rounded-t-full" />
            )}

            <Icon
              className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-500'}`}
            />

            <span className={`truncate ${tab.key !== 'dashboard' ? 'pr-6' : ''}`}>
              {tab.label}
            </span>

            {/* Close button */}
            {tab.key !== 'dashboard' && (
              <span
                role="button"
                tabIndex={0}
                title="Sekmeyi Kapat"
                onClick={(e) => handleCloseClick(e, tab.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCloseClick(e as any, tab.key)
                  }
                }}
                className={`absolute right-2 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-400 transition-all flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'opacity-80 hover:opacity-100'
                    : 'opacity-0 group-hover:opacity-60 hover:opacity-100'
                }`}
              >
                <X className="w-3 h-3" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
