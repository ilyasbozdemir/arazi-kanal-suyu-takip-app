import React, { useState, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search, Edit2, Trash2, Save, X, Layers, AlertCircle, Plus, Grid, FormInput } from 'lucide-react'

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
  const [pageSizeLimit, setPageSizeLimit] = useState<number>(0) // 0 = Hepsi

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

  // View Mode
  const [viewMode, setViewMode] = useState<'standard' | 'excel'>('standard')

  // New Row State (Excel Mode)
  const [newRow, setNewRow] = useState({
    tapu_sahibi: '',
    ada: '',
    parsel: '',
    alan_m2: '',
    mahalle_koy: '',
    kanal_adi: '',
    aciklama: ''
  })

  const loadTasinmazlar = async (): Promise<void> => {
    try {
      const data = await window.api.dbQuery('SELECT * FROM tasinmazlar ORDER BY tapu_sahibi ASC')
      setTasinmazlar(data)

      // Get unique values for filters
      const uniqueMahalle = Array.from(
        new Set(data.map((item) => item.mahalle_koy).filter(Boolean))
      )
      const uniqueKanal = Array.from(new Set(data.map((item) => item.kanal_adi).filter(Boolean)))

      setMahalleList(uniqueMahalle)
      setKanalList(uniqueKanal)

      // Load defined channels from settings
      const resKanallar = await window.api.dbQuery(
        "SELECT deger FROM ayarlar WHERE anahtar = 'su_kanallari'"
      )
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

  // Inline Row Update (Excel Mode)
  const updateExcelRow = async (id: number, field: string, value: any): Promise<void> => {
    try {
      const row = tasinmazlar.find((t) => t.id === id)
      if (!row) return

      let { tapu_sahibi, ada, parsel, alan_m2, mahalle_koy, kanal_adi, aciklama } = row

      if (field === 'tapu_sahibi') tapu_sahibi = value
      else if (field === 'ada') ada = value
      else if (field === 'parsel') parsel = value
      else if (field === 'alan_m2') alan_m2 = parseFloat(value) || 0
      else if (field === 'mahalle_koy') mahalle_koy = value
      else if (field === 'kanal_adi') kanal_adi = value
      else if (field === 'aciklama') aciklama = value

      await window.api.dbRun(
        'UPDATE tasinmazlar SET tapu_sahibi = ?, ada = ?, parsel = ?, alan_m2 = ?, mahalle_koy = ?, kanal_adi = ?, aciklama = ? WHERE id = ?',
        [tapu_sahibi, ada, parsel, alan_m2, mahalle_koy, kanal_adi, aciklama, id]
      )

      await loadTasinmazlar()
    } catch (e: any) {
      console.error('Error updating excel row inline:', e)
    }
  }

  // Quick Insert (Excel Mode bottom row)
  const handleAddExcelRow = async (): Promise<void> => {
    if (!newRow.tapu_sahibi.trim()) {
      alert('Tapu Sahibi alanı boş bırakılamaz.')
      return
    }

    const numericAlan = parseFloat(newRow.alan_m2) || 0

    try {
      await window.api.dbRun(
        'INSERT INTO tasinmazlar (tapu_sahibi, ada, parsel, alan_m2, mahalle_koy, kanal_adi, aciklama) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          newRow.tapu_sahibi.trim(),
          newRow.ada.trim(),
          newRow.parsel.trim(),
          numericAlan,
          newRow.mahalle_koy.trim(),
          newRow.kanal_adi.trim(),
          newRow.aciklama.trim()
        ]
      )

      setNewRow({
        tapu_sahibi: '',
        ada: '',
        parsel: '',
        alan_m2: '',
        mahalle_koy: '',
        kanal_adi: definedChannels.length > 0 ? definedChannels[0] : '',
        aciklama: ''
      })

      await loadTasinmazlar()
    } catch (e: any) {
      console.error('Error quick inserting excel row:', e)
      alert('Kaydedilirken hata oluştu.')
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
    const confirm = window.confirm(
      `${owner} adına kayıtlı taşınmazı silmek istediğinize emin misiniz?\nBu taşınmaza ait tüm sulama fişleri/geçmişi de KALICI OLARAK silinecektir!`
    )
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
    const term = turkishToLower(search)
    const matchesSearch =
      turkishToLower(t.tapu_sahibi).includes(term) ||
      turkishToLower(t.ada || '').includes(term) ||
      turkishToLower(t.parsel || '').includes(term) ||
      turkishToLower(t.kanal_adi || '').includes(term)

    const matchesMahalle = filterMahalle === 'Hepsi' || t.mahalle_koy === filterMahalle
    const matchesKanal = filterKanal === 'Hepsi' || t.kanal_adi === filterKanal

    return matchesSearch && matchesMahalle && matchesKanal
  })

  // Apply page size limit
  const paginatedTasinmazlar =
    pageSizeLimit > 0 ? filteredTasinmazlar.slice(0, pageSizeLimit) : filteredTasinmazlar

  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: paginatedTasinmazlar.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10
  })

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Taşınmazlar</h1>
          <p className="text-slate-400 mt-1">
            Sistemde sulama hizmeti alan arazilerin ve tapuların listesi.
          </p>
        </div>
        
        {/* View Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900/50 p-1 rounded-xl border border-white/5 shadow-inner">
          <button
            onClick={() => setViewMode('standard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'standard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FormInput className="w-3.5 h-3.5" />
            <span>Klasik Form</span>
          </button>
          <button
            onClick={() => setViewMode('excel')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'excel'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Excel Tablo</span>
          </button>
        </div>
      </div>

      {/* Main Content Split Area */}
      {viewMode === 'standard' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Side: List & Filters (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col space-y-4 min-h-0">
          {/* Search & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Fiş No, Seri No, Tapu Sahibi ara..."
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
                <option className="bg-slate-950 text-slate-200" value="Hepsi">
                  Hepsi
                </option>
                {mahalleList.map((m, i) => (
                  <option key={i} className="bg-slate-950 text-slate-200" value={m}>
                    {m}
                  </option>
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
                <option className="bg-slate-950 text-slate-200" value="Hepsi">
                  Hepsi
                </option>
                {kanalList.map((k, i) => (
                  <option key={i} className="bg-slate-950 text-slate-200" value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List Card Container */}
          <div className="glass-card rounded-2xl flex-1 flex flex-col p-4">
            {/* Header and Page Limit Control */}
            <div className="flex justify-between items-center mb-3 text-xs">
              <span className="text-slate-400 font-medium">
                {filteredTasinmazlar.length} kayıt bulundu
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Göster:</span>
                <select
                  className="bg-slate-900/40 border border-white/10 rounded-lg px-2 py-1 text-slate-200 outline-none cursor-pointer"
                  value={pageSizeLimit}
                  onChange={(e) => setPageSizeLimit(Number(e.target.value))}
                >
                  <option value={0}>Hepsi</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-12 gap-2 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider py-3 px-3">
              <div className="col-span-3">Tapu Sahibi</div>
              <div className="col-span-2">Köy / Mahalle</div>
              <div className="col-span-2 text-center">Fiş No / Seri No</div>
              <div className="col-span-2 text-right">Alan (m²)</div>
              <div className="col-span-2">Kanal Adı</div>
              <div className="col-span-1 text-right">İşlemler</div>
            </div>

            <div
              ref={parentRef}
              className="flex-1 overflow-y-auto overflow-x-hidden min-h-[300px]"
              style={{ height: '500px' }}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative'
                }}
              >
                {paginatedTasinmazlar.length === 0 ? (
                  <div className="absolute top-0 left-0 w-full text-center py-8 text-slate-500 text-sm">
                    Kriterlere uygun tapu kaydı bulunamadı.
                  </div>
                ) : (
                  rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const t = paginatedTasinmazlar[virtualRow.index]
                    return (
                      <div
                        key={t.id}
                        ref={rowVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`
                        }}
                        className={`grid grid-cols-12 gap-2 items-center border-b border-slate-800/50 hover:bg-slate-800/10 text-sm transition py-3 px-3 ${
                          editingId === t.id ? 'bg-indigo-500/5 border-indigo-500/30' : ''
                        }`}
                      >
                        <div className="col-span-3 truncate pr-2">
                          <span
                            className="font-semibold text-white block truncate"
                            title={t.tapu_sahibi}
                          >
                            {t.tapu_sahibi.replace(/\n/g, ', ')}
                            {(t.tapu_sahibi.includes(',') || t.tapu_sahibi.includes('\n')) && (
                              <span className="ml-1.5 text-[9px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider align-middle">Hisseli</span>
                            )}
                          </span>
                          {t.aciklama && (
                            <span
                              className="text-xs text-slate-400 block truncate"
                              title={t.aciklama}
                            >
                              {t.aciklama}
                            </span>
                          )}
                        </div>
                        <div
                          className="col-span-2 text-slate-300 truncate pr-2"
                          title={t.mahalle_koy}
                        >
                          {t.mahalle_koy || <span className="text-slate-500">-</span>}
                        </div>
                        <div className="col-span-2 text-center text-slate-300 truncate">
                          {t.ada && t.parsel
                            ? `${t.ada} / ${t.parsel}`
                            : t.ada || t.parsel || <span className="text-slate-500">-</span>}
                        </div>
                        <div className="col-span-2 text-right text-indigo-300 font-medium truncate pr-2">
                          {t.alan_m2 ? `${t.alan_m2.toLocaleString('tr-TR')} m²` : '-'}
                        </div>
                        <div className="col-span-2 truncate">
                          {t.kanal_adi ? (
                            <span className="text-cyan-300 font-medium text-xs bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full inline-block truncate max-w-full">
                              {t.kanal_adi}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </div>
                        <div className="col-span-1 flex justify-end space-x-2">
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
                      </div>
                    )
                  })
                )}
              </div>
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
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex justify-between">
                <span>Tapu Sahibi *</span>
                <span className="text-[10px] text-slate-500 lowercase normal-case">(Birden fazla ise alt alta yazın)</span>
              </label>
              <textarea
                placeholder="Örn: Mehmet Özkan&#10;Ahmet Yılmaz (Hissedar)"
                className="w-full px-3 py-2.5 rounded-xl glass-input text-sm font-medium h-16 resize-none"
                value={tapuSahibi}
                onChange={(e) => setTapuSahibi(e.target.value)}
                required
              />
            </div>

            {/* Grid Fiş No / Seri No */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-330 uppercase tracking-wider">
                  Fiş No
                </label>
                <input
                  type="text"
                  placeholder="Örn: 450"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-sm"
                  value={ada}
                  onChange={(e) => setAda(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-330 uppercase tracking-wider">
                  Seri No
                </label>
                <input
                  type="text"
                  placeholder="Örn: 4"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-sm"
                  value={parsel}
                  onChange={(e) => setParsel(e.target.value)}
                />
              </div>
            </div>

            {/* Input Alan (m2) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Alan (m²) *
              </label>
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
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Köy / Mahalle
              </label>
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
              <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                Kanal Adı / Su Kaynağı
              </label>
              {definedChannels.length === 1 ? (
                <div className="w-full px-3 py-2.5 bg-slate-900/40 border border-white/5 text-slate-350 text-xs rounded-xl font-medium select-none">
                  {definedChannels[0]}{' '}
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    (Tek kanal tanımlı, ayarlardan değiştirebilirsiniz)
                  </span>
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
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Açıklama / Not
              </label>
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
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
          {/* Excel Header */}
          <div className="grid grid-cols-12 gap-1 border-b border-slate-800 bg-slate-950/80 px-2 py-2 text-xs font-bold text-slate-300">
            <div className="col-span-3">Tapu Sahibi</div>
            <div className="col-span-1">Fiş No</div>
            <div className="col-span-1">Seri No</div>
            <div className="col-span-1 text-right">Alan (m²)</div>
            <div className="col-span-2">Mahalle/Köy</div>
            <div className="col-span-2">Kanal Adı</div>
            <div className="col-span-2">Açıklama</div>
          </div>

          {/* Excel Body */}
          <div
            ref={parentRef}
            className="flex-1 overflow-auto bg-slate-950"
            style={{ minHeight: '300px' }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative'
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = paginatedTasinmazlar[virtualRow.index]
                return (
                  <div
                    key={row.id}
                    className="absolute top-0 left-0 w-full grid grid-cols-12 gap-1 border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors px-2 py-1 items-center group"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                      height: `${virtualRow.size}px`
                    }}
                  >
                    {/* tapu_sahibi */}
                    <div className="col-span-3">
                      <input
                        type="text"
                        className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-white"
                        defaultValue={row.tapu_sahibi}
                        onBlur={(e) => updateExcelRow(row.id, 'tapu_sahibi', e.target.value)}
                      />
                    </div>
                    {/* ada */}
                    <div className="col-span-1">
                      <input
                        type="text"
                        className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-white"
                        defaultValue={row.ada || ''}
                        onBlur={(e) => updateExcelRow(row.id, 'ada', e.target.value)}
                      />
                    </div>
                    {/* parsel */}
                    <div className="col-span-1">
                      <input
                        type="text"
                        className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-white"
                        defaultValue={row.parsel || ''}
                        onBlur={(e) => updateExcelRow(row.id, 'parsel', e.target.value)}
                      />
                    </div>
                    {/* alan_m2 */}
                    <div className="col-span-1">
                      <input
                        type="number"
                        className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-right text-indigo-300 font-medium"
                        defaultValue={row.alan_m2 || ''}
                        onBlur={(e) => updateExcelRow(row.id, 'alan_m2', e.target.value)}
                      />
                    </div>
                    {/* mahalle_koy */}
                    <div className="col-span-2">
                      <input
                        type="text"
                        className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-white"
                        defaultValue={row.mahalle_koy || ''}
                        onBlur={(e) => updateExcelRow(row.id, 'mahalle_koy', e.target.value)}
                      />
                    </div>
                    {/* kanal_adi */}
                    <div className="col-span-2">
                      <select
                        className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-white"
                        defaultValue={row.kanal_adi || ''}
                        onChange={(e) => updateExcelRow(row.id, 'kanal_adi', e.target.value)}
                      >
                        <option value="" className="bg-slate-900 text-slate-200">Seçiniz...</option>
                        {definedChannels.map(c => (
                          <option key={c} value={c} className="bg-slate-900 text-slate-200">{c}</option>
                        ))}
                      </select>
                    </div>
                    {/* aciklama & Delete button */}
                    <div className="col-span-2 flex items-center space-x-1 pr-1">
                      <input
                        type="text"
                        className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-slate-400 flex-1"
                        defaultValue={row.aciklama || ''}
                        onBlur={(e) => updateExcelRow(row.id, 'aciklama', e.target.value)}
                      />
                      <button
                        onClick={() => handleDelete(row.id, row.tapu_sahibi)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* New Row Area */}
          <div className="bg-slate-900 border-t border-slate-700/50 p-2 shadow-2xl z-10">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-3">
                <input
                  type="text"
                  placeholder="Yeni Tapu Sahibi..."
                  className="bg-slate-950 border border-indigo-500/30 focus:border-indigo-500 rounded px-2 py-1.5 w-full text-xs text-white"
                  value={newRow.tapu_sahibi}
                  onChange={(e) => setNewRow({ ...newRow, tapu_sahibi: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <input
                  type="text"
                  placeholder="Ada"
                  className="bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded px-2 py-1.5 w-full text-xs text-white"
                  value={newRow.ada}
                  onChange={(e) => setNewRow({ ...newRow, ada: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <input
                  type="text"
                  placeholder="Parsel"
                  className="bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded px-2 py-1.5 w-full text-xs text-white"
                  value={newRow.parsel}
                  onChange={(e) => setNewRow({ ...newRow, parsel: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <input
                  type="number"
                  placeholder="Alan m²"
                  className="bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded px-2 py-1.5 w-full text-xs text-right text-indigo-300"
                  value={newRow.alan_m2}
                  onChange={(e) => setNewRow({ ...newRow, alan_m2: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Mahalle/Köy"
                  className="bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded px-2 py-1.5 w-full text-xs text-white"
                  value={newRow.mahalle_koy}
                  onChange={(e) => setNewRow({ ...newRow, mahalle_koy: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <select
                  className="bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded px-2 py-1.5 w-full text-xs text-white"
                  value={newRow.kanal_adi}
                  onChange={(e) => setNewRow({ ...newRow, kanal_adi: e.target.value })}
                >
                  <option value="" className="bg-slate-900 text-slate-200">Kanal Seç...</option>
                  {definedChannels.map(c => (
                    <option key={c} value={c} className="bg-slate-900 text-slate-200">{c}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Açıklama"
                  className="bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded px-2 py-1.5 w-full text-xs text-white flex-1"
                  value={newRow.aciklama}
                  onChange={(e) => setNewRow({ ...newRow, aciklama: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddExcelRow()
                  }}
                />
                <button
                  onClick={handleAddExcelRow}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-1.5 flex items-center justify-center transition shrink-0 shadow-lg"
                  title="Ekle (Enter)"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
