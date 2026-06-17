import React, { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard,
  Users,
  User,
  Layers,
  Receipt,
  Save,
  FolderClosed,
  Droplet,
  RefreshCw,
  Sparkles,
  Settings,
  FilePlus,
  FolderOpen,
  LogOut,
  Mail,
  FormInput,
  Grid,
  Info,
  Coins,
  X,
  Sun,
  Moon,
  Search
} from 'lucide-react'

import Startup from './components/Startup'
import Dashboard from './components/Dashboard'
import Gorevliler from './components/Gorevliler'
import Tasinmazlar from './components/Tasinmazlar'
import Sulamalar from './components/Sulamalar'
import Ayarlar from './components/Ayarlar'
import Odemeler from './components/Odemeler'
import { Footer } from './components/Footer'
import { useTabStore } from './store/tabStore'
import TabsBar from './components/TabsBar'
import KisiProfil from './components/KisiProfil'
import Malikler from './components/Malikler'

export default function App(): React.JSX.Element {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const { activeTabKey, tabs, addTab, clearTabs } = useTabStore()
  const [sulamaViewMode, setSulamaViewMode] = useState<'standard' | 'excel'>('standard')

  // Landowners List for global autocomplete search
  const [uniqueOwners, setUniqueOwners] = useState<string[]>([])
  const [globalSearchOwner, setGlobalSearchOwner] = useState('')

  const activeTabItem = tabs.find((t) => t.key === activeTabKey)
  const activeTab = activeTabItem?.id || 'dashboard'

  // Institution Settings State
  const [kurumAdi, setKurumAdi] = useState('Arazi Kanal Suyu Takip Programı')
  const [kurumLogo, setKurumLogo] = useState<string | null>(null)
  const [theme, setThemeState] = useState(localStorage.getItem('tema') || 'dark')

  // Auto-updater State
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  // Desktop Menu States
  const [activeMenu, setActiveMenu] = useState<'dosya' | 'moduller' | 'islemler' | 'yardim' | null>(
    null
  )
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [appVersion, setAppVersion] = useState('1.0.0')
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch app version on mount
  useEffect(() => {
    if (window.api?.getAppVersion) {
      window.api.getAppVersion().then(setAppVersion).catch(console.error)
    }
  }, [])

  // Listen for handleClickOutside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Menu command handlers
  const handleCreateNew = async (): Promise<void> => {
    try {
      const res = await window.api.createNewFile()
      if (res.success && res.filePath) {
        setFilePath(res.filePath)
      } else if (res.error) {
        alert(res.error)
      }
    } catch (e: any) {
      alert('Dosya oluşturulamadı: ' + e.message)
    } finally {
      setActiveMenu(null)
    }
  }

  const handleOpenFile = async (pathToCheck?: string): Promise<void> => {
    try {
      const res = await window.api.openFile(pathToCheck)
      if (res.success && res.filePath) {
        setFilePath(res.filePath)
      } else if (res.error) {
        alert(res.error)
      }
    } catch (e: any) {
      alert('Dosya açılamadı: ' + e.message)
    } finally {
      setActiveMenu(null)
    }
  }

  const handleSendBackup = async (): Promise<void> => {
    try {
      const res = await window.api.sendBackup()
      if (res.success) {
        alert('Yedek başarıyla e-posta ile gönderildi.')
      } else if (res.error) {
        alert('Yedek gönderilemedi: ' + res.error)
      }
    } catch (e: any) {
      alert('Yedek gönderilirken hata oluştu: ' + e.message)
    } finally {
      setActiveMenu(null)
    }
  }

  const handleExitApp = async (): Promise<void> => {
    try {
      setActiveMenu(null)
      await window.api.exitApp()
    } catch (e: any) {
      console.error('Exit error:', e)
    }
  }

  const loadDbSettings = async (): Promise<void> => {
    try {
      const dbSettings = await window.api.dbQuery('SELECT * FROM ayarlar')
      let dbName = ''
      let dbLogo: string | null = null
      let dbTheme = localStorage.getItem('tema') || 'dark'
      let dbFisYontemi = ''

      dbSettings.forEach((setting: any) => {
        if (setting.anahtar === 'kurum_adi') dbName = setting.deger
        if (setting.anahtar === 'kurum_logo') dbLogo = setting.deger
        if (setting.anahtar === 'tema') dbTheme = setting.deger
        if (setting.anahtar === 'fis_giris_yontemi') dbFisYontemi = setting.deger
      })

      if (dbName) setKurumAdi(dbName)
      else setKurumAdi('Arazi Kanal Suyu Takip Programı')

      setKurumLogo(dbLogo)

      // Sync theme
      if (dbTheme) {
        setThemeState(dbTheme)
        if (dbTheme === 'light') {
          document.documentElement.classList.add('light')
          if (window.api?.setTheme) window.api.setTheme('light')
        } else {
          document.documentElement.classList.remove('light')
          if (window.api?.setTheme) window.api.setTheme('dark')
        }
        localStorage.setItem('tema', dbTheme)
      }

      if (!dbFisYontemi) {
        setShowSetupModal(true)
      } else {
        setShowSetupModal(false)
      }

      // Load unique owners list
      await loadUniqueOwners()
    } catch (e) {
      console.error('Error loading settings from DB:', e)
      setKurumAdi('Arazi Kanal Suyu Takip Programı')
      setKurumLogo(null)
    }
  }

  const loadUniqueOwners = async (): Promise<void> => {
    if (!filePath) return
    try {
      const ownersRes = await window.api.dbQuery(
        'SELECT DISTINCT tapu_sahibi FROM tasinmazlar ORDER BY tapu_sahibi ASC'
      )
      if (ownersRes) {
        setUniqueOwners(ownersRes.map((o: any) => o.tapu_sahibi).filter(Boolean))
      }
    } catch (e) {
      console.error('Error loading unique owners:', e)
    }
  }

  // Reload owners whenever active tab changes to keep search list fresh
  useEffect(() => {
    if (filePath) {
      loadUniqueOwners()
    }
  }, [activeTabKey, filePath])

  // Initial theme load on mount
  useEffect(() => {
    const localTheme = localStorage.getItem('tema') || 'dark'
    if (localTheme === 'light') {
      document.documentElement.classList.add('light')
      if (window.api?.setTheme) window.api.setTheme('light')
    } else {
      document.documentElement.classList.remove('light')
      if (window.api?.setTheme) window.api.setTheme('dark')
    }
  }, [])

  useEffect(() => {
    // Listen to file status updates from main process
    const unsubscribe = window.api.onFileStatus((status) => {
      setFilePath(status.filePath)
      setIsDirty(status.isDirty)

      // Load settings if a file is newly loaded
      if (status.filePath) {
        loadDbSettings()
      } else {
        // Reset to default on close
        setKurumAdi('Arazi Kanal Suyu Takip Programı')
        setKurumLogo(null)
      }
    })

    // Listen to auto-updater events
    const unsubAvailable = window.api.onUpdateAvailable((info) => {
      setUpdateAvailable(true)
      setUpdateInfo(info)
    })

    const unsubDownloaded = window.api.onUpdateDownloaded((info) => {
      setUpdateDownloaded(true)
      setUpdateAvailable(false)
      setUpdateInfo(info)
    })

    const unsubNotAvailable = window.api.onUpdateNotAvailable(() => {
      setUpdateAvailable(false)
    })

    return () => {
      unsubscribe()
      unsubAvailable()
      unsubDownloaded()
      unsubNotAvailable()
    }
  }, [])

  const handleSave = async (): Promise<void> => {
    try {
      const res = await window.api.saveFile()
      if (!res.success && res.error) {
        alert('Kaydetme başarısız: ' + res.error)
      }
    } catch (e: any) {
      alert('Kaydetme sırasında hata oluştu: ' + e.message)
    }
  }

  // Listen for Ctrl+S / Cmd+S keyboard shortcut to save database file
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (filePath && isDirty) {
          handleSave()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [filePath, isDirty])

  const handleClose = async (): Promise<void> => {
    try {
      await window.api.closeFile()
      clearTabs()
    } catch (e: any) {
      console.error('Error closing file:', e)
    }
  }

  const handleCheckUpdates = async (): Promise<void> => {
    setCheckingUpdate(true)
    try {
      await window.api.checkUpdates()
      alert(
        'Güncelleme sorgulaması yapıldı. Yeni bir sürüm varsa arka planda indirilmeye başlanacaktır.'
      )
    } catch (e: any) {
      alert('Güncelleme sorgulama hatası: ' + (e.message || e))
    } finally {
      setCheckingUpdate(false)
    }
  }

  const handleRestartAndInstall = async (): Promise<void> => {
    try {
      await window.api.restartAndInstall()
    } catch (e: any) {
      alert('Yükleme başlatılamadı: ' + e.message)
    }
  }

  // Triggered when settings are updated in Settings tab
  const handleSettingsSaved = (settings: {
    name: string
    logo: string | null
    theme: string
  }): void => {
    setKurumAdi(settings.name)
    setKurumLogo(settings.logo)
  }

  const getFileName = (): string => {
    if (!filePath) return ''
    const parts = filePath.split(/[/\\]/)
    return parts[parts.length - 1]
  }

  const handleMenuHover = (menu: 'dosya' | 'moduller' | 'islemler' | 'yardim') => {
    if (activeMenu !== null) {
      setActiveMenu(menu)
    }
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setThemeState(nextTheme)

    if (nextTheme === 'light') {
      document.documentElement.classList.add('light')
      if (window.api?.setTheme) window.api.setTheme('light')
    } else {
      document.documentElement.classList.remove('light')
      if (window.api?.setTheme) window.api.setTheme('dark')
    }
    localStorage.setItem('tema', nextTheme)

    if (filePath) {
      window.api
        .dbRun("UPDATE ayarlar SET deger = ? WHERE anahtar = 'tema'", [nextTheme])
        .catch(console.error)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--background)] relative">
      {/* 1. Desktop Menu Bar (Always visible at the top) */}
      <div
        className="h-9 bg-[var(--menubar-bg)] text-[var(--menubar-text)] border-b border-white/5 flex items-center justify-between pl-4 pr-[140px] text-xs select-none no-print z-50 w-full transition-colors duration-200"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left Side: Brand Logo, Name & Dropdown Triggers */}
        <div className="flex items-center space-x-4">
          <div
            className="flex items-center space-x-1.5 font-bold text-[var(--text-primary)] uppercase tracking-wider text-[10px] max-w-[180px] truncate"
            title={kurumAdi}
          >
            {kurumLogo ? (
              <img src={kurumLogo} alt="Logo" className="h-4 w-4 object-contain rounded shrink-0" />
            ) : (
              <Droplet className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            )}
            <span>{kurumAdi === 'Arazi Kanal Suyu Takip Programı' ? 'Arazi Takip' : kurumAdi}</span>
          </div>

          <div className="h-4 w-px bg-white/10"></div>

          {/* Menus List */}
          <div
            ref={menuRef}
            className="flex space-x-1"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {/* DOSYA MENU */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'dosya' ? null : 'dosya')}
                onMouseEnter={() => handleMenuHover('dosya')}
                className={`px-3 py-1 rounded transition cursor-pointer hover:text-[var(--menubar-text-hover)] hover:bg-[var(--menubar-active-bg)] ${activeMenu === 'dosya' ? 'bg-[var(--menubar-active-bg)] text-[var(--menubar-text-hover)]' : ''}`}
              >
                Dosya
              </button>
              {activeMenu === 'dosya' && (
                <div className="absolute left-0 mt-1.5 w-56 bg-slate-900 dark:bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50">
                  <button
                    onMouseDown={handleCreateNew}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-indigo-650 hover:text-white rounded-lg transition"
                  >
                    <FilePlus className="h-3.5 w-3.5" />
                    <span>Yeni Dosya Oluştur</span>
                  </button>
                  <button
                    onMouseDown={() => handleOpenFile()}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-indigo-650 hover:text-white rounded-lg transition"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span>Mevcut Dosya Aç...</span>
                  </button>

                  {filePath && (
                    <>
                      <div className="h-px bg-white/5 my-1"></div>
                      <button
                        onMouseDown={() => {
                          handleSave()
                          setActiveMenu(null)
                        }}
                        disabled={!isDirty}
                        className={`flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg transition ${isDirty ? 'hover:bg-indigo-600 hover:text-white text-slate-200' : 'text-slate-550 cursor-not-allowed'}`}
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Değişiklikleri Kaydet</span>
                      </button>
                      <button
                        onMouseDown={handleSendBackup}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-indigo-600 hover:text-white rounded-lg text-slate-200 transition"
                      >
                        <Mail className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Yedek E-postası Gönder</span>
                      </button>
                      <button
                        onMouseDown={() => {
                          handleClose()
                          setActiveMenu(null)
                        }}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-indigo-600 hover:text-white rounded-lg text-slate-200 transition"
                      >
                        <FolderClosed className="h-3.5 w-3.5" />
                        <span>Dosyayı Kapat</span>
                      </button>
                    </>
                  )}

                  <div className="h-px bg-white/5 my-1"></div>
                  <button
                    onMouseDown={handleExitApp}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-rose-600 hover:text-white text-rose-400 rounded-lg transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Çıkış</span>
                  </button>
                </div>
              )}
            </div>

            {/* MODÜLLER MENU */}
            <div className="relative">
              <button
                onClick={() => {
                  if (filePath) {
                    setActiveMenu(activeMenu === 'moduller' ? null : 'moduller')
                  }
                }}
                onMouseEnter={() => filePath && handleMenuHover('moduller')}
                disabled={!filePath}
                className={`px-3 py-1 rounded transition cursor-pointer hover:text-[var(--menubar-text-hover)] hover:bg-[var(--menubar-active-bg)] ${activeMenu === 'moduller' ? 'bg-[var(--menubar-active-bg)] text-[var(--menubar-text-hover)]' : ''} ${!filePath ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                Modüller
              </button>
              {activeMenu === 'moduller' && filePath && (
                <div className="absolute left-0 mt-1.5 w-56 bg-slate-900 dark:bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50">
                  <button
                    onMouseDown={() => {
                      addTab('dashboard')
                      setActiveMenu(null)
                    }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-600 hover:text-white text-slate-200'}`}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span>Genel Bakış (Dashboard)</span>
                  </button>
                  <button
                    onMouseDown={() => {
                      addTab('sulamalar')
                      setActiveMenu(null)
                    }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg transition ${activeTab === 'sulamalar' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-600 hover:text-white text-slate-200'}`}
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    <span>Fiş Girişleri (Sulamalar)</span>
                  </button>
                  <button
                    onMouseDown={() => {
                      addTab('odemeler')
                      setActiveMenu(null)
                    }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg transition ${activeTab === 'odemeler' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-600 hover:text-white text-slate-200'}`}
                  >
                    <Coins className="h-3.5 w-3.5" />
                    <span>Ödeme Takibi & Bildirimler</span>
                  </button>
                  <button
                    onMouseDown={() => {
                      addTab('tasinmazlar')
                      setActiveMenu(null)
                    }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg transition ${activeTab === 'tasinmazlar' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-600 hover:text-white text-slate-200'}`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Taşınmaz Tanımları</span>
                  </button>
                  <button
                    onMouseDown={() => {
                      addTab('gorevliler')
                      setActiveMenu(null)
                    }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg transition ${activeTab === 'gorevliler' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-600 hover:text-white text-slate-200'}`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Sulama Görevlileri</span>
                  </button>
                  <button
                    onMouseDown={() => {
                      addTab('malikler')
                      setActiveMenu(null)
                    }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg transition ${activeTab === 'malikler' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-600 hover:text-white text-slate-200'}`}
                  >
                    <User className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Malik Listesi</span>
                  </button>
                  <div className="h-px bg-white/5 my-1"></div>
                  <button
                    onMouseDown={() => {
                      addTab('ayarlar')
                      setActiveMenu(null)
                    }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg transition ${activeTab === 'ayarlar' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-600 hover:text-white text-slate-200'}`}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Sistem Ayarları</span>
                  </button>
                </div>
              )}
            </div>

            {/* İŞLEMLER MENU */}
            <div className="relative">
              <button
                onClick={() => {
                  if (filePath) {
                    setActiveMenu(activeMenu === 'islemler' ? null : 'islemler')
                  }
                }}
                onMouseEnter={() => filePath && handleMenuHover('islemler')}
                disabled={!filePath}
                className={`px-3 py-1 rounded transition cursor-pointer hover:text-[var(--menubar-text-hover)] hover:bg-[var(--menubar-active-bg)] ${activeMenu === 'islemler' ? 'bg-[var(--menubar-active-bg)] text-[var(--menubar-text-hover)]' : ''} ${!filePath ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                İşlemler
              </button>
              {activeMenu === 'islemler' && filePath && (
                <div className="absolute left-0 mt-1.5 w-60 bg-slate-900 dark:bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50">
                  <div className="px-3 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Fiş Giriş Görünümü
                  </div>
                  <button
                    onMouseDown={() => {
                      addTab('sulamalar')
                      setSulamaViewMode('standard')
                      setActiveMenu(null)
                    }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg transition ${activeTab === 'sulamalar' && sulamaViewMode === 'standard' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-600 hover:text-white text-slate-200'}`}
                  >
                    <FormInput className="h-3.5 w-3.5" />
                    <span>Klasik Form Girişi</span>
                  </button>
                  <button
                    onMouseDown={() => {
                      addTab('sulamalar')
                      setSulamaViewMode('excel')
                      setActiveMenu(null)
                    }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg transition ${activeTab === 'sulamalar' && sulamaViewMode === 'excel' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-600 hover:text-white text-slate-200'}`}
                  >
                    <Grid className="h-3.5 w-3.5" />
                    <span>Excel Tablo Giriş Modu</span>
                  </button>
                </div>
              )}
            </div>

            {/* YARDIM MENU */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'yardim' ? null : 'yardim')}
                onMouseEnter={() => handleMenuHover('yardim')}
                className={`px-3 py-1 rounded transition cursor-pointer hover:text-[var(--menubar-text-hover)] hover:bg-[var(--menubar-active-bg)] ${activeMenu === 'yardim' ? 'bg-[var(--menubar-active-bg)] text-[var(--menubar-text-hover)]' : ''}`}
              >
                Yardım
              </button>
              {activeMenu === 'yardim' && (
                <div className="absolute left-0 mt-1.5 w-56 bg-slate-900 dark:bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50">
                  <button
                    onMouseDown={() => {
                      handleCheckUpdates()
                      setActiveMenu(null)
                    }}
                    disabled={checkingUpdate}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-indigo-600 hover:text-white rounded-lg transition disabled:opacity-40 text-slate-200"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
                    <span>{checkingUpdate ? 'Denetleniyor...' : 'Güncelleme Denetle'}</span>
                  </button>
                  <button
                    onMouseDown={() => {
                      setShowAboutModal(true)
                      setActiveMenu(null)
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-indigo-600 hover:text-white rounded-lg transition text-slate-200"
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span>Hakkında</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: File status, Save/Close & Theme */}
        <div
          className="flex items-center space-x-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* UPDATE STATUS BADGES */}
          {updateDownloaded && (
            <button
              onClick={handleRestartAndInstall}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-650 hover:bg-emerald-550 text-white font-bold text-[10px] animate-pulse cursor-pointer transition shrink-0"
              title="Yeni sürüm hazır! Şimdi yüklemek için tıklayın."
            >
              <Sparkles className="h-3 w-3 text-yellow-350" />
              <span>Yeniden Başlat</span>
            </button>
          )}

          {updateAvailable && !updateDownloaded && (
            <div
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-600/20 text-amber-400 font-semibold text-[10px] select-none shrink-0"
              title="Yeni güncelleme indiriliyor..."
            >
              <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
              <span>İndiriliyor...</span>
            </div>
          )}

          {/* THEME SWITCHER */}
          <button
            onClick={toggleTheme}
            className="p-1 hover:bg-[var(--menubar-active-bg)] hover:text-[var(--menubar-text-hover)] rounded transition cursor-pointer"
            title="Temayı Değiştir"
          >
            {theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          </button>

          {filePath && (
            <div className="flex items-center space-x-2.5">
              {/* Auto Save status or Dirty Warning */}
              <div className="hidden sm:flex items-center space-x-1.5 text-[10px] font-medium border-r border-white/5 pr-3">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}
                ></span>
                <span className={isDirty ? 'text-amber-400' : 'text-slate-405 font-semibold'}>
                  {isDirty ? 'Değişiklikler Kaydedilmedi' : 'Kayıtlı'}
                </span>
              </div>

              {/* File name */}
              <div
                className="text-[10px] font-bold text-slate-300 max-w-[150px] truncate"
                title={filePath}
              >
                {getFileName()}
              </div>

              {/* Quick Save */}
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className={`p-1 rounded transition cursor-pointer ${isDirty ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'opacity-50 cursor-not-allowed'}`}
                title="Değişiklikleri Dosyaya Kaydet"
              >
                <Save className="h-3.5 w-3.5" />
              </button>

              {/* Close database file */}
              <button
                onClick={handleClose}
                className="p-1 hover:bg-rose-500/15 hover:text-rose-400 rounded transition cursor-pointer"
                title="Veritabanı Dosyasını Kapat"
              >
                <FolderClosed className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main content area */}
      {!filePath ? (
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Floating Banner */}
          {updateDownloaded && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-3 flex items-center justify-between text-xs font-semibold shadow-lg z-50">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-yellow-300 animate-spin" />
                Yeni Güncelleme İndirildi ({updateInfo?.version || 'Yeni Sürüm'})! Yeniden başlatıp
                yüklemek ister misiniz?
              </span>
              <button
                onClick={handleRestartAndInstall}
                className="bg-white text-emerald-800 px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition shadow font-bold text-xs"
              >
                Şimdi Yükle ve Başlat
              </button>
            </div>
          )}

          {/* Extra check updates link in Welcome screen */}
          <div className="absolute top-4 right-4 z-40">
            <button
              onClick={handleCheckUpdates}
              disabled={checkingUpdate}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-white/10 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <RefreshCw
                className={`h-3 w-3 ${checkingUpdate ? 'animate-spin text-indigo-450' : ''}`}
              />
              <span>{checkingUpdate ? 'Denetleniyor...' : 'Güncelleme Denetle'}</span>
              {updateAvailable && (
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              )}
            </button>
          </div>

          <Startup onFileLoaded={(path) => setFilePath(path)} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsBar />
          {/* Sub-Header / Breadcrumb */}
          <div className="h-10 bg-slate-900/10 border-b border-white/5 flex items-center justify-between px-6 shrink-0 no-print">
            <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-400">
              <span className="text-slate-500">Modül:</span>
              <span className="text-indigo-450 capitalize bg-indigo-500/5 px-2 py-0.5 rounded-full border border-indigo-500/10">
                {activeTab === 'sulamalar'
                  ? 'Fiş Girişi'
                  : activeTab === 'odemeler'
                    ? 'Ödeme Takibi & Bildirimler'
                    : activeTab}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-[10px]">
              {/* Global Landowner Profile Search */}
              <div className="relative flex items-center mr-2">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  list="global-owner-list"
                  placeholder="Kişi Dosyası Ara..."
                  className="pl-8 pr-3 py-1 rounded-lg bg-slate-950/40 border border-white/5 text-[10.5px] text-slate-200 placeholder-slate-500 w-44 focus:w-60 focus:border-indigo-500 transition-all outline-none font-medium"
                  value={globalSearchOwner}
                  onChange={(e) => {
                    const val = e.target.value
                    setGlobalSearchOwner(val)
                    if (uniqueOwners.includes(val)) {
                      addTab('profil', { owner: val })
                      setGlobalSearchOwner('')
                    }
                  }}
                />
                <datalist id="global-owner-list">
                  {uniqueOwners.map((owner) => (
                    <option key={owner} value={owner} />
                  ))}
                </datalist>
              </div>

              {isDirty && (
                <span className="text-amber-400 font-medium animate-pulse flex items-center gap-1">
                  ⚠️ Kaydedilmemiş Değişiklikler Var
                </span>
              )}

              {!isDirty && (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  ✓ Otomatik Kaydedildi (SQLite)
                </span>
              )}
            </div>
          </div>

          {/* Module view content panels */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'sulamalar' && (
              <Sulamalar viewMode={sulamaViewMode} onViewModeChange={setSulamaViewMode} />
            )}
            {activeTab === 'odemeler' && <Odemeler />}
            {activeTab === 'tasinmazlar' && <Tasinmazlar />}
            {activeTab === 'gorevliler' && <Gorevliler />}
            {activeTab === 'ayarlar' && <Ayarlar onSettingsSaved={handleSettingsSaved} />}
            {activeTab === 'malikler' && <Malikler />}
            {activeTab === 'profil' && activeTabItem?.params?.owner && (
              <KisiProfil ownerName={activeTabItem.params.owner} />
            )}
          </div>

          {/* Footer */}
          <Footer />
        </div>
      )}

      {/* 3. Centered Premium About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-3xl text-white shadow-xl shadow-indigo-500/10">
                <Droplet className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Arazi Kanal Suyu Asistanı</h3>
                <p className="text-xs text-slate-450 mt-1">Sürüm v{appVersion}</p>
              </div>

              <div className="w-full text-[11px] text-slate-400 bg-slate-950/45 border border-white/5 rounded-2xl p-4 text-left leading-relaxed font-medium">
                ⚠️ <strong>Sorumluluk Sınırı:</strong> Bu uygulama, arazi sulama takip süreçlerinizi
                kolaylaştıran, verileri hızlıca kaydetmenizi ve makbuz/fiş üretmenizi sağlayan
                yardımcı bir yazılımdır. Resmi/yasal bir sorumluluk üstlenmez.
              </div>

              <div className="w-full flex flex-col gap-2 pt-2 text-xs">
                <a
                  href="https://github.com/ilyasbozdemir/arazi-kanal-suyu-takip-app"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-800 hover:bg-indigo-950/20 hover:border-indigo-500/30 border border-transparent rounded-xl text-slate-300 hover:text-indigo-400 transition"
                >
                  <span className="font-bold flex items-center gap-2">⭐ GitHub Reposu</span>
                  <span className="text-[10px] text-slate-500">Yıldız Ver</span>
                </a>

                <a
                  href="https://ilyasbozdemir.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-800 hover:bg-indigo-950/20 hover:border-indigo-500/30 border border-transparent rounded-xl text-slate-300 hover:text-indigo-400 transition"
                >
                  <span className="flex items-center gap-2">👨‍💻 Geliştirici: İlyas Bozdemir</span>
                  <span className="text-[10px] text-slate-500">ilyasbozdemir.dev</span>
                </a>

                <a
                  href="https://github.com/ilyasbozdemir/arazi-kanal-suyu-takip-app/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 bg-slate-800 hover:bg-indigo-950/20 hover:border-indigo-500/30 border border-transparent rounded-xl text-slate-350 hover:text-indigo-400 transition"
                >
                  <span className="flex items-center gap-2">🐛 Hata Bildir / Destek</span>
                  <span className="text-[10px] text-slate-500">Destek</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Setup Wizard Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-8 relative animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full text-white shadow-xl shadow-indigo-500/20 mb-2">
                <Settings className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-white">
                  İlk Kurulum: Fiş Giriş Yöntemi
                </h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Sulamalar ekranında kayıt yaparken mülk/kişi seçiminin nasıl yapılacağını
                  belirleyin. Bu ayar sistemin size daha hızlı bir giriş sağlaması içindir.
                </p>
              </div>

              <div className="w-full flex flex-col gap-4 mt-6">
                <button
                  disabled
                  className="flex flex-col items-start p-4 bg-slate-900/40 border-2 border-white/5 opacity-50 rounded-2xl text-left cursor-not-allowed w-full"
                >
                  <span className="font-bold text-slate-500 flex items-center gap-2 text-lg">
                    <Layers className="h-5 w-5 text-slate-600" />1 - Taşınmaza Göre Seçim (Açılır
                    Liste) [Pasif]
                  </span>
                  <span className="text-xs text-slate-650 mt-2">
                    Bu yöntem devre dışı bırakılmıştır. Fiş girişi için Fişe Göre (Ada-Parsel) yöntemi kullanılacaktır.
                  </span>
                </button>

                <button
                  onClick={async () => {
                    await window.api.dbRun(
                      "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('fis_giris_yontemi', 'hizli')"
                    )
                    setShowSetupModal(false)
                  }}
                  className="flex flex-col items-start p-4 bg-slate-800/80 hover:bg-emerald-600/20 border-2 border-transparent hover:border-emerald-500 rounded-2xl text-left transition group cursor-pointer w-full"
                >
                  <span className="font-bold text-slate-200 group-hover:text-white flex items-center gap-2 text-lg">
                    <Receipt className="h-5 w-5 text-emerald-400" />2 - Meravnden Gelen Fişe
                    Göre (Aktif)
                  </span>
                  <span className="text-xs text-slate-450 mt-2">
                    Matbu fişleri (örn: Ada-Parsel 250-5) sisteme hızlıca aktarmak için bunu kullanın.
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
