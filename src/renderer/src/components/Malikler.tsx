import React, { useState, useEffect } from 'react'
import { Search, UserPlus, User, MapPin, Building, ArrowRight } from 'lucide-react'
import { useTabStore } from '../store/tabStore'

interface Malik {
  tapu_sahibi: string
  tasinmaz_sayisi: number
  toplam_alan: number
  mahalleler: string | null
}

const turkishToLower = (str: string): string => {
  if (!str) return ''
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ş/g, 'ş')
    .replace(/Ç/g, 'ç')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ö/g, 'ö')
    .toLowerCase()
}

export default function Malikler(): React.JSX.Element {
  const [malikler, setMalikler] = useState<Malik[]>([])
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMalikName, setNewMalikName] = useState('')
  const [newMahalle, setNewMahalle] = useState('')
  const [newMevki, setNewMevki] = useState('')
  const [newAda, setNewAda] = useState('')
  const [newParsel, setNewParsel] = useState('')
  const [newAlan, setNewAlan] = useState('')
  const [newSuHakki, setNewSuHakki] = useState('')
  const [newKanal, setNewKanal] = useState('')
  const [error, setError] = useState('')
  
  const { addTab } = useTabStore()

  const resetAddForm = () => {
    setNewMalikName('')
    setNewMahalle('')
    setNewMevki('')
    setNewAda('')
    setNewParsel('')
    setNewAlan('')
    setNewSuHakki('')
    setNewKanal('')
    setError('')
  }

  const loadMalikler = async (): Promise<void> => {
    try {
      const data = await window.api.dbQuery(`
        SELECT tapu_sahibi, 
               COUNT(*) as tasinmaz_sayisi, 
               SUM(alan_m2) as toplam_alan,
               GROUP_CONCAT(DISTINCT mahalle_koy) as mahalleler
        FROM tasinmazlar 
        GROUP BY tapu_sahibi 
        ORDER BY tapu_sahibi ASC
      `)
      setMalikler(data || [])
    } catch (e) {
      console.error('Error loading malikler:', e)
    }
  }

  useEffect(() => {
    loadMalikler()
  }, [])

  const handleAddMalik = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')
    const name = newMalikName.trim()
    if (!name) {
      setError('Lütfen bir isim girin.')
      return
    }

    try {
      // Check if landowner name already exists
      const existing = await window.api.dbQuery(
        'SELECT id FROM tasinmazlar WHERE LOWER(TRIM(tapu_sahibi)) = LOWER(TRIM(?)) LIMIT 1',
        [name]
      )

      if (existing && existing.length > 0) {
        setError('Bu isimde bir malik zaten kayıtlı.')
        return
      }

      const alanVal = parseFloat(newAlan) || 0

      // Add a real estate record to register the owner in database with optional fields
      await window.api.dbRun(
        `INSERT INTO tasinmazlar (tapu_sahibi, ada, parsel, alan_m2, mahalle_koy, mevki, su_hakki, kanal_adi, aciklama) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, 
          newAda.trim(), 
          newParsel.trim(), 
          alanVal, 
          newMahalle.trim(), 
          newMevki.trim(), 
          newSuHakki.trim(), 
          newKanal.trim(), 
          'Malik kaydı ile otomatik oluşturulan taşınmaz varlığı'
        ]
      )

      resetAddForm()
      setShowAddModal(false)
      await loadMalikler()

      // Redirect directly to the new profile tab
      addTab('profil', { owner: name })
    } catch (e: any) {
      console.error('Error adding landowner:', e)
      setError('Kaydedilirken hata oluştu: ' + e.message)
    }
  }

  const filteredMalikler = malikler.filter((m) => {
    const term = turkishToLower(search)
    return turkishToLower(m.tapu_sahibi).includes(term) || 
           (m.mahalleler && turkishToLower(m.mahalleler).includes(term))
  })

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-400" />
            Malik Listesi
          </h2>
          <p className="text-xs text-slate-450 mt-1">
            Sistemde kayıtlı arazi sahiplerinin (maliklerin) listesi ve toplam arazi varlıkları.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/15 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Yeni Malik Ekle</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/20 border border-white/5 p-4 rounded-2xl text-xs shrink-0">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Malik ismi veya mahalle ile ara..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-center bg-indigo-950/15 border border-indigo-500/10 rounded-xl px-4 py-2 text-indigo-300 font-semibold">
          Toplam Kayıtlı Malik: {malikler.length}
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {filteredMalikler.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl border border-white/5">
            <User className="h-10 w-10 text-slate-650 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">Arama kriterlerine uygun malik bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
            {filteredMalikler.map((m) => {
              const villages = m.mahalleler 
                ? Array.from(new Set(m.mahalleler.split(',').filter(Boolean))) 
                : []

              return (
                <div 
                  key={m.tapu_sahibi}
                  className="glass-card p-4 rounded-2xl border border-white/5 hover:border-indigo-500/25 transition duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-200 text-sm group-hover:text-indigo-300 transition truncate" title={m.tapu_sahibi}>
                        {m.tapu_sahibi}
                      </div>
                      <span className="shrink-0 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md text-[10px] font-bold">
                        {m.tasinmaz_sayisi} Taşınmaz
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-500" />
                        <span>Toplam Alan: <strong className="text-slate-300">{m.toplam_alan.toLocaleString('tr-TR')} m²</strong></span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">
                          Mahalleler: {villages.length > 0 ? (
                            villages.map((v, i) => (
                              <span key={v} className="text-slate-300">
                                {v}{i < villages.length - 1 ? ', ' : ''}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">Girilmemiş</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-900/60 mt-4 flex justify-end">
                    <button
                      onClick={() => addTab('profil', { owner: m.tapu_sahibi })}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                    >
                      <span>Detaylı Profil</span>
                      <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Landowner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200">Yeni Malik Ekle</h3>
              <button 
                onClick={() => {
                  setShowAddModal(false)
                  resetAddForm()
                }}
                className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMalik} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                  Tapu Sahibi / Malik Adı Soyadı *
                </label>
                <input
                  type="text"
                  placeholder="Örn: Mehmet Yılmaz"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-bold"
                  value={newMalikName}
                  onChange={(e) => setNewMalikName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Optional property fields */}
              <div className="border-t border-white/5 pt-3 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  İlk Arazi Tanımı (İsteğe Bağlı)
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Mahalle/Köy</label>
                    <input
                      type="text"
                      placeholder="Örn: Atatürk Mah."
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      value={newMahalle}
                      onChange={(e) => setNewMahalle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Mevki</label>
                    <input
                      type="text"
                      placeholder="Örn: Köyyeri"
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      value={newMevki}
                      onChange={(e) => setNewMevki(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Ada</label>
                    <input
                      type="text"
                      placeholder="Ada"
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                      value={newAda}
                      onChange={(e) => setNewAda(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Parsel</label>
                    <input
                      type="text"
                      placeholder="Parsel"
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                      value={newParsel}
                      onChange={(e) => setNewParsel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Alan (m²)</label>
                    <input
                      type="number"
                      placeholder="m²"
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      value={newAlan}
                      onChange={(e) => setNewAlan(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Kanal Adı</label>
                    <input
                      type="text"
                      placeholder="Örn: Sol Sahil P1"
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      value={newKanal}
                      onChange={(e) => setNewKanal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Su Hakkı</label>
                    <input
                      type="text"
                      placeholder="Örn: 12 Saat / Ay"
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      value={newSuHakki}
                      onChange={(e) => setNewSuHakki(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetAddForm()
                  }}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/15 cursor-pointer"
                >
                  Kaydet ve Profil Aç
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
