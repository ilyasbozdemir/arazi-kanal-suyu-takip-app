import React, { useEffect, useState } from 'react'
import { FilePlus, FolderOpen, History, Trash2, Droplets, AlertCircle } from 'lucide-react'
interface RecentFile {
  path: string
  name: string
  openedAt: string
}

interface StartupProps {
  onFileLoaded: (filePath: string) => void
}

export default function Startup({ onFileLoaded }: StartupProps): React.JSX.Element {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadRecentFiles = async (): Promise<void> => {
    try {
      const files = await window.api.getRecentFiles()
      setRecentFiles(files)
    } catch (e) {
      console.error('Error loading recent files:', e)
    }
  }

  useEffect(() => {
    loadRecentFiles()
  }, [])

  const handleCreateNew = async (): Promise<void> => {
    setError('')
    setLoading(true)
    try {
      const res = await window.api.createNewFile()
      if (res.success && res.filePath) {
        onFileLoaded(res.filePath)
      } else if (res.error) {
        setError(res.error)
      }
    } catch (e: any) {
      setError('Dosya oluşturulamadı: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenFile = async (pathToCheck?: string): Promise<void> => {
    setError('')
    setLoading(true)
    try {
      const res = await window.api.openFile(pathToCheck)
      if (res.success && res.filePath) {
        onFileLoaded(res.filePath)
      } else if (res.error) {
        setError(res.error)
      }
    } catch (e: any) {
      setError('Dosya açılamadı: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveRecent = async (e: React.MouseEvent, path: string): Promise<void> => {
    e.stopPropagation() // Don't trigger opening
    try {
      await window.api.removeRecentFile(path)
      await loadRecentFiles()
    } catch (e) {
      console.error('Error removing recent file:', e)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-6 bg-[var(--background)] overflow-y-auto">
      {/* Brand Logo & Name */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex p-4 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-3xl shadow-xl shadow-indigo-500/10 text-white animate-pulse">
          <Droplets className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Arazi Kanal Suyu Takibi
        </h1>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">
          Arazi sahiplerini, görevlileri ve sulama fişlerini tek bir dosyada güvenle saklayın ve
          yönetin.
        </p>
      </div>

      {/* Main Panel Box */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Actions */}
        <div className="space-y-4 flex flex-col justify-center">
          {error && (
            <div className="p-4 bg-rose-500/15 border border-rose-500/20 rounded-2xl flex items-start space-x-2 text-rose-400 text-xs">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Create File Card */}
          <button
            onClick={handleCreateNew}
            disabled={loading}
            className="glass-card text-left p-6 rounded-2xl flex items-start space-x-4 w-full group cursor-pointer disabled:opacity-50"
          >
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
              <FilePlus className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                Yeni Dosya Oluştur
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Kanal suyu takibi için sıfırdan yeni bir `.asut` veritabanı dosyası oluşturun.
              </p>
            </div>
          </button>

          {/* Open File Card */}
          <button
            onClick={() => handleOpenFile()}
            disabled={loading}
            className="glass-card text-left p-6 rounded-2xl flex items-start space-x-4 w-full group cursor-pointer disabled:opacity-50"
          >
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                Mevcut Dosya Aç
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Daha önce oluşturulmuş bir `.asut` takip dosyasını bilgisayarınızdan seçin.
              </p>
            </div>
          </button>
        </div>

        {/* Right Side: Recent Files History */}
        <div className="glass-card p-6 rounded-2xl flex flex-col min-h-[300px]">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
            <History className="h-4.5 w-4.5 text-slate-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Son Açılan Dosyalar
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[260px] pr-1">
            {recentFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-500">
                <span className="text-xs">Yakın zamanda açılmış dosya bulunmuyor.</span>
              </div>
            ) : (
              recentFiles.map((file, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOpenFile(file.path)}
                  className="p-3 bg-slate-900/50 hover:bg-indigo-950/20 border border-white/5 hover:border-indigo-500/30 rounded-xl flex items-center justify-between cursor-pointer group transition duration-200"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-semibold text-white block truncate group-hover:text-indigo-400 transition">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate" title={file.path}>
                      {file.path}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[9px] text-slate-500 whitespace-nowrap">
                      {new Date(file.openedAt).toLocaleDateString('tr-TR')}
                    </span>
                    <button
                      onClick={(e) => handleRemoveRecent(e, file.path)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                      title="Geçmişten Kaldır"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-[10px] text-slate-600 mt-12 border-t border-slate-800/40 pt-4 w-full text-center">
        Arazi ve Kanal Suyu Takip Sistemi v1.0.0
      </div>
    </div>
  )
}
