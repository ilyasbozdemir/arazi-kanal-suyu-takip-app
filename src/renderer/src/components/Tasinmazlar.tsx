import React, { useState, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search, Edit2, Trash2, Save, X, Layers, AlertCircle } from 'lucide-react'

interface Tasinmaz {
  id: number
  tapu_sahibi: string
  ada: string
  parsel: string
  alan_m2: number
  mahalle_koy: string
  kanal_adi: string
  aciklama: string
}

export default function Tasinmazlar(): React.JSX.Element {
  const [tasinmazlar, setTasinmazlar] = useState<Tasinmaz[]>([])
  const [search, setSearch] = useState('')
  const [filterMahalle, setFilterMahalle] = useState('Hepsi')
  const [filterKanal, setFilterKanal] = useState('Hepsi')
  
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form State
  const [tapuSahibi, setTapuSahibi] = useState('')
  const [ada, setAda] = useState('')
  const [parsel, setParsel] = useState('')
  const [alanM2, setAlanM2] = useState('')
  const [mahalleKoy, setMahalleKoy] = useState('')
  const [kanalAdi, setKanalAdi] = useState('')
  const [aciklama, setAciklama] = useState('')

  const [error, setError] = useState('')

  // Unique filter values and channels
  const [mahalleList, setMahalleList] = useState<string[]>([])
  const [kanalList, setKanalList] = useState<string[]>([])
  const [definedChannels, setDefinedChannels] = useState<string[]>(['Ana Kanal'])

  const loadTasinmazlar = async (): Promise<void> => {
    try {
      const data = await window.api.dbQuery('SELECT * FROM tasinmazlar ORDER BY tapu_sahibi ASC')
      setTasinmazlar(data)

      // Get unique values for filters
      const uniqueMahalle = Array.from(new Set(data.map((item) => item.mahalle_koy).filter(Boolean)))
      const uniqueKanal = Array.from(new Set(data.map((item) => item.kanal_adi).filter(Boolean)))
      
      setMahalleList(uniqueMahalle)
      setKanalList(uniqueKanal)

      // Load defined channels from settings
      const resKanallar = await window.api.dbQuery("SELECT deger FROM ayarlar WHERE anahtar = 'su_kanallari'")
      let channelsList: string[] = ['Ana Kanal']
      if (resKanallar && resKanallar[0]?.deger) {
        try {
          channelsList = JSON.parse(resKanallar[0].deger)
        } catch (e) {
          channelsList = resKanallar[0].deger.split(',').filter(Boolean)
        }
      }
      setDefinedChannels(channelsList)
      
      // Default selection if not editing
      if (!editingId && channelsList.length > 0) {
        setKanalAdi((prev) => prev || channelsList[0])
      }
    } catch (e) {
      console.error('Error loading properties:', e)
    }
  }

  useEffect(() => {
    loadTasinmazlar()
  }, [editingId])

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')

    if (!tapuSahibi.trim()) {
      setError('Tapu Sahibi alanı boş bırakılamaz.')
      return
    }

    const numericAlan = parseFloat(alanM2)
    if (isNaN(numericAlan) || numericAlan <= 0) {
      setError('Geçerli bir alan (m²) girmelisiniz.')
      return
    }

    try {
      if (editingId) {
        // Update
        await window.api.dbRun(
          'UPDATE tasinmazlar SET tapu_sahibi = ?, ada = ?, parsel = ?, alan_m2 = ?, mahalle_koy = ?, kanal_adi = ?, aciklama = ? WHERE id = ?',
          [
            tapuSahibi.trim(),
            ada.trim(),
            parsel.trim(),
            numericAlan,
            mahalleKoy.trim(),
            kanalAdi.trim(),
            aciklama.trim(),
            editingId
          ]
        )
      } else {
        // Insert
        await window.api.dbRun(
          'INSERT INTO tasinmazlar (tapu_sahibi, ada, parsel, alan_m2, mahalle_koy, kanal_adi, aciklama) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            tapuSahibi.trim(),
            ada.trim(),
            parsel.trim(),
            numericAlan,
            mahalleKoy.trim(),
            kanalAdi.trim(),
            aciklama.trim()
          ]
        )
      }

      resetForm()
      await loadTasinmazlar()
    } catch (e: any) {
      console.error('Error saving property:', e)
      setError('Kaydedilirken bir hata oluştu: ' + e.message)
    }
  }

  const handleEdit = (tasinmaz: Tasinmaz): void => {
    setEditingId(tasinmaz.id)
    setTapuSahibi(tasinmaz.tapu_sahibi)
    setAda(tasinmaz.ada || '')
    setParsel(tasinmaz.parsel || '')
    setAlanM2(tasinmaz.alan_m2?.toString() || '')
    setMahalleKoy(tasinmaz.mahalle_koy || '')
    setKanalAdi(tasinmaz.kanal_adi || '')
    setAciklama(tasinmaz.aciklama || '')
    setError('')
  }

  const handleDelete = async (id: number, owner: string): Promise<void> => {
    const confirm = window.confirm(`${owner} adına kayıtlı taşınmazı silmek istediğinize emin misiniz?\nBu taşınmaza ait tüm sulama fişleri/geçmişi de KALICI OLARAK silinecektir!`)
    if (!confirm) return

    try {
      await window.api.dbRun('DELETE FROM tasinmazlar WHERE id = ?', [id])
      await loadTasinmazlar()
      if (editingId === id) resetForm()
    } catch (e: any) {
      console.error('Error deleting property:', e)
      alert('Hata: Taşınmaz silinemedi: ' + e.message)
    }
  }

  const resetForm = (): void => {
    setEditingId(null)
    setTapuSahibi('')
    setAda('')
    setParsel('')
    setAlanM2('')
    setMahalleKoy('')
    setKanalAdi(definedChannels.length > 0 ? definedChannels[0] : '')
    setAciklama('')
    setError('')
  }

  // Filter and Search logic
  const filteredTasinmazlar = tasinmazlar.filter((t) => {
    const term = search.toLowerCase()
    const matchesSearch =
      t.tapu_sahibi.toLowerCase().includes(term) ||
      (t.ada || '').toLowerCase().includes(term) ||
      (t.parsel || '').toLowerCase().includes(term) ||
      (t.kanal_adi || '').toLowerCase().includes(term)

    const matchesMahalle = filterMahalle === 'Hepsi' || t.mahalle_koy === filterMahalle
    const matchesKanal = filterKanal === 'Hepsi' || t.kanal_adi === filterKanal

    return matchesSearch && matchesMahalle && matchesKanal
  })

  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: filteredTasinmazlar.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  })

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Taşınmazlar</h1>
        <p className="text-slate-400 mt-1">Sistemde sulama hizmeti alan arazilerin ve tapuların listesi.</p>
      </div>

      {/* Main Content Split Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Side: List & Filters (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col space-y-4 min-h-0">
          
          {/* Search & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ada, Parsel, Tapu Sahibi ara..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2 bg-slate-900/40 border border-white/5 rounded-xl px-2.5">
              <span className="text-xs text-slate-400 whitespace-nowrap">Köy/Mahalle:</span>
              <select
                className="bg-transparent border-none text-xs text-slate-200 outline-none w-full py-2 cursor-pointer"
                value={filterMahalle}
                onChange={(e) => setFilterMahalle(e.target.value)}
              >
                <option className="bg-slate-950 text-slate-200" value="Hepsi">Hepsi</option>
                {mahalleList.map((m, i) => (
                  <option key={i} className="bg-slate-950 text-slate-200" value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-slate-900/40 border border-white/5 rounded-xl px-2.5">
              <span className="text-xs text-slate-400 whitespace-nowrap">Su Kanalı:</span>
              <select
                className="bg-transparent border-none text-xs text-slate-200 outline-none w-full py-2 cursor-pointer"
                value={filterKanal}
                onChange={(e) => setFilterKanal(e.target.value)}
              >
                <option className="bg-slate-950 text-slate-200" value="Hepsi">Hepsi</option>
                {kanalList.map((k, i) => (
                  <option key={i} className="bg-slate-950 text-slate-200" value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List Card Container */}
          <div className="glass-card rounded-2xl flex-1 p-4">
            <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Tapu Sahibi</th>
                    <th className="py-3 px-3">Köy / Mahalle</th>
                    <th className="py-3 px-3 text-center">Ada / Parsel</th>
                    <th className="py-3 px-3 text-right">Alan (m²)</th>
                    <th className="py-3 px-3">Kanal Adı</th>
                    <th className="py-3 px-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative', display: 'block' }}>
                  {filteredTasinmazlar.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">
                        Kriterlere uygun tapu kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const t = filteredTasinmazlar[virtualRow.index]
                      return (
                        <tr 
                          key={t.id}
                          ref={rowVirtualizer.measureElement}
                          data-index={virtualRow.index}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                            display: 'table',
                            tableLayout: 'fixed',
                          }}
                          className={`border-b border-slate-800/50 hover:bg-slate-800/10 text-sm transition ${
                            editingId === t.id ? 'bg-indigo-500/5 border-indigo-500/30' : ''
                          }`}
                        >
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="font-semibold text-white block">{t.tapu_sahibi}</span>
                            {t.aciklama && (
                              <span className="text-xs text-slate-400 block max-w-xs truncate">{t.aciklama}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-slate-300">
                            {t.mahalle_koy || <span className="text-slate-500">-</span>}
                          </td>
                          <td className="py-3.5 px-3 text-center text-slate-300">
                            {t.ada && t.parsel ? `${t.ada} / ${t.parsel}` : (t.ada || t.parsel || <span className="text-slate-500">-</span>)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-indigo-300 font-medium">
                            {t.alan_m2 ? `${t.alan_m2.toLocaleString('tr-TR')} m²` : '-'}
                          </td>
                          <td className="py-3.5 px-3">
                            {t.kanal_adi ? (
                              <span className="text-cyan-300 font-medium text-xs bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full inline-block">
                                {t.kanal_adi}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(t)}
                                title="Düzenle"
                                className="p-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(t.id, t.tapu_sahibi)}
                                title="Sil"
                                className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Form (1 Col) */}
        <div className="glass-card p-6 rounded-2xl h-fit">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              {editingId ? 'Taşınmazı Düzenle' : 'Yeni Taşınmaz Ekle'}
            </h3>
            {editingId && (
              <button 
                onClick={resetForm} 
                className="text-slate-400 hover:text-slate-200"
                title="İptal Et"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Input Tapu Sahibi */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tapu Sahibi *</label>
              <input
                type="text"
                placeholder="Örn: Mehmet Özkan"
                className="w-full px-3 py-2.5 rounded-xl glass-input text-sm font-medium"
                value={tapuSahibi}
                onChange={(e) => setTapuSahibi(e.target.value)}
                required
              />
            </div>

            {/* Grid Ada / Parsel */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Ada</label>
                <input
                  type="text"
                  placeholder="Örn: 104"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-sm"
                  value={ada}
                  onChange={(e) => setAda(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Parsel</label>
                <input
                  type="text"
                  placeholder="Örn: 12"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-sm"
                  value={parsel}
                  onChange={(e) => setParsel(e.target.value)}
                />
              </div>
            </div>

            {/* Input Alan (m2) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Alan (m²) *</label>
              <input
                type="number"
                step="any"
                placeholder="Örn: 4500"
                className="w-full px-3 py-2.5 rounded-xl glass-input text-sm"
                value={alanM2}
                onChange={(e) => setAlanM2(e.target.value)}
                required
              />
            </div>

            {/* Input Mahalle / Koy */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Köy / Mahalle</label>
              <input
                type="text"
                placeholder="Örn: Akçaören Köyü"
                className="w-full px-3 py-2.5 rounded-xl glass-input text-sm"
                value={mahalleKoy}
                onChange={(e) => setMahalleKoy(e.target.value)}
              />
            </div>

            {/* Su Kanalı / Kaynağı Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">Kanal Adı / Su Kaynağı</label>
              {definedChannels.length === 1 ? (
                <div className="w-full px-3 py-2.5 bg-slate-900/40 border border-white/5 text-slate-350 text-xs rounded-xl font-medium select-none">
                  {definedChannels[0]} <span className="text-[10px] text-slate-500 block mt-0.5">(Tek kanal tanımlı, ayarlardan değiştirebilirsiniz)</span>
                </div>
              ) : definedChannels.length > 1 ? (
                <select
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-medium cursor-pointer"
                  value={kanalAdi}
                  onChange={(e) => setKanalAdi(e.target.value)}
                >
                  {definedChannels.map((chan, idx) => (
                    <option key={idx} className="bg-slate-950 text-slate-200" value={chan}>
                      {chan}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Ayarlardan kanal tanımlayın..."
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                  value={kanalAdi}
                  onChange={(e) => setKanalAdi(e.target.value)}
                />
              )}
            </div>

            {/* Input Aciklama */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Açıklama / Not</label>
              <textarea
                placeholder="Taşınmazla ilgili ek notlar..."
                className="w-full px-3 py-2.5 rounded-xl glass-input text-sm h-18 resize-none"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200"
              >
                <Save className="h-4.5 w-4.5" />
                <span>Kaydet</span>
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition duration-200"
                >
                  İptal
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
