import React, { useState, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search, Edit2, Trash2, UserPlus, Save, X, Phone, Mail, AlertCircle } from 'lucide-react'

interface Gorevli {
  id: number
  ad_soyad: string
  gorev: string
  telefon: string
  eposta: string
  aktif: number // 1 or 0
}

export default function Gorevliler(): React.JSX.Element {
  const [gorevliler, setGorevliler] = useState<Gorevli[]>([])
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form State
  const [adSoyad, setAdSoyad] = useState('')
  const [gorev, setGorev] = useState('')
  const [telefon, setTelefon] = useState('')
  const [eposta, setEposta] = useState('')
  const [aktif, setAktif] = useState(1)

  const [error, setError] = useState('')

  const loadGorevliler = async (): Promise<void> => {
    try {
      const data = await window.api.dbQuery('SELECT * FROM gorevliler ORDER BY ad_soyad ASC')
      setGorevliler(data)
    } catch (e) {
      console.error('Error loading officers:', e)
    }
  }

  useEffect(() => {
    loadGorevliler()
  }, [])

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')

    if (!adSoyad.trim()) {
      setError('Ad Soyad alanı boş bırakılamaz.')
      return
    }

    try {
      if (editingId) {
        // Update
        await window.api.dbRun(
          'UPDATE gorevliler SET ad_soyad = ?, gorev = ?, telefon = ?, eposta = ?, aktif = ? WHERE id = ?',
          [adSoyad.trim(), gorev.trim(), telefon.trim(), eposta.trim(), aktif, editingId]
        )
      } else {
        // Insert
        await window.api.dbRun(
          'INSERT INTO gorevliler (ad_soyad, gorev, telefon, eposta, aktif) VALUES (?, ?, ?, ?, ?)',
          [adSoyad.trim(), gorev.trim(), telefon.trim(), eposta.trim(), aktif]
        )
      }

      // Reset form
      resetForm()
      await loadGorevliler()
    } catch (e: any) {
      console.error('Error saving officer:', e)
      setError('Kaydedilirken bir hata oluştu: ' + e.message)
    }
  }

  const handleEdit = (gorevli: Gorevli): void => {
    setEditingId(gorevli.id)
    setAdSoyad(gorevli.ad_soyad)
    setGorev(gorevli.gorev || '')
    setTelefon(gorevli.telefon || '')
    setEposta(gorevli.eposta || '')
    setAktif(gorevli.aktif)
    setError('')
  }

  const handleDelete = async (id: number, name: string): Promise<void> => {
    const confirm = window.confirm(
      `${name} isimli görevliyi silmek istediğinize emin misiniz?\nVarsa bu görevliye ait sulama kayıtları silinemeyebilir (referans kısıtlaması nedeniyle).`
    )
    if (!confirm) return

    try {
      await window.api.dbRun('DELETE FROM gorevliler WHERE id = ?', [id])
      await loadGorevliler()
      if (editingId === id) resetForm()
    } catch (e: any) {
      console.error('Error deleting officer:', e)
      alert(
        'Hata: Bu görevliyi silemezsiniz çünkü üzerinde kayıtlı sulama fişleri var. Öncelikle sulama fişlerini güncellemeli veya silmelisiniz.'
      )
    }
  }

  const resetForm = (): void => {
    setEditingId(null)
    setAdSoyad('')
    setGorev('')
    setTelefon('')
    setEposta('')
    setAktif(1)
    setError('')
  }

  const filteredGorevliler = gorevliler.filter((g) => {
    const term = search.toLowerCase()
    return (
      g.ad_soyad.toLowerCase().includes(term) ||
      (g.gorev || '').toLowerCase().includes(term) ||
      (g.telefon || '').includes(term)
    )
  })

  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: filteredGorevliler.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10
  })

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Görevliler</h1>
        <p className="text-slate-400 mt-1">
          Kanal suyu takibini yapan sucular, başkanlar ve saha sorumluları.
        </p>
      </div>

      {/* Main Content Split Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Side: List (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col space-y-4 min-h-0">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Görevli adı, unvan veya telefon ile ara..."
              className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* List Card Container */}
          <div className="glass-card rounded-2xl flex-1 p-4">
            <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Ad Soyad</th>
                    <th className="py-3 px-3">Görev / Unvan</th>
                    <th className="py-3 px-3">İletişim</th>
                    <th className="py-3 px-3 text-center">Durum</th>
                    <th className="py-3 px-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                    display: 'block'
                  }}
                >
                  {filteredGorevliler.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                        Arama kriterlerine uygun görevli bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const g = filteredGorevliler[virtualRow.index]
                      return (
                        <tr
                          key={g.id}
                          ref={rowVirtualizer.measureElement}
                          data-index={virtualRow.index}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                            display: 'table',
                            tableLayout: 'fixed'
                          }}
                          className={`border-b border-slate-800/50 hover:bg-slate-800/10 text-sm transition ${
                            editingId === g.id ? 'bg-indigo-500/5 border-indigo-500/30' : ''
                          }`}
                        >
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="font-semibold text-white block">{g.ad_soyad}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="text-indigo-300 font-medium text-xs bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full inline-block">
                              {g.gorev || 'Belirtilmemiş'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 space-y-0.5 text-xs text-slate-300">
                            {g.telefon && (
                              <div className="flex items-center space-x-1.5">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <span>{g.telefon}</span>
                              </div>
                            )}
                            {g.eposta && (
                              <div className="flex items-center space-x-1.5">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span>{g.eposta}</span>
                              </div>
                            )}
                            {!g.telefon && !g.eposta && <span className="text-slate-500">-</span>}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                g.aktif === 1
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {g.aktif === 1 ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(g)}
                                title="Düzenle"
                                className="p-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition"
                              >
                                <Edit2 className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(g.id, g.ad_soyad)}
                                title="Sil"
                                className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
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
              <UserPlus className="h-5 w-5 text-indigo-400" />
              {editingId ? 'Görevliyi Düzenle' : 'Yeni Görevli Ekle'}
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

            {/* Input Ad Soyad */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Ad Soyad *
              </label>
              <input
                type="text"
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full px-3 py-2.5 rounded-xl glass-input text-sm font-medium"
                value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)}
                required
              />
            </div>

            {/* Input Gorev */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Görev / Unvan
              </label>
              <input
                type="text"
                placeholder="Örn: Sucu, Sorumlu, Yönetici"
                className="w-full px-3 py-2.5 rounded-xl glass-input text-sm"
                value={gorev}
                onChange={(e) => setGorev(e.target.value)}
              />
            </div>

            {/* Input Telefon */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Telefon
              </label>
              <input
                type="text"
                placeholder="Örn: 0555 555 55 55"
                className="w-full px-3 py-2.5 rounded-xl glass-input text-sm"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
              />
            </div>

            {/* Input E-posta */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                E-posta
              </label>
              <input
                type="email"
                placeholder="Örn: ahmet@mail.com"
                className="w-full px-3 py-2.5 rounded-xl glass-input text-sm"
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between py-2 border-y border-slate-800/80 my-4">
              <span className="text-sm font-medium text-slate-300">Görevli Aktiflik Durumu</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                    aktif === 1
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700'
                  }`}
                  onClick={() => setAktif(1)}
                >
                  Aktif
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                    aktif === 0
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700'
                  }`}
                  onClick={() => setAktif(0)}
                >
                  Pasif
                </button>
              </div>
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
