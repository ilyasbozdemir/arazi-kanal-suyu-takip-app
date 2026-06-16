import React, { useState, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  Search,
  Edit2,
  Trash2,
  Clock,
  Coins,
  Save,
  X,
  Printer,
  AlertCircle,
  Grid,
  FormInput,
  Plus,
  User
} from 'lucide-react'

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

interface Sulama {
  id: number
  tasinmaz_id: number
  gorevli_id: number
  sulama_tarihi: string
  sulama_suresi_saat: number
  ucret: number
  odeme_durumu: string
  aciklama?: string
  // Joined fields
  tapu_sahibi: string
  ada: string
  parsel: string
  alan_m2: number
  mahalle_koy: string
  kanal_adi: string
  ad_soyad?: string
  gorev?: string
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

const renderReceiptContent = (s: Sulama, logo: string | null, name: string): React.JSX.Element => {
  return (
    <div className="space-y-4 font-sans text-xs text-black leading-relaxed bg-white p-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        {logo ? (
          <img src={logo} className="w-16 h-16 object-contain" alt="Logo" />
        ) : (
          <div className="w-16 h-16 border border-dashed border-slate-400 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-bold">LOGO</div>
        )}
        <div className="text-right flex-1 pl-4">
          <h1 className="text-xs font-extrabold tracking-wide uppercase text-black leading-tight">
            {name}
          </h1>
          <p className="text-[9px] text-slate-500 font-sans mt-0.5">Tarımsal Sulama Hizmetleri</p>
          <p className="text-[9px] text-slate-500 font-sans font-medium">
            Fiş Tarihi: {new Date(s.sulama_tarihi).toLocaleDateString('tr-TR')}
          </p>
        </div>
      </div>

      {/* Title */}
      <div className="text-center bg-slate-100 py-1.5 border border-slate-350 rounded">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-black">
          SULAMA HİZMET / TESLİM FİŞİ
        </span>
      </div>

      {/* Details Table */}
      <table className="w-full text-left border-collapse border border-black text-[10px] font-sans">
        <tbody>
          <tr className="border-b border-black">
            <td className="p-2 bg-slate-50 font-bold border-r border-black w-1/3">FİŞ NO:</td>
            <td className="p-2 font-mono font-bold text-black">#000{s.id}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 bg-slate-50 font-bold border-r border-black">TAPU SAHİBİ / MALİK:</td>
            <td className="p-2 font-bold text-black uppercase">{s.tapu_sahibi}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 bg-slate-50 font-bold border-r border-black">FİŞ NO - SERİ NO:</td>
            <td className="p-2 font-mono font-bold text-black">
              {s.ada || '-'} - {s.parsel || '-'}
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 bg-slate-50 font-bold border-r border-black">KÖY / MAHALLE:</td>
            <td className="p-2 text-black">{s.mahalle_koy || '-'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 bg-slate-50 font-bold border-r border-black">SU KANALI:</td>
            <td className="p-2 text-black">{s.kanal_adi || '-'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 bg-slate-50 font-bold border-r border-black">SULAMA GÖREVLİSİ (MERAV):</td>
            <td className="p-2 text-black">{s.ad_soyad}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 bg-slate-50 font-bold border-r border-black">SULAMA SÜRESİ:</td>
            <td className="p-2 text-black font-bold">{s.sulama_suresi_saat} Saat</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 bg-slate-50 font-bold border-r border-black">SAATLİK TARİFE:</td>
            <td className="p-2 text-black">
              ₺ {((s.ucret || 0) / (s.sulama_suresi_saat || 1)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} / Saat
            </td>
          </tr>
          <tr className="border-b border-black bg-slate-50">
            <td className="p-2 font-bold border-r border-black text-xs">TOPLAM TUTAR:</td>
            <td className="p-2 text-xs font-extrabold text-black">
              ₺ {s.ucret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </td>
          </tr>
          <tr>
            <td className="p-2 bg-slate-50 font-bold border-r border-black">ÖDEME DURUMU:</td>
            <td className={`p-2 font-extrabold uppercase ${s.odeme_durumu === 'Ödendi' ? 'text-emerald-700' : 'text-amber-700'}`}>
              {s.odeme_durumu}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Description */}
      {s.aciklama && (
        <div className="border border-slate-350 p-2 rounded bg-slate-50 text-[9px]">
          <strong className="block text-slate-800">Açıklama / Not:</strong>
          <p className="text-slate-700 mt-0.5">{s.aciklama}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-4 pt-6 text-center text-[10px]">
        <div>
          <span className="block font-bold text-slate-800">Teslim Eden</span>
          <span className="block h-10"></span>
          <span className="block border-t border-slate-400 w-24 mx-auto pt-1 text-slate-500 text-[8px]">İmza</span>
        </div>
        <div>
          <span className="block font-bold text-slate-800">Teslim Alan</span>
          <span className="block h-10"></span>
          <span className="block border-t border-slate-400 w-24 mx-auto pt-1 text-slate-500 text-[8px]">İmza</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[8px] text-slate-450 pt-4 border-t border-dashed border-slate-300 mt-4 font-mono">
        <p>Bu fiş otomasyon sistemi üzerinden üretilmiştir. Bilgi amaçlıdır.</p>
        <p className="mt-0.5">Baskı Tarihi: {new Date().toLocaleString('tr-TR')}</p>
      </div>
    </div>
  )
}

export default function Sulamalar({
  viewMode,
  onViewModeChange
}: SulamalarProps): React.JSX.Element {
  const [sulamalar, setSulamalar] = useState<Sulama[]>([])
  const [tasinmazlar, setTasinmazlar] = useState<Tasinmaz[]>([])
  const [gorevliler, setGorevliler] = useState<Gorevli[]>([])

  const [search, setSearch] = useState('')
  const [filterOdeme, setFilterOdeme] = useState('Hepsi')
  const [pageSizeLimit, setPageSizeLimit] = useState<number>(0) // 0 = Hepsi

  const [editingId, setEditingId] = useState<number | null>(null)
  const [showPrintModal, setShowPrintModal] = useState<Sulama | null>(null)
  const [showFormPanel, setShowFormPanel] = useState(false)

  // Institution settings for printing
  const [kurumAdi, setKurumAdi] = useState('Arazi Kanal Suyu Takip Programı')
  const [kurumLogo, setKurumLogo] = useState<string | null>(null)

  // Form State (Standard Mode)
  const [fisNoGiris, setFisNoGiris] = useState('')
  const [malikGiris, setMalikGiris] = useState('')
  const [hizliAramaText, setHizliAramaText] = useState('')

  const [gorevliId, setGorevliId] = useState('')
  const [sulamaTarihi, setSulamaTarihi] = useState(new Date().toISOString().split('T')[0])
  const [sulamaSuresiSaat, setSulamaSuresiSaat] = useState('')
  const [saatUcreti, setSaatUcreti] = useState('100')
  const [suUcretleriList, setSuUcretleriList] = useState<string[]>(['150', '200', '250'])
  const [ucret, setUcret] = useState('')
  const [odemeDurumu, setOdemeDurumu] = useState('Ödenmedi')
  const [aciklama, setAciklama] = useState('')

  // New Row State (Excel Mode)
  const [newRowTasinmazSearch, setNewRowTasinmazSearch] = useState('')
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



      // Load su_ucretleri from settings
      const ucretListRes = await window.api.dbQuery(
        "SELECT deger FROM ayarlar WHERE anahtar = 'su_ucretleri'"
      )
      if (ucretListRes && ucretListRes.length > 0) {
        try {
          setSuUcretleriList(JSON.parse(ucretListRes[0].deger))
        } catch {
          setSuUcretleriList(ucretListRes[0].deger.split(',').filter(Boolean))
        }
      }

      // Load varsayilan_saat_ucreti from settings
      const ucretRes = await window.api.dbQuery(
        "SELECT deger FROM ayarlar WHERE anahtar = 'varsayilan_saat_ucreti'"
      )
      if (ucretRes && ucretRes.length > 0) {
        setSaatUcreti(ucretRes[0].deger)
      } else {
        setSaatUcreti('150')
      }

      // Load active officers for dropdown
      const officers = await window.api.dbQuery(
        'SELECT * FROM gorevliler WHERE aktif = 1 ORDER BY ad_soyad ASC'
      )
      setGorevliler(officers)

      // Set default officer for new row state if not set
      if (officers.length > 0 && !newRow.gorevli_id) {
        setNewRow((prev) => ({ ...prev, gorevli_id: officers[0].id.toString() }))
      }

      // Load institution name for printing header
      const dbKurumAdi = await window.api.dbQuery(
        "SELECT deger FROM ayarlar WHERE anahtar = 'kurum_adi'"
      )
      if (dbKurumAdi && dbKurumAdi[0]?.deger) {
        setKurumAdi(dbKurumAdi[0].deger)
      } else {
        setKurumAdi('Arazi Kanal Suyu Takip Programı')
      }

      // Load institution logo for printing
      const dbKurumLogo = await window.api.dbQuery(
        "SELECT deger FROM ayarlar WHERE anahtar = 'kurum_logo'"
      )
      if (dbKurumLogo && dbKurumLogo[0]?.deger) {
        setKurumLogo(dbKurumLogo[0].deger)
      } else {
        setKurumLogo(null)
      }
    } catch (e) {
      console.error('Error loading data:', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-select first supervisor when gorevliler load if none is selected
  useEffect(() => {
    if (gorevliler.length > 0 && !gorevliId) {
      setGorevliId(gorevliler[0].id.toString())
    }
  }, [gorevliler, gorevliId])

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

    const malikName = malikGiris.trim()
    if (!malikName) {
      setError('Lütfen tapu sahibi / malik adını girin.')
      return
    }

    const fisNo = fisNoGiris.trim()
    if (!fisNo) {
      setError('Lütfen Ada-Parsel bilgisini girin.')
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

    const parts = fisNo
      .replace(/[\/\\]/g, '-')
      .replace(/\s+/g, '-')
      .split('-')
      .map((s) => s.trim())
    const ada = parts[0] || ''
    const parsel = parts[1] || ''

    try {
      let finalTasinmazId = 0

      // Find if there is a matching property in the database
      const existing = await window.api.dbQuery(
        'SELECT id FROM tasinmazlar WHERE LOWER(TRIM(tapu_sahibi)) = LOWER(TRIM(?)) AND ada = ? AND parsel = ?',
        [malikName, ada, parsel]
      )

      if (existing && existing.length > 0) {
        finalTasinmazId = existing[0].id
      } else {
        // Automatically insert new property record
        const insertRes = await window.api.dbRun(
          `INSERT INTO tasinmazlar (tapu_sahibi, ada, parsel, mahalle_koy, alan_m2, kanal_adi, aciklama) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [malikName, ada, parsel, '', 0, '', 'Sulamadan otomatik oluşturuldu']
        )
        finalTasinmazId = insertRes.lastInsertRowid
      }

      if (editingId) {
        // Update
        await window.api.dbRun(
          `UPDATE sulamalar 
           SET tasinmaz_id = ?, gorevli_id = ?, sulama_tarihi = ?, sulama_suresi_saat = ?, ucret = ?, odeme_durumu = ?, aciklama = ? 
           WHERE id = ?`,
          [
            finalTasinmazId,
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
            finalTasinmazId,
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
      // Reset bottom row state
      setNewRowTasinmazSearch('')
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
      console.error('Error quick inserting excel row:', e)
      alert('Kaydedilirken hata oluştu.')
    }
  }

  const handleNewRowTasinmazChange = (val: string) => {
    setNewRowTasinmazSearch(val)
    const match = val.match(/\[ID:(\d+)\]$/)
    if (match) {
      setNewRow((prev) => ({ ...prev, tasinmaz_id: match[1] }))
    } else {
      setNewRow((prev) => ({ ...prev, tasinmaz_id: '' }))
    }
  }

  const handleEdit = (s: Sulama): void => {
    onViewModeChange('standard') // Switch to standard view to edit in form
    setEditingId(s.id)
    setShowFormPanel(true)

    // Auto-fill fisNoGiris and malikGiris
    const t = tasinmazlar.find((x) => x.id === s.tasinmaz_id)
    if (t) {
      if (t.ada && t.parsel) {
        setFisNoGiris(`${t.ada}-${t.parsel}`)
      } else {
        setFisNoGiris('')
      }
      setMalikGiris(t.tapu_sahibi)
    } else {
      setFisNoGiris('')
      setMalikGiris('')
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
    setFisNoGiris('')
    setMalikGiris('')
    // We intentionally PRESERVE gorevliId and sulamaTarihi to allow rapid consecutive entries of slips for the same supervisor and date.
    setSulamaSuresiSaat('')
    setUcret('')
    setOdemeDurumu('Ödenmedi')
    setAciklama('')
    setIsCalculated(true)
    setError('')
    setShowFormPanel(false)
  }

  const handlePrint = (): void => {
    window.print()
  }

  const handleFisNoChange = (val: string) => {
    setFisNoGiris(val)
  }

  // Search and Filter Slips
  const filteredSulamalar = sulamalar.filter((s) => {
    const term = turkishToLower(search)
    const matchesSearch =
      turkishToLower(s.tapu_sahibi).includes(term) ||
      turkishToLower(s.ad_soyad || '').includes(term) ||
      turkishToLower(s.kanal_adi || '').includes(term) ||
      turkishToLower(s.mahalle_koy || '').includes(term)

    const matchesOdeme = filterOdeme === 'Hepsi' || s.odeme_durumu === filterOdeme

    return matchesSearch && matchesOdeme
  })

  // Apply page size limit
  const paginatedSulamalar =
    pageSizeLimit > 0 ? filteredSulamalar.slice(0, pageSizeLimit) : filteredSulamalar

  // Virtual scrollers
  const standardVirtualizer = useVirtualizer({
    count: paginatedSulamalar.length,
    getScrollElement: () => standardListRef.current,
    estimateSize: () => 64,
    overscan: 10
  })

  const excelVirtualizer = useVirtualizer({
    count: paginatedSulamalar.length,
    getScrollElement: () => excelListRef.current,
    estimateSize: () => 38,
    overscan: 10
  })

  const matchedSlips = malikGiris.trim()
    ? sulamalar.filter(
        (s) =>
          turkishToLower(s.tapu_sahibi.trim()) === turkishToLower(malikGiris.trim())
      )
    : []
  const unpaidSlips = matchedSlips.filter((s) => s.odeme_durumu === 'Ödenmedi')
  const totalUnpaidAmount = unpaidSlips.reduce((sum, s) => sum + s.ucret, 0)

  return (
    <div className="space-y-6 h-full flex flex-col no-print">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Fiş Girişi</h1>
          <p className="text-slate-400 mt-1">
            Yapılan arazi sulamalarını kaydedin, ücret hesaplayın ve makbuz yazdırın.
          </p>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {viewMode === 'standard' && (
            <button
              onClick={() => setShowFormPanel((prev) => !prev)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                showFormPanel
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-600/15'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showFormPanel ? 'Formu Kapat' : 'Yeni Fiş Ekle'}</span>
            </button>
          )}
          <div className="flex space-x-2 bg-slate-900/50 p-1 border border-white/5 rounded-2xl">
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
            <option className="bg-slate-950 text-slate-200" value="Hepsi">
              Hepsi
            </option>
            <option className="bg-slate-950 text-slate-200" value="Ödendi">
              Ödendi
            </option>
            <option className="bg-slate-950 text-slate-200" value="Ödenmedi">
              Ödenmedi
            </option>
          </select>
        </div>

        <div className="flex items-center space-x-3 bg-slate-900/40 border border-white/5 rounded-xl px-2.5 justify-between">
          <div className="flex items-center space-x-2 w-full">
            <select
              title="Saatlik Sulama Tarifesi"
              className="bg-transparent border-none text-indigo-300 outline-none text-right font-bold w-20 cursor-pointer text-xs"
              value={saatUcreti}
              onChange={(e) => setSaatUcreti(e.target.value)}
            >
              {suUcretleriList.map((rate) => (
                <option key={rate} className="bg-slate-950 text-slate-200 text-xs" value={rate}>
                  ₺{rate}
                </option>
              ))}
            </select>
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
          <div className={`${showFormPanel ? 'lg:col-span-2' : 'lg:col-span-3'} flex flex-col min-h-0`}>
            <div className="glass-card rounded-2xl flex-1 flex flex-col overflow-hidden p-4">
              {/* Header and Page Limit Control */}
              <div className="flex justify-between items-center mb-3 text-xs shrink-0">
                <span className="text-slate-400 font-medium">
                  {filteredSulamalar.length} kayıt bulundu
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
              <div className="grid grid-cols-12 gap-2 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider py-3 px-2 shrink-0">
                <div className="col-span-2">Tarih</div>
                <div className="col-span-3">Taşınmaz (Sahibi)</div>
                <div className="col-span-2">Görevli</div>
                <div className="col-span-1 text-right">Süre (Sa)</div>
                <div className="col-span-1 text-right">Ücret</div>
                <div className="col-span-2 text-center">Durum</div>
                <div className="col-span-1 text-right">İşlemler</div>
              </div>

              {/* Virtual Scroll Area */}
              <div
                ref={standardListRef}
                className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
              >
                {paginatedSulamalar.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    Kriterlere uygun sulama fişi bulunamadı.
                  </div>
                ) : (
                  <div
                    style={{
                      height: `${standardVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative'
                    }}
                  >
                    {standardVirtualizer.getVirtualItems().map((virtualRow) => {
                      const s = paginatedSulamalar[virtualRow.index]
                      return (
                        <div
                          key={s.id}
                          data-index={virtualRow.index}
                          ref={standardVirtualizer.measureElement}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`
                          }}
                          className={`grid grid-cols-12 gap-2 items-center border-b border-slate-800/50 hover:bg-slate-800/10 text-sm text-slate-350 transition py-3 px-2 ${
                            editingId === s.id ? 'bg-indigo-500/5 border-indigo-500/30' : ''
                          }`}
                        >
                          <div className="col-span-2 whitespace-nowrap truncate pr-1 text-xs">
                            {new Date(s.sulama_tarihi).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="col-span-3 truncate pr-2">
                            <span className="font-semibold text-white block truncate" title={s.tapu_sahibi}>
                              {s.tapu_sahibi.replace(/\n/g, ', ')}
                              {(s.tapu_sahibi.includes(',') || s.tapu_sahibi.includes('\n')) && (
                                <span className="ml-1.5 text-[9px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider align-middle">Hisseli</span>
                              )}
                            </span>
                            <span className="text-xs text-slate-450 block truncate">
                              {s.mahalle_koy} | {s.ada}-{s.parsel}
                            </span>
                          </div>
                          <div
                            className="col-span-2 truncate text-slate-300 pr-1 text-xs"
                            title={s.ad_soyad}
                          >
                            {s.ad_soyad}
                          </div>
                          <div className="col-span-1 text-right text-indigo-300 whitespace-nowrap font-medium text-xs">
                            {s.sulama_suresi_saat} sa
                          </div>
                          <div
                            className="col-span-1 text-right font-medium text-white truncate text-xs"
                            title={`₺ ${s.ucret}`}
                          >
                            ₺{s.ucret.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                          </div>
                          <div className="col-span-2 text-center">
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                s.odeme_durumu === 'Ödendi'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {s.odeme_durumu}
                            </span>
                          </div>
                          <div className="col-span-1 flex justify-end space-x-1">
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
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Record Count Footer */}
              <div className="shrink-0 pt-3 border-t border-slate-800/30 mt-2 text-[10px] text-slate-500 flex justify-between">
                <span>
                  {paginatedSulamalar.length} / {filteredSulamalar.length} kayıt listeleniyor
                </span>
                <span>Toplam: {sulamalar.length} fiş</span>
              </div>
            </div>
          </div>

          {/* Standard Form Panel */}
          {showFormPanel && (
            <div className="glass-card p-6 rounded-2xl h-fit border border-indigo-500/10 animate-in slide-in-from-right duration-250">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-400" />
                {editingId ? 'Fişi Düzenle' : 'Yeni Fiş Girişi'}
              </h3>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-slate-405 hover:text-slate-200"
                  title="İptal Et"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    resetForm()
                    setShowFormPanel(false)
                  }}
                  className="p-1 hover:bg-slate-800 text-slate-450 hover:text-slate-200 rounded transition cursor-pointer"
                  title="Formu Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Hızlı Malik / Fiş Arama */}
              <div className="space-y-1 pb-3 border-b border-slate-800/60">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Kayıtlı Malik Arama (Hızlı Doldur)
                </label>
                <input
                  type="text"
                  list="form-tasinmazlar-list"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-indigo-500/20 text-xs text-indigo-300 placeholder-indigo-500/60"
                  placeholder="Kişi adı veya Fiş No yazın..."
                  value={hizliAramaText}
                  onChange={(e) => {
                    const val = e.target.value
                    setHizliAramaText(val)
                    const match = val.match(/\[ID:(\d+)\]$/)
                    if (match) {
                      const selectedId = parseInt(match[1])
                      const found = tasinmazlar.find((t) => t.id === selectedId)
                      if (found) {
                        setMalikGiris(found.tapu_sahibi)
                        if (found.ada || found.parsel) {
                          setFisNoGiris(`${found.ada || ''}-${found.parsel || ''}`)
                        } else {
                          setFisNoGiris('')
                        }
                        setHizliAramaText('')
                      }
                    }
                  }}
                />
                <datalist id="form-tasinmazlar-list">
                  {tasinmazlar.map((t) => (
                    <option
                      key={t.id}
                      value={`${t.tapu_sahibi} - ${t.mahalle_koy || 'Mülk'} (Fiş No: ${t.ada || '-'}, Seri: ${t.parsel || '-'}) [ID:${t.id}]`}
                    />
                  ))}
                </datalist>
              </div>

              {/* Top/Batch Settings: Supervisor & Date */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800/60 bg-indigo-950/15 p-3.5 rounded-xl">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                    Sulama Sorumlusu (Merav) *
                  </label>
                  <select
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-indigo-500/30 text-xs font-bold text-slate-200 outline-none focus:border-indigo-400 transition"
                    value={gorevliId}
                    onChange={(e) => setGorevliId(e.target.value)}
                    required
                  >
                    <option className="bg-slate-950 text-slate-400 text-xs" value="">
                      -- Görevli Seçin --
                    </option>
                    {gorevliler.map((g) => (
                      <option key={g.id} className="bg-slate-950 text-slate-200 text-xs" value={g.id}>
                        {g.ad_soyad}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                    Tarih *
                  </label>
                  <input
                    type="date"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-indigo-500/30 text-xs font-bold text-slate-200 outline-none focus:border-indigo-400 transition"
                    value={sulamaTarihi}
                    onChange={(e) => setSulamaTarihi(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Fiş No - Seri No Giriş */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-indigo-400" />
                  Fiş No - Seri No *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-mono font-bold tracking-wider"
                    placeholder="Örn: 450-4"
                    value={fisNoGiris}
                    onChange={(e) => handleFisNoChange(e.target.value)}
                    required
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Fiş numarasını ve serisini aralarında tire '-' olacak şekilde yazın.
                </div>
              </div>

              {/* Malik / Tapu Sahibi */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Tapu Sahibi / Malik *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-bold"
                  placeholder="Örn: Ahmet Yılmaz"
                  value={malikGiris}
                  onChange={(e) => setMalikGiris(e.target.value)}
                  required
                />
              </div>

              {/* Debt & History Compact Summary */}
              {malikGiris.trim() && matchedSlips.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-2.5 animate-fadeIn">
                  {/* Debt Warning */}
                  {totalUnpaidAmount > 0 ? (
                    <div className="px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[10px] flex items-center justify-between font-semibold">
                      <span>⚠ Ödenmemiş Borç:</span>
                      <span>₺{totalUnpaidAmount.toLocaleString('tr-TR')} ({unpaidSlips.length} Fiş)</span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-semibold">
                      ✓ Borcu Bulunmuyor
                    </div>
                  )}

                  {/* Recent Slips List */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Kişinin Fiş Geçmişi ({matchedSlips.length} kayıt)</span>
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                      {matchedSlips.map((slip) => (
                        <div key={slip.id} className="flex flex-col gap-0.5 text-[10px] bg-slate-950/40 p-1.5 rounded-lg border border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-medium">
                              {new Date(slip.sulama_tarihi).toLocaleDateString('tr-TR')} | {slip.ada || '-'}-{slip.parsel || '-'} ({slip.sulama_suresi_saat} sa)
                            </span>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-slate-200">₺{slip.ucret}</span>
                              <span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase ${
                                slip.odeme_durumu === 'Ödendi' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {slip.odeme_durumu}
                              </span>
                            </div>
                          </div>
                          {slip.aciklama && (
                            <div className="text-[9px] text-indigo-300/80 border-t border-slate-900/60 pt-0.5 mt-0.5 truncate" title={slip.aciklama}>
                              Not: {slip.aciklama}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Süre (Saat) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Süre (Saat) *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="Örn: 2.5"
                  className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-bold"
                  value={sulamaSuresiSaat}
                  onChange={(e) => setSulamaSuresiSaat(e.target.value)}
                  required
                />
              </div>

              {/* Calculations Area */}
              <div className="bg-indigo-950/20 border border-indigo-500/10 p-3 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                      Saatlik Ücret (₺)
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs font-semibold text-slate-200 cursor-pointer"
                      value={saatUcreti}
                      onChange={(e) => setSaatUcreti(e.target.value)}
                    >
                      {suUcretleriList.map((rate) => (
                        <option key={rate} className="bg-slate-950 text-slate-200" value={rate}>
                          ₺{rate}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                      Toplam Ücret (₺) *
                    </label>
                    <div className="relative">
                      <Coins className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        disabled={isCalculated}
                        className={`w-full pl-8 pr-2 py-2 rounded-xl text-xs font-bold ${
                          isCalculated
                            ? 'bg-slate-900/80 border border-white/5 text-indigo-300'
                            : 'glass-input'
                        }`}
                        value={ucret}
                        onChange={(e) => setUcret(e.target.value)}
                        required
                      />
                    </div>
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
                <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider">
                  Açıklama / Fiş Notu
                </label>
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
          )}
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
              <div
                style={{
                  height: `${excelVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                  minWidth: '950px'
                }}
              >
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
                            display: 'table-row'
                          }}
                          className="border-b border-slate-800/40 hover:bg-slate-800/5 text-slate-350"
                        >
                          {/* Tarih */}
                          <td className="p-1" style={{ width: '11%' }}>
                            <input
                              type="date"
                              className="bg-slate-950/20 hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-indigo-500 rounded px-1 py-1 w-full text-xs text-slate-300"
                              value={s.sulama_tarihi}
                              onChange={(e) =>
                                updateExcelRow(s.id, 'sulama_tarihi', e.target.value)
                              }
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
                                <option
                                  key={t.id}
                                  className="bg-slate-950 text-slate-200"
                                  value={t.id}
                                >
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
                                <option
                                  key={g.id}
                                  className="bg-slate-950 text-slate-200"
                                  value={g.id}
                                >
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
                              onChange={(e) =>
                                updateExcelRow(s.id, 'sulama_suresi_saat', e.target.value)
                              }
                            />
                          </td>
                          {/* Ücret */}
                          <td className="p-1" style={{ width: '10%' }}>
                            <input
                              type="number"
                              step="any"
                              disabled={isCalculated}
                              className={`border border-transparent rounded px-1 py-1 w-full text-xs text-right font-bold ${
                                isCalculated
                                  ? 'bg-slate-950/40 text-slate-400'
                                  : 'bg-slate-950/20 hover:bg-slate-900 focus:bg-slate-900 focus:border-indigo-500 text-white'
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
                              <option className="bg-slate-950 text-emerald-400" value="Ödendi">
                                Ödendi
                              </option>
                              <option className="bg-slate-950 text-amber-400" value="Ödenmedi">
                                Ödenmedi
                              </option>
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
                      onChange={(e) =>
                        setNewRow((prev) => ({ ...prev, sulama_tarihi: e.target.value }))
                      }
                    />
                  </td>
                  {/* Taşınmaz */}
                  <td className="p-1.5" style={{ width: '25%' }}>
                    <input
                      list="tasinmazlar-list"
                      placeholder="Mülk/Kişi Ara..."
                      className={`bg-slate-900 border ${newRow.tasinmaz_id ? 'border-emerald-500/50' : 'border-indigo-500/25'} focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-indigo-300 font-bold`}
                      value={newRowTasinmazSearch}
                      onChange={(e) => handleNewRowTasinmazChange(e.target.value)}
                    />
                    <datalist id="tasinmazlar-list">
                      {tasinmazlar.map((t) => (
                        <option
                          key={t.id}
                          value={`${t.tapu_sahibi} - ${t.mahalle_koy || 'Mülk'} (Ada: ${t.ada || '-'}, Parsel: ${t.parsel || '-'}) [ID:${t.id}]`}
                        />
                      ))}
                    </datalist>
                  </td>
                  {/* Görevli */}
                  <td className="p-1.5" style={{ width: '18%' }}>
                    <select
                      className="bg-slate-900 border border-indigo-500/25 focus:border-indigo-500 rounded px-1.5 py-1 w-full text-xs text-slate-300"
                      value={newRow.gorevli_id}
                      onChange={(e) =>
                        setNewRow((prev) => ({ ...prev, gorevli_id: e.target.value }))
                      }
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
                      onChange={(e) =>
                        setNewRow((prev) => ({ ...prev, sulama_suresi_saat: e.target.value }))
                      }
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
                        isCalculated
                          ? 'bg-slate-950/40 border-indigo-500/10 text-slate-400'
                          : 'bg-slate-900 border-indigo-500/25 focus:border-indigo-500 text-white'
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
                      onChange={(e) =>
                        setNewRow((prev) => ({ ...prev, odeme_durumu: e.target.value }))
                      }
                    >
                      <option className="bg-slate-950 text-emerald-400" value="Ödendi">
                        Ödendi
                      </option>
                      <option className="bg-slate-950 text-amber-400" value="Ödenmedi">
                        Ödenmedi
                      </option>
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

      {/* Printable Receipt Overlay (A5 Page mockup preview) */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 w-full max-w-xl rounded-2xl shadow-2xl p-6 flex flex-col justify-between border border-slate-200 no-print my-8 animate-fadeIn">
            {/* Custom local print media configurations */}
            <style>{`
              @media print {
                @page {
                  size: A5 portrait;
                  margin: 8mm;
                }
                body {
                  background: white !important;
                  color: black !important;
                }
                .no-print {
                  display: none !important;
                }
                .print-only {
                  display: block !important;
                  width: 100% !important;
                  max-width: 132mm !important;
                  margin: 0 auto !important;
                  padding: 0 !important;
                  color: black !important;
                  background: white !important;
                }
              }
            `}</style>

            {/* Ticket Content Screen Preview */}
            <div className="border border-slate-200 p-6 rounded-xl bg-slate-50/50">
              {renderReceiptContent(showPrintModal, kurumLogo, kurumAdi)}
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-2.5 mt-5 border-t border-slate-100 pt-4 bg-white">
              <button
                onClick={handlePrint}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition text-xs cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                <Printer className="h-4 w-4" />
                <span>Yazdır (A5 / Yarım A4)</span>
              </button>
              <button
                onClick={() => setShowPrintModal(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-5 rounded-xl transition text-xs cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pure CSS/HTML container specifically designed for paper layout printing (A5 Portrait) */}
      {showPrintModal && (
        <div className="print-only hidden w-full bg-white text-black">
          {renderReceiptContent(showPrintModal, kurumLogo, kurumAdi)}
        </div>
      )}
    </div>
  )
}
