import React, { useState, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search, Edit2, Trash2, Clock, Coins, Save, X, Printer, AlertCircle, Grid, FormInput, Plus, CheckCircle2 } from 'lucide-react'

interface Sulama {
  id: number
  tasinmaz_id: number
  gorevli_id: number
  sulama_tarihi: string
  sulama_suresi_saat: number
  ucret: number
  odeme_durumu: string
  aciklama: string
  // Joined fields
  tapu_sahibi: string
  ada: string
  parsel: string
  alan_m2: number
  mahalle_koy: string
  kanal_adi: string
  ad_soyad: string
  gorev: string
}

interface Tasinmaz {
  id: number
  tapu_sahibi: string
  ada: string
  parsel: string
  alan_m2: number
  mahalle_koy: string
  kanal_adi: string
}

interface Gorevli {
  id: number
  ad_soyad: string
  gorev: string
  aktif: number
}

interface SulamalarProps {
  viewMode: 'standard' | 'excel'
  onViewModeChange: (mode: 'standard' | 'excel') => void
}

export default function Sulamalar({ viewMode, onViewModeChange }: SulamalarProps): React.JSX.Element {
  const [sulamalar, setSulamalar] = useState<Sulama[]>([])
  const [tasinmazlar, setTasinmazlar] = useState<Tasinmaz[]>([])
  const [gorevliler, setGorevliler] = useState<Gorevli[]>([])

  const [search, setSearch] = useState('')
  const [filterOdeme, setFilterOdeme] = useState('Hepsi')
  
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showPrintModal, setShowPrintModal] = useState<Sulama | null>(null)

  // Form State (Standard Mode)
  const [tasinmazId, setTasinmazId] = useState('')
  const [fisGirisYontemi, setFisGirisYontemi] = useState<'liste' | 'hizli'>('liste')
  const [fisNoGiris, setFisNoGiris] = useState('')
  const [bulunanTasinmazSahibi, setBulunanTasinmazSahibi] = useState<string | null>(null)
  
  const [gorevliId, setGorevliId] = useState('')
  const [sulamaTarihi, setSulamaTarihi] = useState(new Date().toISOString().split('T')[0])
  const [sulamaSuresiSaat, setSulamaSuresiSaat] = useState('')
  const [saatUcreti, setSaatUcreti] = useState('150') // Default hourly rate
  const [ucret, setUcret] = useState('')
  const [odemeDurumu, setOdemeDurumu] = useState('Ödenmedi')
  const [aciklama, setAciklama] = useState('')

  // New Row State (Excel Mode)
  const [newRow, setNewRow] = useState({
    tasinmaz_id: '',
    gorevli_id: '',
    sulama_tarihi: new Date().toISOString().split('T')[0],
    sulama_suresi_saat: '',
    ucret: '',
    odeme_durumu: 'Ödenmedi',
    aciklama: ''
  })

  const [error, setError] = useState('')
  const [isCalculated, setIsCalculated] = useState(true)

  // Virtual scroll refs
  const standardListRef = useRef<HTMLDivElement>(null)
  const excelListRef = useRef<HTMLDivElement>(null)

  const loadData = async (): Promise<void> => {
    try {
      // Load slips with joined data
      const slips = await window.api.dbQuery(`
        SELECT s.*, t.tapu_sahibi, t.ada, t.parsel, t.alan_m2, t.mahalle_koy, t.kanal_adi,
               g.ad_soyad, g.gorev
        FROM sulamalar s
        JOIN tasinmazlar t ON s.tasinmaz_id = t.id
        JOIN gorevliler g ON s.gorevli_id = g.id
        ORDER BY s.sulama_tarihi DESC, s.id DESC
      `)
      setSulamalar(slips)

      // Load properties for dropdown
      const props = await window.api.dbQuery('SELECT * FROM tasinmazlar ORDER BY tapu_sahibi ASC')
      setTasinmazlar(props)

      // Load fis_giris_yontemi from settings
      const ayarlarRes = await window.api.dbQuery("SELECT deger FROM ayarlar WHERE anahtar = 'fis_giris_yontemi'")
      if (ayarlarRes && ayarlarRes.length > 0) {
        setFisGirisYontemi(ayarlarRes[0].deger as 'liste' | 'hizli')
      }

      // Load active officers for dropdown
      const officers = await window.api.dbQuery('SELECT * FROM gorevliler WHERE aktif = 1 ORDER BY ad_soyad ASC')
      setGorevliler(officers)

      // Set default officer for new row state if not set
      if (officers.length > 0 && !newRow.gorevli_id) {
        setNewRow((prev) => ({ ...prev, gorevli_id: officers[0].id.toString() }))
      }
    } catch (e) {
      console.error('Error loading data:', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto calculate fee when hours or rate changes (Standard Form)
  useEffect(() => {
    if (isCalculated) {
      const hours = parseFloat(sulamaSuresiSaat)
      const rate = parseFloat(saatUcreti)
      if (!isNaN(hours) && !isNaN(rate) && hours > 0 && rate > 0) {
        setUcret((hours * rate).toFixed(2))
      } else {
        setUcret('')
      }
    }
  }, [sulamaSuresiSaat, saatUcreti, isCalculated])

  // Auto calculate fee when hours or rate changes (Excel Mode New Row)
  useEffect(() => {
    if (isCalculated) {
      const hours = parseFloat(newRow.sulama_suresi_saat)
      const rate = parseFloat(saatUcreti)
      if (!isNaN(hours) && !isNaN(rate) && hours > 0 && rate > 0) {
        setNewRow((prev) => ({ ...prev, ucret: (hours * rate).toFixed(2) }))
      } else {
        setNewRow((prev) => ({ ...prev, ucret: '' }))
      }
    }
  }, [newRow.sulama_suresi_saat, saatUcreti, isCalculated])

  // Save/Update Handler (Standard Mode)
  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')

    if (!tasinmazId) {
      setError('Lütfen bir taşınmaz seçin.')
      return
    }

    if (!gorevliId) {
      setError('Lütfen bir görevli seçin.')
      return
    }

    const hours = parseFloat(sulamaSuresiSaat)
    if (isNaN(hours) || hours <= 0) {
      setError('Geçerli bir sulama süresi (saat) girin.')
      return
    }

    const fee = parseFloat(ucret)
    if (isNaN(fee) || fee < 0) {
      setError('Geçerli bir ücret tutarı girin.')
      return
    }

    try {
      if (editingId) {
        // Update
        await window.api.dbRun(
          `UPDATE sulamalar 
           SET tasinmaz_id = ?, gorevli_id = ?, sulama_tarihi = ?, sulama_suresi_saat = ?, ucret = ?, odeme_durumu = ?, aciklama = ? 
           WHERE id = ?`,
          [
            parseInt(tasinmazId),
            parseInt(gorevliId),
            sulamaTarihi,
            hours,
            fee,
            odemeDurumu,
            aciklama.trim(),
            editingId
          ]
        )
      } else {
        // Insert
        await window.api.dbRun(
          `INSERT INTO sulamalar (tasinmaz_id, gorevli_id, sulama_tarihi, sulama_suresi_saat, ucret, odeme_durumu, aciklama) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            parseInt(tasinmazId),
            parseInt(gorevliId),
            sulamaTarihi,
            hours,
            fee,
            odemeDurumu,
            aciklama.trim()
          ]
        )
      }

      resetForm()
      await loadData()
    } catch (e: any) {
      console.error('Error saving slip:', e)
      setError('Kaydedilirken hata oluştu: ' + e.message)
    }
  }

  // Inline Row Update (Excel Mode)
  const updateExcelRow = async (id: number, field: string, value: any): Promise<void> => {
    try {
      const row = sulamalar.find((s) => s.id === id)
      if (!row) return

      let updatedHours = row.sulama_suresi_saat
      let updatedFee = row.ucret
      let updatedTasinmazId = row.tasinmaz_id
      let updatedGorevliId = row.gorevli_id
      let updatedTarih = row.sulama_tarihi
      let updatedOdeme = row.odeme_durumu
      let updatedAciklama = row.aciklama

      if (field === 'sulama_suresi_saat') {
        updatedHours = parseFloat(value) || 0
        if (isCalculated) {
          const rate = parseFloat(saatUcreti) || 0
          updatedFee = parseFloat((updatedHours * rate).toFixed(2))
        }
      } else if (field === 'ucret') {
        updatedFee = parseFloat(value) || 0
      } else if (field === 'tasinmaz_id') {
        updatedTasinmazId = parseInt(value)
      } else if (field === 'gorevli_id') {
        updatedGorevliId = parseInt(value)
      } else if (field === 'sulama_tarihi') {
        updatedTarih = value
      } else if (field === 'odeme_durumu') {
        updatedOdeme = value
      } else if (field === 'aciklama') {
        updatedAciklama = value
      }

      await window.api.dbRun(
        `UPDATE sulamalar 
         SET tasinmaz_id = ?, gorevli_id = ?, sulama_tarihi = ?, sulama_suresi_saat = ?, ucret = ?, odeme_durumu = ?, aciklama = ? 
         WHERE id = ?`,
        [
          updatedTasinmazId,
          updatedGorevliId,
          updatedTarih,
          updatedHours,
          updatedFee,
          updatedOdeme,
          updatedAciklama,
          id
        ]
      )

      await loadData()
    } catch (e: any) {
      console.error('Error updating excel row inline:', e)
    }
  }

  // Quick Insert (Excel Mode bottom row)
  const handleAddExcelRow = async (): Promise<void> => {
    if (!newRow.tasinmaz_id) {
      alert('Lütfen bir taşınmaz seçin.')
      return
    }
    if (!newRow.gorevli_id) {
      alert('Lütfen bir görevli seçin.')
      return
    }
    const hours = parseFloat(newRow.sulama_suresi_saat)
    if (isNaN(hours) || hours <= 0) {
      alert('Geçerli bir sulama süresi girin.')
      return
    }
    const fee = parseFloat(newRow.ucret)
    if (isNaN(fee) || fee < 0) {
      alert('Geçerli bir ücret girin.')
      return
    }

    try {
      await window.api.dbRun(
        `INSERT INTO sulamalar (tasinmaz_id, gorevli_id, sulama_tarihi, sulama_suresi_saat, ucret, odeme_durumu, aciklama) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          parseInt(newRow.tasinmaz_id),
          parseInt(newRow.gorevli_id),
          newRow.sulama_tarihi,
          hours,
          fee,
          newRow.odeme_durumu,
          newRow.aciklama.trim()
        ]
      )

      // Reset bottom row state
      setNewRow({
        tasinmaz_id: '',
        gorevli_id: gorevliler.length > 0 ? gorevliler[0].id.toString() : '',
        sulama_tarihi: new Date().toISOString().split('T')[0],
        sulama_suresi_saat: '',
        ucret: '',
        odeme_durumu: 'Ödenmedi',
        aciklama: ''
      })

      await loadData()
    } catch (e: any) {
      console.error('Error inserting excel row:', e)
      alert('Kayıt eklenemedi: ' + e.message)
    }
  }

  const handleEdit = (s: Sulama): void => {
    onViewModeChange('standard') // Switch to standard view to edit in form
    setEditingId(s.id)
    setTasinmazId(s.tasinmaz_id.toString())
    
    // Auto-fill fisNoGiris if in hizli mode
    const t = tasinmazlar.find(x => x.id === s.tasinmaz_id)
    if (t && t.ada && t.parsel) {
      setFisNoGiris(`${t.ada}-${t.parsel}`)
      setBulunanTasinmazSahibi(`${t.tapu_sahibi} (${t.mahalle_koy})`)
    } else {
      setFisNoGiris('')
      setBulunanTasinmazSahibi(null)
    }

    setGorevliId(s.gorevli_id.toString())
    setSulamaTarihi(s.sulama_tarihi)
    setSulamaSuresiSaat(s.sulama_suresi_saat.toString())
    setUcret(s.ucret.toString())
    setOdemeDurumu(s.odeme_durumu)
    setAciklama(s.aciklama || '')
    setIsCalculated(false) // Let user keep original override fee during edit
    setError('')
  }

  const handleDelete = async (id: number): Promise<void> => {
    const confirm = window.confirm('Bu sulama fişini silmek istediğinize emin misiniz?')
    if (!confirm) return

    try {
      await window.api.dbRun('DELETE FROM sulamalar WHERE id = ?', [id])
      await loadData()
      if (editingId === id) resetForm()
    } catch (e: any) {
      console.error('Error deleting slip:', e)
      alert('Silme sırasında hata oluştu: ' + e.message)
    }
  }

  const resetForm = (): void => {
    setEditingId(null)
    setTasinmazId('')
    setFisNoGiris('')
    setBulunanTasinmazSahibi(null)
    setGorevliId(gorevliler.length > 0 ? gorevliler[0].id.toString() : '')
    setSulamaTarihi(new Date().toISOString().split('T')[0])
    setSulamaSuresiSaat('')
    setUcret('')
    setOdemeDurumu('Ödenmedi')
    setAciklama('')
    setIsCalculated(true)
    setError('')
  }

  const handlePrint = (): void => {
    window.print()
  }

  const handleFisNoChange = (val: string) => {
    setFisNoGiris(val)
    // format is expected to be "Ada-Parsel" or "Ada/Parsel" or "Ada Parsel"
    const parts = val.replace(/[\/\\]/g, '-').replace(/\s+/g, '-').split('-').map(s => s.trim())
    
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const ada = parts[0]
      const parsel = parts[1]
      
      const match = tasinmazlar.find(t => t.ada === ada && t.parsel === parsel)
      if (match) {
        setTasinmazId(match.id.toString())
        setBulunanTasinmazSahibi(`${match.tapu_sahibi} (${match.mahalle_koy})`)
      } else {
        setTasinmazId('')
        setBulunanTasinmazSahibi(null)
      }
    } else {
      setTasinmazId('')
      setBulunanTasinmazSahibi(null)
    }
  }

  // Search and Filter Slips
  const filteredSulamalar = sulamalar.filter((s) => {
    const term = search.toLowerCase()
    const matchesSearch =
      s.tapu_sahibi.toLowerCase().includes(term) ||
      (s.ad_soyad || '').toLowerCase().includes(term) ||
      (s.kanal_adi || '').toLowerCase().includes(term) ||
      (s.mahalle_koy || '').toLowerCase().includes(term)

    const matchesOdeme = filterOdeme === 'Hepsi' || s.odeme_durumu === filterOdeme

    return matchesSearch && matchesOdeme
  })

  // Virtual scrollers
  const standardVirtualizer = useVirtualizer({
    count: filteredSulamalar.length,
    getScrollElement: () => standardListRef.current,
    estimateSize: () => 64,
    overscan: 10,
  })

  const excelVirtualizer = useVirtualizer({
    count: filteredSulamalar.length,
    getScrollElement: () => excelListRef.current,
    estimateSize: () => 38,
    overscan: 10,
  })

  return (
    <div className="space-y-6 h-full flex flex-col no-print">
      
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Fiş Girişi</h1>
          <p className="text-slate-400 mt-1">Yapılan arazi sulamalarını kaydedin, ücret hesaplayın ve makbuz yazdırın.</p>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex space-x-2 bg-slate-900/50 p-1 border border-white/5 rounded-2xl self-start sm:self-center shrink-0">
          <button
            onClick={() => onViewModeChange('standard')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'standard'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FormInput className="w-3.5 h-3.5" />
            <span>Form Görünümü</span>
          </button>
          
          <button
            onClick={() => onViewModeChange('excel')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === 'excel'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Excel Düzenleme Görünümü</span>
          </button>
        </div>
      </div>

      {/* View Search/Calculations settings */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/20 border border-white/5 p-4 rounded-2xl text-xs">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Mülk sahibi, görevli adı veya kanal ile ara..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-900/40 border border-white/5 rounded-xl px-2.5">
          <span className="text-slate-400 whitespace-nowrap">Ödeme Durumu:</span>
          <select
            className="bg-transparent border-none text-slate-200 outline-none w-full py-2 cursor-pointer"
            value={filterOdeme}
            onChange={(e) => setFilterOdeme(e.target.value)}
          >
            <option className="bg-slate-950 text-slate-200" value="Hepsi">Hepsi</option>
            <option className="bg-slate-950 text-slate-200" value="Ödendi">Ödendi</option>
            <option className="bg-slate-950 text-slate-200" value="Ödenmedi">Ödenmedi</option>
          </select>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900/40 border border-white/5 rounded-xl px-2.5 justify-between">
          <div className="flex items-center space-x-2 w-full">
            <span className="text-slate-400 whitespace-nowrap">Saatlik Ücret (₺):</span>
            <input
              type="number"
              className="bg-transparent border-none text-indigo-300 outline-none text-right font-bold w-16"
              value={saatUcreti}
              onChange={(e) => setSaatUcreti(e.target.value)}
              title="Form/Excel modlarında kullanılacak saatlik sulama tarifesi"
            />
          </div>
          
          <button
            type="button"
            className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border transition ${
              isCalculated 
                ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' 
                : 'bg-slate-800 text-slate-400 border-transparent'
            }`}
            onClick={() => setIsCalculated(!isCalculated)}
            title="Otomatik ücret hesaplamasını açar veya kapatır"
          >
            {isCalculated ? 'Oto' : 'Man'}
          </button>
        </div>
      </div>

      {/* --- RENDER LAYOUT BASED ON VIEW MODE --- */}

      {viewMode === 'standard' ? (
        /* STANDARD FORM VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          
          {/* Slips List with Virtual Scrolling */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="glass-card rounded-2xl flex-1 flex flex-col overflow-hidden p-4">
              {/* Sticky Header */}
              <div className="overflow-x-auto shrink-0">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-2">Tarih</th>
                      <th className="py-3 px-2">Taşınmaz (Tapu Sahibi)</th>
                      <th className="py-3 px-2">Görevli</th>
                      <th className="py-3 px-2 text-right">Süre (Saat)</th>
                      <th className="py-3 px-2 text-right">Ücret</th>
                      <th className="py-3 px-2 text-center">Durum</th>
                      <th className="py-3 px-2 text-right">İşlemler</th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Virtual Scroll Area */}
              <div ref={standardListRef} className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
                {filteredSulamalar.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    Kriterlere uygun sulama fişi bulunamadı.
                  </div>
                ) : (
                  <div style={{ height: `${standardVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    <table className="w-full text-left border-collapse text-xs">
                      <tbody>
                        {standardVirtualizer.getVirtualItems().map((virtualRow) => {
                          const s = filteredSulamalar[virtualRow.index]
                          return (
                            <tr 
                              key={s.id}
                              data-index={virtualRow.index}
                              ref={standardVirtualizer.measureElement}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start}px)`,
                                display: 'table-row',
                              }}
                              className={`border-b border-slate-800/50 hover:bg-slate-800/10 text-sm text-slate-350 transition ${
                                editingId === s.id ? 'bg-indigo-500/5 border-indigo-500/30' : ''
                              }`}
                            >
                              <td className="py-3 px-2 whitespace-nowrap">
                                {new Date(s.sulama_tarihi).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="py-3 px-2">
                                <span className="font-semibold text-white block">{s.tapu_sahibi}</span>
                                <span className="text-xs text-slate-450 block">
                                  {s.mahalle_koy} | Ada {s.ada} Parsel {s.parsel}
                                </span>
                              </td>
                              <td className="py-3 px-2 whitespace-nowrap text-slate-300">
                                {s.ad_soyad}
                              </td>
                              <td className="py-3 px-2 text-right text-indigo-300 whitespace-nowrap font-medium">
                                {s.sulama_suresi_saat} sa
                              </td>
                              <td className="py-3 px-2 text-right font-medium text-white">
                                ₺ {s.ucret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  s.odeme_durumu === 'Ödendi' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {s.odeme_durumu}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <div className="flex justify-end space-x-1">
                                  <button
                                    onClick={() => setShowPrintModal(s)}
                                    title="Fiş Yazdır"
                                    className="p-1.5 text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(s)}
                                    title="Düzenle"
                                    className="p-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(s.id)}
                                    title="Sil"
                                    className="p-1.5 text-rose-400 hover:text-rose-350 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Record Count Footer */}
              <div className="shrink-0 pt-3 border-t border-slate-800/30 mt-2 text-[10px] text-slate-500 flex justify-between">
                <span>{filteredSulamalar.length} kayıt listeleniyor</span>
                <span>Toplam: {sulamalar.length} fiş</span>
              </div>
            </div>
          </div>

          {/* Standard Form Panel */}
          <div className="glass-card p-6 rounded-2xl h-fit">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-400" />
                {editingId ? 'Fişi Düzenle' : 'Yeni Fiş Girişi'}
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

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Select Tasinmaz or Fast Entry */}
              {fisGirisYontemi === 'liste' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider">Taşınmaz (Arazi Sahibi) *</label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                    value={tasinmazId}
                    onChange={(e) => setTasinmazId(e.target.value)}
                    required
                  >
                    <option className="bg-slate-950 text-slate-400" value="">-- Mülk Seçin --</option>
                    {tasinmazlar.map((t) => (
                      <option key={t.id} className="bg-slate-950 text-slate-200" value={t.id}>
                        {t.tapu_sahibi} - {t.mahalle_koy} (Ada {t.ada || '-'} Parsel {t.parsel || '-'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider">Ada-Parsel Fiş Numarası *</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-mono font-bold tracking-wider"
                      placeholder="Örn: 202-5"
                      value={fisNoGiris}
                      onChange={(e) => handleFisNoChange(e.target.value)}
                      required
                    />
                  </div>
                  {bulunanTasinmazSahibi ? (
                    <div className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1 font-semibold animate-fadeIn">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Bulundu: {bulunanTasinmazSahibi}
                    </div>
                  ) : fisNoGiris.length >= 3 ? (
                    <div className="text-xs text-rose-400 mt-1.5 flex items-center gap-1 font-medium animate-fadeIn">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Eşleşen taşınmaz bulunamadı!
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 mt-1">Araya tire koyarak yazın (Örn: Ada-Parsel)</div>
                  )}
                </div>
              )}

              {/* Select Gorevli */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider">Sulama Sorumlusu (Görevli) *</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs"
                  value={gorevliId}
                  onChange={(e) => setGorevliId(e.target.value)}
                  required
                >
                  <option className="bg-slate-950 text-slate-400" value="">-- Görevli Seçin --</option>
                  {gorevliler.map((g) => (
                    <option key={g.id} className="bg-slate-950 text-slate-200" value={g.id}>
                      {g.ad_soyad} ({g.gorev || 'Görevli'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Grid Tarih / Süre */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider">Tarih</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    value={sulamaTarihi}
                    onChange={(e) => setSulamaTarihi(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider">Süre (Saat) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Örn: 2.5"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    value={sulamaSuresiSaat}
                    onChange={(e) => setSulamaSuresiSaat(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Calculations Area */}
              <div className="bg-indigo-950/20 border border-indigo-500/10 p-3 rounded-xl space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider">Toplam Ücret Tutar (₺) *</label>
                  <div className="relative">
                    <Coins className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      disabled={isCalculated}
                      className={`w-full pl-8 pr-3 py-2 rounded-xl text-sm font-bold ${
                        isCalculated ? 'bg-slate-900/80 border border-white/5 text-indigo-300' : 'glass-input'
                      }`}
                      value={ucret}
                      onChange={(e) => setUcret(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Status Switch */}
              <div className="flex items-center justify-between py-1 border-y border-slate-800 my-4">
                <span className="text-xs font-medium text-slate-300">Ödeme Durumu</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                      odemeDurumu === 'Ödendi' 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700'
                    }`}
                    onClick={() => setOdemeDurumu('Ödendi')}
                  >
                    Ödendi
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                      odemeDurumu === 'Ödenmedi' 
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                        : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700'
                    }`}
                    onClick={() => setOdemeDurumu('Ödenmedi')}
                  >
                    Ödenmedi
                  </button>
                </div>
              </div>

              {/* Input Aciklama */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider">Açıklama / Fiş Notu</label>
                <textarea
                  placeholder="Örn: Kesinti yapıldı..."
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs h-16 resize-none"
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200"
                >
                  <Save className="h-4 w-4" />
                  <span>Fişi Kaydet</span>
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
        /* EXCEL GRID EDITING MODE */
        <div className="glass-card rounded-2xl flex-1 overflow-hidden flex flex-col p-4">
          {/* Sticky Header */}
          <div className="overflow-x-auto shrink-0">
            <table className="w-full text-left border-collapse text-xs table-fixed min-w-[950px]">
              <thead>
                <tr className="border-b border-slate-800 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-1.5 w-[11%]">Tarih</th>
                  <th className="py-2.5 px-1.5 w-[25%]">Taşınmaz (Tapu Sahibi)</th>
                  <th className="py-2.5 px-1.5 w-[18%]">Görevli</th>
                  <th className="py-2.5 px-1.5 w-[9%] text-right">Süre (Saat)</th>
                  <th className="py-2.5 px-1.5 w-[10%] text-right">Ücret (₺)</th>
                  <th className="py-2.5 px-1.5 w-[10%] text-center">Ödeme Durumu</th>
                  <th className="py-2.5 px-1.5 w-[12%]">Açıklama</th>
                  <th className="py-2.5 px-1.5 w-[5%] text-right">İşlem</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Virtual Scroll Excel Body */}
          <div ref={excelListRef} className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
            {filteredSulamalar.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Kriterlere uygun sulama fişi bulunamadı.
              </div>
            ) : (
              <div style={{ height: `${excelVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative', minWidth: '950px' }}>
                <table className="w-full text-left border-collapse text-xs table-fixed min-w-[950px]">
                  <tbody>
                    {excelVirtualizer.getVirtualItems().map((virtualRow) => {
                      const s = filteredSulamalar[virtualRow.index]
                      return (
                        <tr
                          key={s.id}
                          data-index={virtualRow.index}
                          ref={excelVirtualizer.measureElement}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                            display: 'table-row',
                          }}
                          className="border-b border-slate-800/40 hover:bg-slate-800/5 text-slate-350"
                        >
                          {/* Tarih */}
                          <td className="p-1" style={{ width: '11%' }}>
                            <input
                              type="date"
                              className="bg-slate-950/20 hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-indigo-500 rounded px-1 py-1 w-full text-xs text-slate-300"
                              value={s.sulama_tarihi}
                              onChange={(e) => updateExcelRow(s.id, 'sulama_tarihi', e.target.value)}
                            />
                          </td>
                          {/* Taşınmaz */}
                          <td className="p-1" style={{ width: '25%' }}>
                            <select
                              className="bg-slate-950/20 hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-indigo-500 rounded px-1 py-1 w-full text-xs text-slate-300 font-bold"
                              value={s.tasinmaz_id}
                              onChange={(e) => updateExcelRow(s.id, 'tasinmaz_id', e.target.value)}
                            >
                              {tasinmazlar.map((t) => (
                                <option key={t.id} className="bg-slate-950 text-slate-200" value={t.id}>
                                  {t.tapu_sahibi} ({t.mahalle_koy || 'Mülk'})
                                </option>
                              ))}
                            </select>
                          </td>
                          {/* Görevli */}
                          <td className="p-1" style={{ width: '18%' }}>
                            <select
                              className="bg-slate-950/20 hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-indigo-500 rounded px-1 py-1 w-full text-xs text-slate-300"
                              value={s.gorevli_id}
                              onChange={(e) => updateExcelRow(s.id, 'gorevli_id', e.target.value)}
                            >
                              {gorevliler.map((g) => (
                                <option key={g.id} className="bg-slate-950 text-slate-200" value={g.id}>
                                  {g.ad_soyad}
                                </option>
                              ))}
                            </select>
                          </td>
                          {/* Süre */}
                          <td className="p-1" style={{ width: '9%' }}>
                            <input
                              type="number"
                              step="any"
                              className="bg-slate-950/20 hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-indigo-500 rounded px-1 py-1 w-full text-xs text-right text-indigo-300 font-semibold"
                              value={s.sulama_suresi_saat}
                              onChange={(e) => updateExcelRow(s.id, 'sulama_suresi_saat', e.target.value)}
                            />
                          </td>
                          {/* Ücret */}
                          <td className="p-1" style={{ width: '10%' }}>
                            <input
                              type="number"
                              step="any"
                              disabled={isCalculated}
                              className={`border border-transparent rounded px-1 py-1 w-full text-xs text-right font-bold ${
                                isCalculated ? 'bg-slate-950/40 text-slate-400' : 'bg-slate-950/20 hover:bg-slate-900 focus:bg-slate-900 focus:border-indigo-500 text-white'
                              }`}
                              value={s.ucret}
                              onChange={(e) => updateExcelRow(s.id, 'ucret', e.target.value)}
                            />
                          </td>
                          {/* Ödeme Durumu */}
                          <td className="p-1" style={{ width: '10%' }}>
                            <select
                              className={`border border-transparent rounded px-1 py-1 w-full text-xs text-center font-semibold cursor-pointer ${
                                s.odeme_durumu === 'Ödendi' 
                                  ? 'bg-emerald-500/10 text-emerald-400' 
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}
                              value={s.odeme_durumu}
                              onChange={(e) => updateExcelRow(s.id, 'odeme_durumu', e.target.value)}
                            >
                              <option className="bg-slate-950 text-emerald-400" value="Ödendi">Ödendi</option>
                              <option className="bg-slate-950 text-amber-400" value="Ödenmedi">Ödenmedi</option>
                            </select>
                          </td>
                          {/* Açıklama */}
                          <td className="p-1" style={{ width: '12%' }}>
                            <input
                              type="text"
                              placeholder="Açıklama girin..."
                              className="bg-slate-950/20 hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-indigo-500 rounded px-1 py-1 w-full text-xs text-slate-350"
                              value={s.aciklama || ''}
                              onChange={(e) => updateExcelRow(s.id, 'aciklama', e.target.value)}
                            />
                          </td>
                          {/* Delete Action */}
                          <td className="p-1 text-right" style={{ width: '5%' }}>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition cursor-pointer"
                              title="Satırı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* BOTTOM PLACEHOLDER ROW FOR QUICK ADDING SLIPS */}
          <div className="shrink-0 border-t-2 border-indigo-600/30 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs table-fixed min-w-[950px]">
              <tbody>
                <tr className="bg-indigo-950/5">
                  {/* Tarih */}
                  <td className="p-1.5" style={{ width: '11%' }}>
                    <input
                      type="date"
                      className="bg-slate-900 border border-indigo-500/25 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-slate-300"
                      value={newRow.sulama_tarihi}
                      onChange={(e) => setNewRow((prev) => ({ ...prev, sulama_tarihi: e.target.value }))}
                    />
                  </td>
                  {/* Taşınmaz */}
                  <td className="p-1.5" style={{ width: '25%' }}>
                    <select
                      className="bg-slate-900 border border-indigo-500/25 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-indigo-300 font-bold"
                      value={newRow.tasinmaz_id}
                      onChange={(e) => setNewRow((prev) => ({ ...prev, tasinmaz_id: e.target.value }))}
                    >
                      <option value="">-- Taşınmaz Seçin --</option>
                      {tasinmazlar.map((t) => (
                        <option key={t.id} className="bg-slate-950 text-slate-200" value={t.id}>
                          {t.tapu_sahibi} - {t.mahalle_koy} (Ada {t.ada || '-'} Parsel {t.parsel || '-'})
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* Görevli */}
                  <td className="p-1.5" style={{ width: '18%' }}>
                    <select
                      className="bg-slate-900 border border-indigo-500/25 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-slate-300"
                      value={newRow.gorevli_id}
                      onChange={(e) => setNewRow((prev) => ({ ...prev, gorevli_id: e.target.value }))}
                    >
                      {gorevliler.map((g) => (
                        <option key={g.id} className="bg-slate-950 text-slate-200" value={g.id}>
                          {g.ad_soyad}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* Süre */}
                  <td className="p-1.5" style={{ width: '9%' }}>
                    <input
                      type="number"
                      step="any"
                      placeholder="Saat"
                      className="bg-slate-900 border border-indigo-500/25 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-right text-indigo-300 font-semibold"
                      value={newRow.sulama_suresi_saat}
                      onChange={(e) => setNewRow((prev) => ({ ...prev, sulama_suresi_saat: e.target.value }))}
                    />
                  </td>
                  {/* Ücret */}
                  <td className="p-1.5" style={{ width: '10%' }}>
                    <input
                      type="number"
                      step="any"
                      placeholder="Tutar"
                      disabled={isCalculated}
                      className={`border rounded px-1.5 py-1 w-full text-xs text-right font-bold ${
                        isCalculated ? 'bg-slate-950/40 border-indigo-500/10 text-slate-400' : 'bg-slate-900 border-indigo-500/25 focus:border-indigo-500 text-white'
                      }`}
                      value={newRow.ucret}
                      onChange={(e) => setNewRow((prev) => ({ ...prev, ucret: e.target.value }))}
                    />
                  </td>
                  {/* Ödeme Durumu */}
                  <td className="p-1.5" style={{ width: '10%' }}>
                    <select
                      className="bg-slate-900 border border-indigo-500/25 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-center font-semibold text-slate-300"
                      value={newRow.odeme_durumu}
                      onChange={(e) => setNewRow((prev) => ({ ...prev, odeme_durumu: e.target.value }))}
                    >
                      <option className="bg-slate-950 text-emerald-400" value="Ödendi">Ödendi</option>
                      <option className="bg-slate-950 text-amber-400" value="Ödenmedi">Ödenmedi</option>
                    </select>
                  </td>
                  {/* Açıklama */}
                  <td className="p-1.5" style={{ width: '12%' }}>
                    <input
                      type="text"
                      placeholder="Açıklama..."
                      className="bg-slate-900 border border-indigo-500/25 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-slate-300"
                      value={newRow.aciklama}
                      onChange={(e) => setNewRow((prev) => ({ ...prev, aciklama: e.target.value }))}
                    />
                  </td>
                  {/* Save New Row Action */}
                  <td className="p-1.5 text-right" style={{ width: '5%' }}>
                    <button
                      onClick={handleAddExcelRow}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer"
                      title="Yeni Kayıt Ekle"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Record Count Footer */}
          <div className="shrink-0 pt-3 border-t border-slate-800/30 mt-2 text-[10px] text-slate-500 flex justify-between">
            <span>{filteredSulamalar.length} kayıt listeleniyor</span>
            <span>Toplam: {sulamalar.length} fiş</span>
          </div>
        </div>
      )}

      {/* Printable Receipt Overlay (Thermal receipt mockup) */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col justify-between border border-slate-200 no-print">
            
            {/* Ticket Content (This will be printed) */}
            <div id="receipt-print" className="font-mono text-xs text-slate-800 space-y-4">
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
                <h4 className="text-base font-bold uppercase tracking-wide text-slate-900">ARAZİ SULAMA FİŞİ</h4>
                <p className="text-[10px] text-slate-500">Kanal Suyu Takip Programı</p>
                <p className="text-[10px]">{new Date(showPrintModal.sulama_tarihi).toLocaleDateString('tr-TR')} - {new Date().toLocaleTimeString('tr-TR')}</p>
              </div>

              <div className="space-y-1.5 py-2">
                <div className="flex justify-between">
                  <span className="font-semibold">FİŞ NO:</span>
                  <span>#000{showPrintModal.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">TAPU SAHİBİ:</span>
                  <span className="text-right font-bold text-slate-950">{showPrintModal.tapu_sahibi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">ADA/PARSEL:</span>
                  <span>{showPrintModal.ada || '-'} / {showPrintModal.parsel || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">KÖY/MAHALLE:</span>
                  <span>{showPrintModal.mahalle_koy || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">KULLANILAN KANAL:</span>
                  <span>{showPrintModal.kanal_adi || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">SULAMA GÖREVLİSİ:</span>
                  <span>{showPrintModal.ad_soyad}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2.5 my-2 space-y-1">
                <div className="flex justify-between">
                  <span>SULAMA SÜRESİ:</span>
                  <span className="font-bold">{showPrintModal.sulama_suresi_saat} Saat</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold">TOPLAM TUTAR:</span>
                  <span className="font-extrabold text-slate-950">₺ {showPrintModal.ucret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>ÖDEME DURUMU:</span>
                  <span className={`font-bold uppercase ${showPrintModal.odeme_durumu === 'Ödendi' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {showPrintModal.odeme_durumu}
                  </span>
                </div>
              </div>

              {showPrintModal.aciklama && (
                <div className="text-[10px] text-slate-500 py-1 bg-slate-50 rounded px-2">
                  <span className="font-bold block text-slate-700">Not:</span>
                  {showPrintModal.aciklama}
                </div>
              )}

              <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-200">
                <p>İyi çalışmalar dileriz.</p>
                <p className="mt-0.5">Program veritabanından üretilmiştir.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-2 mt-6 border-t border-slate-100 pt-4">
              <button
                onClick={handlePrint}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition text-xs"
              >
                <Printer className="h-4 w-4" />
                <span>Yazdır</span>
              </button>
              <button
                onClick={() => setShowPrintModal(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl transition text-xs"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Pure CSS/HTML container specifically designed for paper layout printing */}
      {showPrintModal && (
        <div className="print-only hidden font-mono text-[10px] leading-relaxed text-black bg-white p-4 w-[80mm] space-y-4">
          <div className="text-center space-y-1 pb-2 border-b border-dashed border-black">
            <h4 className="text-sm font-bold uppercase text-black">ARAZİ SULAMA FİŞİ</h4>
            <p className="text-[8px] text-black/70">Kanal Suyu Takip Programı</p>
            <p className="text-[8px]">{new Date(showPrintModal.sulama_tarihi).toLocaleDateString('tr-TR')} - {new Date().toLocaleTimeString('tr-TR')}</p>
          </div>
          <div className="space-y-1 py-1">
            <div className="flex justify-between"><span>FİŞ NO:</span><span>#000{showPrintModal.id}</span></div>
            <div className="flex justify-between"><span>TAPU SAHİBİ:</span><span className="font-bold">{showPrintModal.tapu_sahibi}</span></div>
            <div className="flex justify-between"><span>ADA/PARSEL:</span><span>{showPrintModal.ada || '-'} / {showPrintModal.parsel || '-'}</span></div>
            <div className="flex justify-between"><span>KÖY/MAHALLE:</span><span>{showPrintModal.mahalle_koy || '-'}</span></div>
            <div className="flex justify-between"><span>SU KANALI:</span><span>{showPrintModal.kanal_adi || '-'}</span></div>
            <div className="flex justify-between"><span>GÖREVLİ:</span><span>{showPrintModal.ad_soyad}</span></div>
          </div>
          <div className="border-t border-b border-dashed border-black py-2 space-y-1">
            <div className="flex justify-between"><span>SULAMA SÜRESİ:</span><span className="font-bold">{showPrintModal.sulama_suresi_saat} Saat</span></div>
            <div className="flex justify-between"><span>TOPLAM TUTAR:</span><span className="font-bold">₺ {showPrintModal.ucret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span>DURUM:</span><span className="font-bold uppercase">{showPrintModal.odeme_durumu}</span></div>
          </div>
          {showPrintModal.aciklama && (
            <div className="text-[8px] border border-black/10 p-1">
              <strong>Not:</strong> {showPrintModal.aciklama}
            </div>
          )}
          <div className="text-center text-[8px] pt-2">
            <p>Bilgi amaçlıdır. Teşekkürler.</p>
          </div>
        </div>
      )}

    </div>
  )
}
