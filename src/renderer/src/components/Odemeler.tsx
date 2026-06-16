import React, { useState, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search, Printer, Coins, X, AlertCircle, FileText, CheckCircle2, User } from 'lucide-react'

interface OwnerSummary {
  tapu_sahibi: string
  unpaid_count: number
  total_debt: number
}

interface OwnerSlip {
  id: number
  sulama_tarihi: string
  sulama_suresi_saat: number
  ucret: number
  odeme_durumu: string
  aciklama: string
  mahalle_koy: string
  ada: string
  parsel: string
  kanal_adi: string
  ad_soyad: string // Görevli adı
}

export default function Odemeler(): React.JSX.Element {
  const parentRef = useRef<HTMLDivElement>(null)
  const [owners, setOwners] = useState<OwnerSummary[]>([])
  const [search, setSearch] = useState('')
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null)
  const [ownerSlips, setOwnerSlips] = useState<OwnerSlip[]>([])
  const [showPrintNotice, setShowPrintNotice] = useState<{ owner: string; slips: OwnerSlip[] } | null>(null)
  const [kurumAdi, setKurumAdi] = useState('Arazi Kanal Suyu Takip Programı')

  const loadData = async (): Promise<void> => {
    try {
      // 1. Fetch debt summary per owner
      const summary = await window.api.dbQuery(`
        SELECT t.tapu_sahibi,
               COUNT(CASE WHEN s.odeme_durumu = 'Ödenmedi' THEN s.id END) as unpaid_count,
               COALESCE(SUM(CASE WHEN s.odeme_durumu = 'Ödenmedi' THEN s.ucret END), 0) as total_debt
        FROM tasinmazlar t
        LEFT JOIN sulamalar s ON s.tasinmaz_id = t.id
        GROUP BY t.tapu_sahibi
        ORDER BY total_debt DESC, t.tapu_sahibi ASC
      `)
      setOwners(summary)

      // Load institution name for printing header
      const dbSettings = await window.api.dbQuery("SELECT deger FROM ayarlar WHERE anahtar = 'kurum_adi'")
      if (dbSettings && dbSettings[0]?.deger) {
        setKurumAdi(dbSettings[0].deger)
      } else {
        setKurumAdi('Arazi Kanal Suyu Takip Programı')
      }

      // Refresh slips list if an owner is currently open in modal
      if (selectedOwner) {
        await loadOwnerSlips(selectedOwner)
      }
    } catch (e) {
      console.error('Error loading payments summary:', e)
    }
  }

  const loadOwnerSlips = async (owner: string): Promise<void> => {
    try {
      const slips = await window.api.dbQuery(`
        SELECT s.id, s.sulama_tarihi, s.sulama_suresi_saat, s.ucret, s.odeme_durumu, s.aciklama,
               t.mahalle_koy, t.ada, t.parsel, t.kanal_adi,
               g.ad_soyad
        FROM sulamalar s
        JOIN tasinmazlar t ON s.tasinmaz_id = t.id
        JOIN gorevliler g ON s.gorevli_id = g.id
        WHERE t.tapu_sahibi = ?
        ORDER BY s.sulama_tarihi DESC, s.id DESC
      `, [owner])
      setOwnerSlips(slips)
    } catch (e) {
      console.error('Error loading slips for owner:', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenDetails = async (owner: string): Promise<void> => {
    setSelectedOwner(owner)
    await loadOwnerSlips(owner)
  }

  const handleMarkAsPaid = async (slipId: number): Promise<void> => {
    try {
      await window.api.dbRun("UPDATE sulamalar SET odeme_durumu = 'Ödendi' WHERE id = ?", [slipId])
      await loadData()
    } catch (e: any) {
      alert('Ödeme kaydedilirken hata oluştu: ' + e.message)
    }
  }

  const handlePayAll = async (owner: string): Promise<void> => {
    const confirmPay = window.confirm(`${owner} isimli kişinin TÜM borçlarını ödendi olarak işaretlemek istediğinize emin misiniz?`)
    if (!confirmPay) return

    try {
      await window.api.dbRun(`
        UPDATE sulamalar 
        SET odeme_durumu = 'Ödendi' 
        WHERE id IN (
          SELECT s.id FROM sulamalar s
          JOIN tasinmazlar t ON s.tasinmaz_id = t.id
          WHERE t.tapu_sahibi = ? AND s.odeme_durumu = 'Ödenmedi'
        )
      `, [owner])
      await loadData()
    } catch (e: any) {
      alert('Toplu ödeme alınırken hata oluştu: ' + e.message)
    }
  }

  const handlePrint = (): void => {
    window.print()
  }

  // Filter owners list
  const filteredOwners = owners.filter((o) =>
    o.tapu_sahibi.toLowerCase().includes(search.toLowerCase())
  )

  const rowVirtualizer = useVirtualizer({
    count: filteredOwners.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  })

  const unpaidSlips = ownerSlips.filter((s) => s.odeme_durumu === 'Ödenmedi')
  const totalUnpaidAmount = unpaidSlips.reduce((acc, curr) => acc + curr.ucret, 0)

  return (
    <div className="space-y-6 h-full flex flex-col no-print">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Ödeme Takibi & Bildirimler</h1>
        <p className="text-slate-400 mt-1">
          Kişilerin birikmiş sulama borçlarını inceleyin, ödeme alın ve yazdırılabilir ödeme bildirim formları hazırlayın.
        </p>
      </div>

      {/* Filter and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/20 border border-white/5 p-4 rounded-2xl text-xs">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Kişi adına göre ara..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="bg-indigo-950/20 border border-indigo-500/10 p-3 rounded-xl flex items-center justify-between text-indigo-300 font-semibold">
          <span>Toplam Gecikmiş Borç:</span>
          <span className="text-sm font-bold text-white">
            ₺ {owners.reduce((acc, curr) => acc + curr.total_debt, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Owners List Table */}
      <div className="glass-card rounded-2xl flex-1 overflow-hidden p-4 min-h-0 flex flex-col">
        <div className="overflow-x-auto flex flex-col min-h-0 flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-900">
              <tr className="border-b border-slate-800 font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Kişi (Tapu Sahibi)</th>
                <th className="py-3 px-4 text-center">Ödenmemiş Fiş Sayısı</th>
                <th className="py-3 px-4 text-right">Toplam Borç Tutarı</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
          </table>
          {filteredOwners.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Kriterlere uygun kişi bulunamadı.
            </div>
          ) : (
            <div
              ref={parentRef}
              className="overflow-y-auto flex-1 min-h-0"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                <table className="w-full text-left border-collapse text-xs">
                  <tbody>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const o = filteredOwners[virtualRow.index]
                      return (
                        <tr
                          key={virtualRow.index}
                          className="border-b border-slate-800/40 hover:bg-slate-800/10 text-sm text-slate-300 transition"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                            display: 'flex',
                          }}
                        >
                          <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2" style={{ flex: 1 }}>
                            <User className="w-4 h-4 text-indigo-400" />
                            {o.tapu_sahibi}
                          </td>
                          <td className="py-3.5 px-4 text-center flex items-center justify-center" style={{ flex: 1 }}>
                            {o.unpaid_count > 0 ? (
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                {o.unpaid_count} Adet Gecikmiş
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Borç Yok
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-white flex items-center justify-end" style={{ flex: 1 }}>
                            {o.total_debt > 0 ? (
                              <span className="text-amber-400">
                                ₺ {o.total_debt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-normal">₺ 0.00</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right flex items-center justify-end" style={{ flex: 1 }}>
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleOpenDetails(o.tapu_sahibi)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-205 rounded-lg text-xs font-semibold transition cursor-pointer"
                              >
                                Detayları Gör
                              </button>
                              {o.total_debt > 0 && (
                                <button
                                  onClick={() => {
                                    // Filter unpaid slips and show print modal
                                    window.api.dbQuery(`
                                      SELECT s.id, s.sulama_tarihi, s.sulama_suresi_saat, s.ucret, s.odeme_durumu, s.aciklama,
                                             t.mahalle_koy, t.ada, t.parsel, t.kanal_adi,
                                             g.ad_soyad
                                      FROM sulamalar s
                                      JOIN tasinmazlar t ON s.tasinmaz_id = t.id
                                      JOIN gorevliler g ON s.gorevli_id = g.id
                                      WHERE t.tapu_sahibi = ? AND s.odeme_durumu = 'Ödenmedi'
                                      ORDER BY s.sulama_tarihi DESC, s.id DESC
                                    `, [o.tapu_sahibi]).then(unpaidList => {
                                      setShowPrintNotice({ owner: o.tapu_sahibi, slips: unpaidList })
                                    })
                                  }}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Ödeme Bildirimi</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DETAILED LEDGER / SLIPS MODAL */}
      {selectedOwner && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-indigo-600/10 text-indigo-400 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedOwner} - Borç ve Fiş Detayları</h3>
                  <p className="text-xs text-slate-450 mt-0.5">Kişinin bugüne kadar aldığı tüm sulamaların listesi.</p>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedOwner(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* Debt Warning Banner */}
              {totalUnpaidAmount > 0 ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Toplam Gecikmiş Borç Bulunuyor</h4>
                      <p className="text-xs text-slate-450 mt-0.5">
                        Kişiye ait {unpaidSlips.length} ödenmemiş fiş kaydı var. Toplam borç: <strong className="text-amber-400">₺ {totalUnpaidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePayAll(selectedOwner)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer self-start sm:self-center shrink-0"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Tüm Borçları Kapat</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Borç Bulunmamaktadır</h4>
                    <p className="text-xs text-slate-450">Bu kişiye ait tüm sulama fişleri ödenmiştir.</p>
                  </div>
                </div>
              )}

              {/* Slips table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/30 border-b border-slate-800 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Tarih</th>
                      <th className="py-2.5 px-3">Mülk Konumu</th>
                      <th className="py-2.5 px-3">Görevli</th>
                      <th className="py-2.5 px-3 text-right">Süre (Saat)</th>
                      <th className="py-2.5 px-3 text-right">Ücret (₺)</th>
                      <th className="py-2.5 px-3 text-center">Durum</th>
                      <th className="py-2.5 px-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerSlips.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-500">
                          Bu kişiye ait sulama kaydı bulunmuyor.
                        </td>
                      </tr>
                    ) : (
                      ownerSlips.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b border-slate-800/40 hover:bg-slate-800/10 text-slate-300"
                        >
                          <td className="py-2.5 px-3">
                            {new Date(s.sulama_tarihi).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="block font-medium text-slate-200">
                              Ada {s.ada || '-'} Parsel {s.parsel || '-'}
                            </span>
                            <span className="block text-[10px] text-slate-550">
                              {s.mahalle_koy} | {s.kanal_adi || 'Kanal Belirtilmemiş'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">{s.ad_soyad}</td>
                          <td className="py-2.5 px-3 text-right text-indigo-300 font-medium">{s.sulama_suresi_saat} sa</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-white">
                            ₺ {s.ucret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.odeme_durumu === 'Ödendi' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {s.odeme_durumu}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {s.odeme_durumu === 'Ödenmedi' && (
                              <button
                                onClick={() => handleMarkAsPaid(s.id)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition cursor-pointer"
                              >
                                Ödeme Al
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-950/20 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Toplam {ownerSlips.length} Sulama Kaydı
              </span>
              <button
                onClick={() => setSelectedOwner(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PRINT DIALOG OVERLAY (Debt Statement notification form) */}
      {showPrintNotice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 flex flex-col justify-between border border-slate-200 no-print max-h-[85vh]">
            
            {/* Display screen preview of the notice letter */}
            <div className="overflow-y-auto mb-6 pr-2">
              <div className="border border-slate-200 p-6 rounded-xl font-serif text-slate-800 text-xs bg-slate-50/50 space-y-6">
                
                {/* Header */}
                <div className="text-center pb-4 border-b border-slate-350 space-y-1">
                  <h2 className="text-sm font-extrabold uppercase text-slate-950 tracking-wider">
                    {kurumAdi.toUpperCase()}
                  </h2>
                  <h3 className="text-xs font-bold text-slate-700">ÖDEME BİLDİRİMİ VE BORÇ DETAYI</h3>
                  <p className="text-[10px] text-slate-500">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                </div>

                {/* Subtitle */}
                <div className="space-y-1 text-slate-700">
                  <p><strong>Sayın:</strong> {showPrintNotice.owner}</p>
                  <p>
                    Arazilerinizin sulama işlemlerine ait birikmiş ödenmemiş borç dökümünüz aşağıya çıkarılmıştır. 
                    En kısa süre içerisinde ilgili makamlara veya görevlilere ödeme yapılması hususunu rica ederiz.
                  </p>
                </div>

                {/* Ledger table */}
                <table className="w-full text-left border-collapse text-[10px] text-slate-800">
                  <thead>
                    <tr className="border-b-2 border-slate-400 font-bold text-slate-950 bg-slate-200/50">
                      <th className="p-1.5">Tarih</th>
                      <th className="p-1.5">Konum</th>
                      <th className="p-1.5 text-right">Süre</th>
                      <th className="p-1.5 text-right">Tutar</th>
                      <th className="p-1.5">Kanal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showPrintNotice.slips.map((s, idx) => (
                      <tr key={idx} className="border-b border-slate-300">
                        <td className="p-1.5">{new Date(s.sulama_tarihi).toLocaleDateString('tr-TR')}</td>
                        <td className="p-1.5">Ada {s.ada || '-'} Parsel {s.parsel || '-'} ({s.mahalle_koy})</td>
                        <td className="p-1.5 text-right">{s.sulama_suresi_saat} sa</td>
                        <td className="p-1.5 text-right font-semibold">₺ {s.ucret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-1.5">{s.kanal_adi || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total */}
                <div className="flex justify-end pr-4 text-xs font-bold text-slate-950">
                  <span>TOPLAM BORÇ TUTARI: ₺ {showPrintNotice.slips.reduce((acc, curr) => acc + curr.ucret, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px] text-slate-700">
                  <div>
                    <span className="block font-bold">Düzenleyen Görevli</span>
                    <span className="block h-12"></span>
                    <span className="block text-slate-500">İmza</span>
                  </div>
                  <div>
                    <span className="block font-bold">Tebliğ Alan Alıcı</span>
                    <span className="block h-12"></span>
                    <span className="block text-slate-500">İmza</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex space-x-2.5 pt-4 border-t border-slate-100 bg-white">
              <button
                onClick={handlePrint}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Bildirimi Yazdır</span>
              </button>
              <button
                onClick={() => setShowPrintNotice(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-4 rounded-xl transition cursor-pointer"
              >
                Kapat
              </button>
            </div>

          </div>

          {/* PRINT ONLY SECTION - Styled for A4 / Standard paper printers */}
          <div id="notice-print" className="hidden print:block fixed inset-0 bg-white text-black p-10 text-xs font-serif leading-relaxed w-full min-h-screen">
            <div className="max-w-3xl mx-auto space-y-8">
              
              {/* Header */}
              <div className="text-center pb-6 border-b border-black space-y-1.5">
                <h1 className="text-lg font-bold uppercase tracking-wider">{kurumAdi}</h1>
                <h2 className="text-sm font-bold">ÖDEME BİLDİRİMİ VE BORÇ DETAYI</h2>
                <p className="text-xs">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
              </div>

              {/* Recipient info */}
              <div className="space-y-2 text-sm">
                <p><strong>Sayın:</strong> {showPrintNotice.owner}</p>
                <p>
                  Arazilerinizde gerçekleştirilen tarımsal sulama işlemlerine ait ödenmemiş borç kayıtlarınızın dökümü aşağıda sunulmuştur. 
                  En kısa süre içerisinde borcun kapatılması için ödeme yapılması hususunu rica ederiz.
                </p>
              </div>

              {/* Table */}
              <table className="w-full text-left border-collapse text-xs my-6">
                <thead>
                  <tr className="border-b-2 border-black font-bold bg-slate-100">
                    <th className="p-2 border border-slate-400">Tarih</th>
                    <th className="p-2 border border-slate-400">Mülk Konumu</th>
                    <th className="p-2 border border-slate-400 text-right">Süre</th>
                    <th className="p-2 border border-slate-400 text-right">Tutar</th>
                    <th className="p-2 border border-slate-400">Görevli</th>
                    <th className="p-2 border border-slate-400">Kanal</th>
                  </tr>
                </thead>
                <tbody>
                  {showPrintNotice.slips.map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-300">
                      <td className="p-2 border border-slate-400">{new Date(s.sulama_tarihi).toLocaleDateString('tr-TR')}</td>
                      <td className="p-2 border border-slate-400">Ada {s.ada || '-'} Parsel {s.parsel || '-'} ({s.mahalle_koy})</td>
                      <td className="p-2 border border-slate-400 text-right">{s.sulama_suresi_saat} sa</td>
                      <td className="p-2 border border-slate-400 text-right font-bold">₺ {s.ucret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 border border-slate-400">{s.ad_soyad}</td>
                      <td className="p-2 border border-slate-400">{s.kanal_adi || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div className="flex justify-end text-sm font-extrabold border-t border-black pt-4">
                <span>TOPLAM BORÇ TUTARI: ₺ {showPrintNotice.slips.reduce((acc, curr) => acc + curr.ucret, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Instruction */}
              <div className="pt-4 text-xs italic">
                * Bu bildirim sulama birliği otomasyon sistemi tarafından otomatik olarak üretilmiştir.
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 pt-16 text-center text-xs">
                <div>
                  <span className="block font-bold">Tebliğ Eden Görevli</span>
                  <span className="block h-16"></span>
                  <span className="block border-t border-black w-32 mx-auto mt-2">İmza</span>
                </div>
                <div>
                  <span className="block font-bold">Tebliğ Alan Alıcı</span>
                  <span className="block h-16"></span>
                  <span className="block border-t border-black w-32 mx-auto mt-2">İmza</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
