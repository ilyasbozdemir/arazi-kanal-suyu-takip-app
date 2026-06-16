import React, { useState, useEffect } from 'react'
import {
  Coins,
  Clock,
  Printer,
  Layers,
  MapPin,
  ClipboardList,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface KisiProfilProps {
  ownerName: string
}

interface Slip {
  id: number
  sulama_tarihi: string
  sulama_suresi_saat: number
  ucret: number
  odeme_durumu: string
  aciklama?: string
  mahalle_koy: string
  ada: string
  parsel: string
  kanal_adi: string
  ad_soyad: string
}

interface Property {
  id: number
  tapu_sahibi: string
  ada: string
  parsel: string
  alan_m2: number
  mahalle_koy: string
  kanal_adi: string
  aciklama?: string
  mevki?: string
  su_hakki?: string
}

// Reuse print layout function for individual slips
const renderA5ReceiptContent = (s: any, logo: string | null, name: string) => {
  return (
    <div className="space-y-4 font-sans text-xs text-black leading-relaxed bg-white p-2">
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

      <div className="text-center bg-slate-100 py-1.5 border border-slate-300 rounded">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-black">
          SULAMA HİZMET / TESLİM FİŞİ
        </span>
      </div>

      <table className="w-full text-left border-collapse border border-black text-[10px] font-sans">
        <tbody>
          <tr className="border-b border-black">
            <td className="p-2 bg-slate-50 font-bold border-r border-black w-1/3">FİŞ NO:</td>
            <td className="p-2 font-mono font-bold text-black">#000{s.id}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-2 bg-slate-50 font-bold border-r border-black">TAPU SAHİBİ / MALİK:</td>
            <td className="p-2 font-bold text-black uppercase">{s.tapu_sahibi || s.ownerName}</td>
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

      {s.aciklama && (
        <div className="border border-slate-350 p-2 rounded bg-slate-50 text-[9px]">
          <strong className="block text-slate-800">Açıklama / Not:</strong>
          <p className="text-slate-700 mt-0.5">{s.aciklama}</p>
        </div>
      )}

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

      <div className="text-center text-[8px] text-slate-450 pt-4 border-t border-dashed border-slate-300 mt-4 font-mono">
        <p>Bu fiş otomasyon sistemi üzerinden üretilmiştir. Bilgi amaçlıdır.</p>
      </div>
    </div>
  )
}

export default function KisiProfil({ ownerName }: KisiProfilProps): React.JSX.Element {
  const [slips, setSlips] = useState<Slip[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [kurumAdi, setKurumAdi] = useState('Arazi Kanal Suyu Takip Programı')
  const [kurumLogo, setKurumLogo] = useState<string | null>(null)

  const [printingSlip, setPrintingSlip] = useState<Slip | null>(null)
  const [showDebtStatementModal, setShowDebtStatementModal] = useState(false)

  const loadData = async (): Promise<void> => {
    try {
      // Load slips for this owner
      const slipsData = await window.api.dbQuery(
        `
        SELECT s.id, s.sulama_tarihi, s.sulama_suresi_saat, s.ucret, s.odeme_durumu, s.aciklama,
               t.mahalle_koy, t.ada, t.parsel, t.kanal_adi,
               g.ad_soyad
        FROM sulamalar s
        JOIN tasinmazlar t ON s.tasinmaz_id = t.id
        JOIN gorevliler g ON s.gorevli_id = g.id
        WHERE LOWER(TRIM(t.tapu_sahibi)) = LOWER(TRIM(?))
        ORDER BY s.sulama_tarihi DESC, s.id DESC
        `,
        [ownerName]
      )
      setSlips(slipsData)

      // Load properties for this owner
      const propsData = await window.api.dbQuery(
        `
        SELECT * FROM tasinmazlar
        WHERE LOWER(TRIM(tapu_sahibi)) = LOWER(TRIM(?))
        ORDER BY ada ASC, parsel ASC
        `,
        [ownerName]
      )
      setProperties(propsData)

      // Load institution info
      const nameSetting = await window.api.dbQuery(
        "SELECT deger FROM ayarlar WHERE anahtar = 'kurum_adi'"
      )
      if (nameSetting && nameSetting[0]?.deger) {
        setKurumAdi(nameSetting[0].deger)
      }

      const logoSetting = await window.api.dbQuery(
        "SELECT deger FROM ayarlar WHERE anahtar = 'kurum_logo'"
      )
      if (logoSetting && logoSetting[0]?.deger) {
        setKurumLogo(logoSetting[0].deger)
      }
    } catch (e) {
      console.error('Error loading profile data:', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [ownerName])

  // Mark specific slip as paid
  const handleMarkAsPaid = async (id: number): Promise<void> => {
    try {
      await window.api.dbRun("UPDATE sulamalar SET odeme_durumu = 'Ödendi' WHERE id = ?", [id])
      await loadData()
    } catch (e) {
      console.error('Error marking slip as paid:', e)
      alert('İşlem sırasında hata oluştu.')
    }
  }

  // Mark all unpaid slips as paid
  const handlePayAllDebt = async (): Promise<void> => {
    const unpaid = slips.filter((s) => s.odeme_durumu === 'Ödenmedi')
    if (unpaid.length === 0) return

    const confirm = window.confirm(
      `Bu kişiye ait ödenmemiş tüm borçları (${unpaid.length} adet fiş) ödendi olarak işaretlemek istediğinize emin misiniz?`
    )
    if (!confirm) return

    try {
      const ids = unpaid.map((s) => s.id)
      for (const id of ids) {
        await window.api.dbRun("UPDATE sulamalar SET odeme_durumu = 'Ödendi' WHERE id = ?", [id])
      }
      await loadData()
      alert('Tüm borçlar başarıyla kapatıldı.')
    } catch (e) {
      console.error('Error paying all debt:', e)
      alert('Toplu ödeme sırasında hata oluştu.')
    }
  }

  // Calculate statistics
  const totalSlips = slips.length
  const totalHours = slips.reduce((sum, s) => sum + s.sulama_suresi_saat, 0)
  const totalCost = slips.reduce((sum, s) => sum + s.ucret, 0)
  const totalPaid = slips.filter((s) => s.odeme_durumu === 'Ödendi').reduce((sum, s) => sum + s.ucret, 0)
  const totalUnpaid = slips.filter((s) => s.odeme_durumu === 'Ödenmedi').reduce((sum, s) => sum + s.ucret, 0)

  const handlePrintA5Receipt = (slip: Slip) => {
    setPrintingSlip(slip)
    setTimeout(() => {
      window.print()
    }, 150)
  }

  const handlePrintStatement = () => {
    setShowDebtStatementModal(true)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Profile Box */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">KİŞİ DOSYASI</span>
          <h1 className="text-2xl font-bold text-white mt-1 uppercase">{ownerName}</h1>
          <p className="text-slate-400 text-xs mt-1">
            Malikin arazi varlığı ve sulama/ödeme geçmiş dökümü.
          </p>
        </div>

        <div className="flex gap-2">
          {totalUnpaid > 0 && (
            <button
              onClick={handlePayAllDebt}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-600/15"
            >
              <Coins className="h-4 w-4" />
              <span>Tüm Borcu Kapat</span>
            </button>
          )}

          <button
            onClick={handlePrintStatement}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Borç Ekstresi Yazdır</span>
          </button>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Toplam Fiş */}
        <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 uppercase font-bold block">Toplam Fiş</span>
            <span className="text-lg font-extrabold text-white">{totalSlips} adet</span>
          </div>
        </div>

        {/* Toplam Süre */}
        <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 uppercase font-bold block">Toplam Süre</span>
            <span className="text-lg font-extrabold text-white">{totalHours.toFixed(1)} sa</span>
          </div>
        </div>

        {/* Toplam Ücret */}
        <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-slate-500/10 text-slate-300 rounded-lg">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 uppercase font-bold block">Toplam Tutar</span>
            <span className="text-lg font-extrabold text-white">₺{totalCost.toLocaleString('tr-TR')}</span>
          </div>
        </div>

        {/* Ödenen Borç */}
        <div className="glass-card p-4 rounded-xl flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 uppercase font-bold block">Ödenen</span>
            <span className="text-lg font-extrabold text-emerald-400">₺{totalPaid.toLocaleString('tr-TR')}</span>
          </div>
        </div>

        {/* Kalan Borç */}
        <div className="glass-card p-4 rounded-xl flex items-center space-x-3 col-span-2 lg:col-span-1 border border-amber-500/10">
          <div className={`p-2.5 rounded-lg ${totalUnpaid > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-450'}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 uppercase font-bold block">Kalan Borç</span>
            <span className={`text-lg font-extrabold ${totalUnpaid > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              ₺{totalUnpaid.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Left Panel: Registered Lands */}
        <div className="glass-card p-5 rounded-2xl h-fit space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-400" />
            Kayıtlı Taşınmaz Varlığı ({properties.length})
          </h3>

          {properties.length === 0 ? (
            <div className="text-center py-6 text-slate-550 text-xs">
              Bu kişi adına tanımlı taşınmaz bulunamadı.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
              {properties.map((p) => (
                <div key={p.id} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span className="font-mono text-indigo-300">Ada/Parsel: {p.ada}-{p.parsel}</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {p.mahalle_koy || 'Bilinmeyen Mahalle'}{p.mevki ? ` (${p.mevki})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 flex-wrap gap-y-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-600" />
                      Kanal: {p.kanal_adi || '-'}
                    </span>
                    <span>Alan: {p.alan_m2 > 0 ? `${p.alan_m2} m²` : '-'}</span>
                  </div>
                  {p.su_hakki && (
                    <div className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded w-fit uppercase tracking-wider">
                      Su Hakkı: {p.su_hakki}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Right Panel: Slips history logs */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl flex flex-col">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-indigo-400" />
            Sulama Kayıtları ve Fiş Geçmişi
          </h3>

          {slips.length === 0 ? (
            <div className="text-center py-12 text-slate-550 text-xs">
              Sulama geçmişine dair kayıt bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto w-full text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-2">Tarih</th>
                    <th className="py-2.5 px-2">Konum (Fiş-Seri)</th>
                    <th className="py-2.5 px-2 text-right">Süre (Sa)</th>
                    <th className="py-2.5 px-2 text-right">Ücret</th>
                    <th className="py-2.5 px-2 text-center">Ödeme</th>
                    <th className="py-2.5 px-2 text-right">Aksiyonlar</th>
                  </tr>
                </thead>
                <tbody>
                  {slips.map((s) => (
                    <tr key={s.id} className="border-b border-slate-800/40 hover:bg-slate-800/5 text-slate-300">
                      <td className="py-2 px-2 text-[11px] whitespace-nowrap">
                        {new Date(s.sulama_tarihi).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-2 px-2 font-semibold text-slate-200">
                        {s.ada || '-'}-{s.parsel || '-'}
                      </td>
                      <td className="py-2 px-2 text-right text-cyan-400 font-medium">{s.sulama_suresi_saat} sa</td>
                      <td className="py-2 px-2 text-right font-bold text-white">₺{s.ucret}</td>
                      <td className="py-2 px-2 text-center">
                        <span
                           className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            s.odeme_durumu === 'Ödendi'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/10'
                          }`}
                        >
                          {s.odeme_durumu}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right space-x-1.5 whitespace-nowrap">
                        {s.odeme_durumu === 'Ödenmedi' && (
                          <button
                            onClick={() => handleMarkAsPaid(s.id)}
                            className="bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer"
                          >
                            Ödeme Al
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintA5Receipt(s)}
                          title="Faturayı Yazdır"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded transition cursor-pointer inline-flex items-center justify-center align-middle"
                        >
                          <Printer className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 5. Print Modal (A5 Receipt mockup layout for individual printing) */}
      {printingSlip && (
        <div className="print-only hidden w-full bg-white text-black">
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
              }
            }
          `}</style>
          {renderA5ReceiptContent(printingSlip, kurumLogo, kurumAdi)}
        </div>
      )}

      {/* 6. Print Modal (A4 Statement / Notice mockup layout for printing ledger) */}
      {showDebtStatementModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm no-print">
          <div className="bg-white text-black rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-slate-200 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
              <h3 className="text-sm font-bold text-slate-850">Borç Ekstresi Önizleme (A4)</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  <Printer className="h-4 w-4" />
                  <span>Ekstreyi Yazdır (A4)</span>
                </button>
                <button
                  onClick={() => setShowDebtStatementModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>

            {/* Modal Content / A4 Statement */}
            <div className="p-8 md:p-12 font-serif leading-relaxed bg-white print-content">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .print-content, .print-content * {
                    visibility: visible;
                  }
                  .print-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}</style>
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center pb-4 border-b-2 border-black space-y-1">
                  <h1 className="text-base font-extrabold uppercase tracking-wider">{kurumAdi}</h1>
                  <h2 className="text-xs font-bold text-slate-700">ÖDEME BİLDİRİMİ VE BORÇ DETAYI</h2>
                  <p className="text-[10px] text-slate-500">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                </div>

                {/* Recipient info */}
                <div className="space-y-1.5 text-xs">
                  <p>
                    <strong>Sayın:</strong> {ownerName}
                  </p>
                  <p>
                    Arazilerinizde gerçekleştirilen tarımsal sulama işlemlerine ait ödenmiş/ödenmemiş tüm kayıtlarınızın dökümü, ödeme durumları ve kayıtlı taşınmaz varlığınız aşağıda sunulmuştur.
                  </p>
                </div>

                {/* Registered Properties Table in Printout */}
                {properties.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-800 border-b border-black pb-1 uppercase tracking-wider">Kayıtlı Taşınmaz Varlığı</h3>
                    <table className="w-full text-left border-collapse text-[10px] border border-slate-300">
                      <thead>
                        <tr className="border-b border-black font-bold bg-slate-150">
                          <th className="p-1.5 border border-slate-350">Ada/Parsel</th>
                          <th className="p-1.5 border border-slate-350">Mahalle/Köy</th>
                          <th className="p-1.5 border border-slate-350">Mevki</th>
                          <th className="p-1.5 border border-slate-350 text-right">Alan (m²)</th>
                          <th className="p-1.5 border border-slate-350">Kanal Adı</th>
                          <th className="p-1.5 border border-slate-350">Su Hakkı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {properties.map((p) => (
                          <tr key={p.id} className="border-b border-slate-300">
                            <td className="p-1.5 border border-slate-300 font-mono">{p.ada || '-'}-{p.parsel || '-'}</td>
                            <td className="p-1.5 border border-slate-300">{p.mahalle_koy || '-'}</td>
                            <td className="p-1.5 border border-slate-300">{p.mevki || '-'}</td>
                            <td className="p-1.5 border border-slate-300 text-right">{p.alan_m2 > 0 ? p.alan_m2.toLocaleString('tr-TR') : '-'}</td>
                            <td className="p-1.5 border border-slate-300">{p.kanal_adi || '-'}</td>
                            <td className="p-1.5 border border-slate-300 font-bold">{p.su_hakki || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <h3 className="text-xs font-bold text-slate-800 border-b border-black pb-1 uppercase tracking-wider pt-2">Sulama ve Fiş Kayıtları Dökümü</h3>

                {/* Table */}
                <table className="w-full text-left border-collapse text-[10px] my-4 border border-slate-350">
                  <thead>
                    <tr className="border-b-2 border-black font-bold bg-slate-100">
                      <th className="p-2 border border-slate-300">Tarih</th>
                      <th className="p-2 border border-slate-300">Konum (Ada-Parsel)</th>
                      <th className="p-2 border border-slate-300 text-right">Süre (Saat)</th>
                      <th className="p-2 border border-slate-300 text-right">Tutar</th>
                      <th className="p-2 border border-slate-300 text-center">Ödeme Durumu</th>
                      <th className="p-2 border border-slate-300">Görevli (Merav)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slips.map((s) => (
                      <tr key={s.id} className="border-b border-slate-300">
                        <td className="p-2 border border-slate-300">
                          {new Date(s.sulama_tarihi).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="p-2 border border-slate-300 font-mono">
                          {s.ada || '-'}-{s.parsel || '-'} ({s.mahalle_koy})
                        </td>
                        <td className="p-2 border border-slate-300 text-right">{s.sulama_suresi_saat} sa</td>
                        <td className="p-2 border border-slate-300 text-right font-bold">
                          ₺{s.ucret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-2 border border-slate-300 text-center font-bold ${s.odeme_durumu === 'Ödendi' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {s.odeme_durumu}
                        </td>
                        <td className="p-2 border border-slate-300">{s.ad_soyad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="flex justify-end text-[10px] font-extrabold border-t-2 border-black pt-3 space-x-6">
                  <span>Toplam Tutar: ₺{totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                  <span className="text-emerald-700">Ödenen: ₺{totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                  <span className="text-amber-700">Kalan Borç: ₺{totalUnpaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 pt-12 text-center text-xs">
                  <div>
                    <span className="block font-bold">Tebliğ Eden Yetkili</span>
                    <span className="block h-12"></span>
                    <span className="block border-t border-black w-24 mx-auto mt-2">İmza</span>
                  </div>
                  <div>
                    <span className="block font-bold">Tebliğ Alan Alıcı</span>
                    <span className="block h-12"></span>
                    <span className="block border-t border-black w-24 mx-auto mt-2">İmza</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
