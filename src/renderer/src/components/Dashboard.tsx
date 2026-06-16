import React, { useEffect, useState } from 'react'
import { Droplet, Users, MapPin, Receipt, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface DashboardStats {
  totalTasinmaz: number
  totalGorevli: number
  totalHours: number
  totalUcret: number
  unpaidCount: number
  unpaidAmount: number
}

interface RecentSlip {
  id: number
  tapu_sahibi: string
  ad_soyad: string
  sulama_tarihi: string
  sulama_suresi_saat: number
  ucret: number
  odeme_durumu: string
}

interface CanalChartData {
  kanal_adi: string
  total_hours: number
}

export default function Dashboard(): React.JSX.Element {
  const [stats, setStats] = useState<DashboardStats>({
    totalTasinmaz: 0,
    totalGorevli: 0,
    totalHours: 0,
    totalUcret: 0,
    unpaidCount: 0,
    unpaidAmount: 0
  })

  const [recentSlips, setRecentSlips] = useState<RecentSlip[]>([])
  const [chartData, setChartData] = useState<CanalChartData[]>([])

  const loadData = async (): Promise<void> => {
    try {
      // 1. Fetch counts
      const resTasinmaz = await window.api.dbQuery('SELECT COUNT(*) as count FROM tasinmazlar')
      const resGorevli = await window.api.dbQuery('SELECT COUNT(*) as count FROM gorevliler')
      
      // 2. Fetch sums
      const resSulamalar = await window.api.dbQuery(
        'SELECT SUM(sulama_suresi_saat) as total_hours, SUM(ucret) as total_ucret FROM sulamalar'
      )
      
      // 3. Fetch unpaid stats
      const resUnpaid = await window.api.dbQuery(
        "SELECT COUNT(*) as count, SUM(ucret) as total_unpaid FROM sulamalar WHERE odeme_durumu = 'Ödenmedi'"
      )

      // 4. Fetch recent 5 slips
      const resRecent = await window.api.dbQuery(`
        SELECT s.id, s.sulama_tarihi, s.sulama_suresi_saat, s.ucret, s.odeme_durumu, 
               t.tapu_sahibi, g.ad_soyad 
        FROM sulamalar s 
        JOIN tasinmazlar t ON s.tasinmaz_id = t.id 
        JOIN gorevliler g ON s.gorevli_id = g.id 
        ORDER BY s.sulama_tarihi DESC, s.id DESC 
        LIMIT 5
      `)

      // 5. Fetch canal usage for chart
      const resChart = await window.api.dbQuery(`
        SELECT COALESCE(t.kanal_adi, 'Belirtilmemiş') as canal_name, SUM(s.sulama_suresi_saat) as hours
        FROM sulamalar s
        JOIN tasinmazlar t ON s.tasinmaz_id = t.id
        GROUP BY canal_name
        ORDER BY hours DESC
        LIMIT 6
      `)

      const totalTasinmaz = resTasinmaz[0]?.count || 0
      const totalGorevli = resGorevli[0]?.count || 0
      const totalHours = Number(resSulamalar[0]?.total_hours || 0)
      const totalUcret = Number(resSulamalar[0]?.total_ucret || 0)
      const unpaidCount = resUnpaid[0]?.count || 0
      const unpaidAmount = Number(resUnpaid[0]?.total_unpaid || 0)

      setStats({
        totalTasinmaz,
        totalGorevli,
        totalHours,
        totalUcret,
        unpaidCount,
        unpaidAmount
      })

      setRecentSlips(resRecent)

      setChartData(
        resChart.map((item: any) => ({
          kanal_adi: item.canal_name,
          total_hours: Number(item.hours || 0)
        }))
      )
    } catch (e) {
      console.error('Error loading dashboard data:', e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Find max value for chart scaling
  const maxHours = Math.max(...chartData.map((d) => d.total_hours), 1)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Genel Bakış</h1>
        <p className="text-slate-400 mt-1">Sistemdeki genel istatistikler ve son işlemler.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Toplam Taşınmaz</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalTasinmaz} Adet</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Toplam Görevli</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalGorevli} Kişi</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Droplet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Toplam Sulama Süresi</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.totalHours.toFixed(1)} Saat</h3>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Toplam Tahakkuk</p>
            <h3 className="text-2xl font-bold text-white mt-1">₺ {stats.totalUcret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* Second Row Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unpaid Slips Summary */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-amber-500">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Bekleyen Alacak (Ödenmeyen Fişler)</p>
              <h3 className="text-xl font-bold text-white mt-1">{stats.unpaidCount} Adet Fiş</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Toplam Tutar</p>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1">₺ {stats.unpaidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Paid Slips Summary */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border-l-4 border-emerald-500">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Tahsil Edilen (Ödenen Fişler)</p>
              <h3 className="text-xl font-bold text-white mt-1">
                {(stats.totalUcret > 0 ? ((stats.totalUcret - stats.unpaidAmount) / stats.totalUcret * 100) : 0).toFixed(0)}% Tahsilat Oranı
              </h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Tahsil Edilen Tutar</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">
              ₺ {(stats.totalUcret - stats.unpaidAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Recent Slips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Kanallara Göre Sulama</h3>
            <p className="text-xs text-slate-400 mb-6">En çok sulanan su kanalları ve saatleri.</p>
            
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
                Veri bulunmuyor
              </div>
            ) : (
              <div className="space-y-4">
                {chartData.map((item, idx) => {
                  const percent = (item.total_hours / maxHours) * 100
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-300">{item.kanal_adi}</span>
                        <span className="text-indigo-400">{item.total_hours.toFixed(1)} sa</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 border-t border-slate-800/80 pt-4 mt-6">
            Grafik toplam sulama saatlerini yansıtır.
          </div>
        </div>

        {/* Recent Slips List */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-1">Son Fiş Girişleri</h3>
          <p className="text-xs text-slate-400 mb-4">Sisteme kaydedilen son 5 sulama kaydı.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Tarih</th>
                  <th className="py-3 px-2">Tapu Sahibi</th>
                  <th className="py-3 px-2">Görevli</th>
                  <th className="py-3 px-2 text-right">Süre (Saat)</th>
                  <th className="py-3 px-2 text-right">Ücret</th>
                  <th className="py-3 px-2 text-center">Durum</th>
                </tr>
              </thead>
              <tbody>
                {recentSlips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">
                      Kayıtlı sulama fişi bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  recentSlips.map((slip) => (
                    <tr key={slip.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 text-sm text-slate-300 transition">
                      <td className="py-3 px-2 whitespace-nowrap">
                        {new Date(slip.sulama_tarihi).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-2 font-medium text-white">{slip.tapu_sahibi}</td>
                      <td className="py-3 px-2">{slip.ad_soyad}</td>
                      <td className="py-3 px-2 text-right text-indigo-300">{slip.sulama_suresi_saat} sa</td>
                      <td className="py-3 px-2 text-right font-medium">
                        ₺ {slip.ucret.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          slip.odeme_durumu === 'Ödendi' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {slip.odeme_durumu}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
