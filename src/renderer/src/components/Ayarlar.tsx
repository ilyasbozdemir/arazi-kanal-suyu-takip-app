import React, { useState, useEffect } from 'react'
import {
  Save,
  Image,
  Moon,
  Sun,
  Building,
  Trash2,
  CheckCircle2,
  Mail,
  Lock,
  Server,
  Play,
  X,
  Download,
  Upload
} from 'lucide-react'

interface AyarlarProps {
  onSettingsSaved: (settings: { name: string; logo: string | null; theme: string }) => void
}

export default function Ayarlar({ onSettingsSaved }: AyarlarProps): React.JSX.Element {
  const [name, setName] = useState('')
  const [birim, setBirim] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [theme, setTheme] = useState('dark')
  const [suUcretleriRaw, setSuUcretleriRaw] = useState('150, 200, 250')
  const [suUcretleri, setSuUcretleri] = useState<string[]>(['150', '200', '250'])
  const [varsayilanSaatUcreti, setVarsayilanSaatUcreti] = useState('150')

  // Channels list state
  const [suKanallari, setSuKanallari] = useState<string[]>(['Ana Kanal'])
  const [newChannelName, setNewChannelName] = useState('')

  // SMTP Settings State
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpTo, setSmtpTo] = useState('')
  const [smtpEnabled, setSmtpEnabled] = useState(0) // 1 for active, 0 for passive

  const [saving, setSaving] = useState(false)
  const [testingSmtp, setTestingSmtp] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null)

  const loadSettings = async (): Promise<void> => {
    try {
      const dbSettings = await window.api.dbQuery('SELECT * FROM ayarlar')

      let dbName = ''
      let dbBirim = ''
      let dbLogo: string | null = null
      let dbTheme = localStorage.getItem('tema') || 'dark'

      let host = ''
      let port = '587'
      let user = ''
      let pass = ''
      let to = ''
      let enabled = 0

      let dbChannels: string[] = ['Ana Kanal']
      let dbSuUcretleri: string[] = ['150', '200', '250']
      let dbVarsayilanSaatUcreti = '150'

      dbSettings.forEach((setting: any) => {
        if (setting.anahtar === 'kurum_adi') dbName = setting.deger
        if (setting.anahtar === 'kurum_birim') dbBirim = setting.deger
        if (setting.anahtar === 'kurum_logo') dbLogo = setting.deger
        if (setting.anahtar === 'tema') dbTheme = setting.deger
        if (setting.anahtar === 'su_kanallari' && setting.deger) {
          try {
            dbChannels = JSON.parse(setting.deger)
          } catch (e) {
            dbChannels = setting.deger.split(',').filter(Boolean)
          }
        }
        if (setting.anahtar === 'su_ucretleri' && setting.deger) {
          try {
            dbSuUcretleri = JSON.parse(setting.deger)
          } catch (e) {
            dbSuUcretleri = setting.deger.split(',').filter(Boolean)
          }
        }
        if (setting.anahtar === 'varsayilan_saat_ucreti' && setting.deger) {
          dbVarsayilanSaatUcreti = setting.deger
        }

        if (setting.anahtar === 'smtp_host') host = setting.deger
        if (setting.anahtar === 'smtp_port') port = setting.deger
        if (setting.anahtar === 'smtp_user') user = setting.deger
        if (setting.anahtar === 'smtp_pass') pass = setting.deger
        if (setting.anahtar === 'smtp_to') to = setting.deger
        if (setting.anahtar === 'smtp_enabled') enabled = Number(setting.deger || 0)
      })

      setName(dbName || 'Arazi Kanal Suyu Takip Programı')
      setBirim(dbBirim || 'Tarımsal Sulama Hizmetleri')
      setLogo(dbLogo)
      setTheme(dbTheme)
      setSuKanallari(dbChannels)
      setSuUcretleri(dbSuUcretleri)
      setSuUcretleriRaw(dbSuUcretleri.join(', '))
      setVarsayilanSaatUcreti(dbVarsayilanSaatUcreti)

      setSmtpHost(host)
      setSmtpPort(port)
      setSmtpUser(user)
      setSmtpPass(pass)
      setSmtpTo(to)
      setSmtpEnabled(enabled)
    } catch (e) {
      console.error('Error loading settings:', e)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setLogo(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = (): void => {
    setLogo(null)
  }

  const handleSuUcretleriChange = (val: string) => {
    setSuUcretleriRaw(val)
    const list = val
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '' && !isNaN(Number(s)))
    setSuUcretleri(list.length > 0 ? list : ['150'])
  }

  const handleAddChannel = () => {
    const clean = newChannelName.trim()
    if (!clean) return
    if (suKanallari.includes(clean)) {
      alert('Bu kanal zaten tanımlı!')
      return
    }
    setSuKanallari([...suKanallari, clean])
    setNewChannelName('')
  }

  const handleRemoveChannel = (channel: string) => {
    if (suKanallari.length <= 1) {
      alert('En az bir adet su kanalı tanımlı olmalıdır!')
      return
    }
    const filtered = suKanallari.filter((c) => c !== channel)
    setSuKanallari(filtered)
  }

  const handleThemeToggle = (newTheme: 'dark' | 'light'): void => {
    setTheme(newTheme)

    if (newTheme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    localStorage.setItem('tema', newTheme)
  }

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')
    setTestResult(null)

    try {
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('kurum_adi', ?)",
        [name.trim()]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('kurum_birim', ?)",
        [birim.trim() || 'Tarımsal Sulama Hizmetleri']
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('kurum_logo', ?)",
        [logo || '']
      )
      await window.api.dbRun("INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('tema', ?)", [
        theme
      ])
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('fis_giris_yontemi', ?)",
        ['hizli'] // Force fast entry method as option 1 is disabled
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('su_kanallari', ?)",
        [JSON.stringify(suKanallari)]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('su_ucretleri', ?)",
        [JSON.stringify(suUcretleri)]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('varsayilan_saat_ucreti', ?)",
        [varsayilanSaatUcreti]
      )

      // SMTP
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('smtp_host', ?)",
        [smtpHost.trim()]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('smtp_port', ?)",
        [smtpPort.trim()]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('smtp_user', ?)",
        [smtpUser.trim()]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('smtp_pass', ?)",
        [smtpPass.trim()]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('smtp_to', ?)",
        [smtpTo.trim()]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('smtp_enabled', ?)",
        [smtpEnabled.toString()]
      )

      onSettingsSaved({
        name: name.trim() || 'Arazi Kanal Suyu Takip Programı',
        logo,
        theme
      })

      setSuccessMsg('Tüm ayarlar başarıyla veritabanına kaydedildi.')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (e: any) {
      console.error('Error saving settings:', e)
      alert('Ayarlar kaydedilirken hata oluştu: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTestSmtp = async (): Promise<void> => {
    setTestingSmtp(true)
    setTestResult(null)
    setSuccessMsg('')

    try {
      // First save current inputs to database so main process reads the newest values
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('smtp_host', ?)",
        [smtpHost.trim()]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('smtp_port', ?)",
        [smtpPort.trim()]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('smtp_user', ?)",
        [smtpUser.trim()]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('smtp_pass', ?)",
        [smtpPass.trim()]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('smtp_to', ?)",
        [smtpTo.trim()]
      )
      await window.api.dbRun(
        "INSERT OR REPLACE INTO ayarlar (anahtar, deger) VALUES ('smtp_enabled', ?)",
        [smtpEnabled.toString()]
      )

      const res = await window.api.sendBackup()
      if (res.success) {
        setTestResult({
          success: true,
          msg: 'Yedek e-postası başarıyla gönderildi! Lütfen alıcı posta kutusunu kontrol edin.'
        })
      } else {
        setTestResult({ success: false, msg: 'Hata: ' + (res.error || 'Bilinmeyen SMTP hatası') })
      }
    } catch (e: any) {
      console.error(e)
      setTestResult({ success: false, msg: 'Hata: ' + (e.message || e) })
    } finally {
      setTestingSmtp(false)
    }
  }

  const handleExportSmtpTemplate = () => {
    const template = {
      smtp_host: '[SMTP_ADDRESS]',
      smtp_port: '[PORT]',
      smtp_user: '[EMAIL_ADDRESS]',
      smtp_pass: '[PASSWORD]',
      smtp_secure: '[SECURE_CONNECTION_TYPE]',
      backup_email: '[EMAIL_ADDRESS]'
    }
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'asut_smtp_sablonu.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportSmtpTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.smtp_host && data.smtp_host !== '[SMTP_ADDRESS]') setSmtpHost(data.smtp_host)
        if (data.smtp_port && data.smtp_port !== '[PORT]') setSmtpPort(data.smtp_port.toString())
        if (data.smtp_user && data.smtp_user !== '[EMAIL_ADDRESS]') setSmtpUser(data.smtp_user)
        if (data.smtp_pass && data.smtp_pass !== '[PASSWORD]') setSmtpPass(data.smtp_pass)
        if (data.backup_email && data.backup_email !== '[EMAIL_ADDRESS]')
          setSmtpTo(data.backup_email)

        if (data.smtp_host && data.smtp_host !== '[SMTP_ADDRESS]') {
          setSmtpEnabled(1)
        }

        setSuccessMsg('SMTP şablonu başarıyla içe aktarıldı, kaydetmeyi unutmayın.')
        setTimeout(() => setSuccessMsg(''), 4000)
      } catch (err) {
        alert('Hatalı şablon dosyası! Lütfen geçerli bir JSON şablonu yükleyin.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Ayarlar</h1>
        <p className="text-slate-400 mt-1">
          Tema, kurum tanımları ve SMTP e-posta yedekleme parametreleri.
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <form onSubmit={handleSave} className="space-y-6 text-sm">
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Theme Settings */}
          <div className="space-y-3 pb-6 border-b border-slate-800/80">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Arayüz Teması
            </h3>
            <p className="text-xs text-slate-500">Uygulamanın renk şemasını değiştirin.</p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleThemeToggle('dark')}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl border font-semibold transition cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                    : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="h-4.5 w-4.5" />
                <span>Koyu Tema</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeToggle('light')}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl border font-semibold transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/15'
                    : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="h-4.5 w-4.5" />
                <span>Açık Tema</span>
              </button>
            </div>
          </div>

          {/* Fiş Giriş Yöntemi */}
          <div className="space-y-3 pb-6 border-b border-slate-800/80">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Fiş Giriş Yöntemi
            </h3>
            <p className="text-xs text-slate-500">
              Sulamalar ekranında kayıt yaparken mülk/kişi seçiminin nasıl yapılacağını belirleyin.
            </p>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                disabled
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-white/5 font-semibold bg-slate-900/10 text-slate-500 opacity-50 cursor-not-allowed"
                title="Bu yöntem devre dışı bırakılmıştır."
              >
                <span>1 - Taşınmaza Göre (Açılır Liste) [Pasif]</span>
              </button>

              <button
                type="button"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-indigo-500 font-semibold bg-indigo-600 text-white shadow-lg shadow-indigo-600/15 cursor-default"
              >
                <span>2 - Su Bekçisinden Gelen Fişe Göre (Ada-Parsel Örn: 250-5) [Aktif]</span>
              </button>
            </div>
          </div>

          {/* Tarife ve Su Ücreti Ayarları */}
          <div className="space-y-4 pb-6 border-b border-slate-800/80">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Tarife ve Su Ücreti Ayarları
            </h3>
            <p className="text-xs text-slate-500">
              Sulamalarda kullanılacak saatlik su ücretlerini tanımlayın ve varsayılan tarifeyi seçin.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                  Saatlik Ücret Seçenekleri (₺)
                </label>
                <input
                  type="text"
                  placeholder="Örn: 150, 200, 250"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-semibold"
                  value={suUcretleriRaw}
                  onChange={(e) => handleSuUcretleriChange(e.target.value)}
                />
                <span className="text-[10px] text-slate-500">
                  Birden fazla fiyatı araya virgül koyarak tanımlayın.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider block">
                  Varsayılan Seçili Ücret
                </label>
                <select
                  title="Varsayılan Saatlik Ücret"
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-200 cursor-pointer"
                  value={varsayilanSaatUcreti}
                  onChange={(e) => setVarsayilanSaatUcreti(e.target.value)}
                >
                  {suUcretleri.map((ucret) => (
                    <option key={ucret} className="bg-slate-950 text-slate-200" value={ucret}>
                      ₺{ucret}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500">
                  Yeni fiş açıldığında otomatik seçilecek olan tarife.
                </span>
              </div>
            </div>
          </div>

          {/* Institution Name & Birim */}
          <div className="space-y-4 pb-6 border-b border-slate-800/80">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Kurum / Kooperatif Adı
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Arayüz başlıklarında ve yazdırılan fişlerde görüntülenecek kurum ismi.
              </p>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Örn: Akçaören Tarımsal Sulama Birliği"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Kurum Alt Başlığı / Birim Adı
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Fişlerde kurum adının altında görünecek birim/departman tanımı (örn: Tarımsal Sulama Hizmetleri).
              </p>
              <input
                type="text"
                placeholder="Örn: Tarımsal Sulama Hizmetleri"
                className="w-full px-4 py-2.5 rounded-xl glass-input font-medium"
                value={birim}
                onChange={(e) => setBirim(e.target.value)}
              />
            </div>
          </div>

          {/* Institution Logo */}
          <div className="space-y-3 pb-6 border-b border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Kurum Logosu (Görsel)
            </label>
            <p className="text-xs text-slate-500">
              Uygulama açılışında ve sol menüde görüntülenecek logo (Maks: 1MB).
            </p>

            <div className="flex items-center space-x-6 bg-slate-900/20 p-4 border border-white/5 rounded-2xl">
              <div className="h-20 w-20 bg-slate-950/60 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                {logo ? (
                  <img src={logo} alt="Kurum Logosu" className="h-full w-full object-contain" />
                ) : (
                  <Image className="h-8 w-8 text-slate-600" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex space-x-2">
                  <label className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-200 border border-white/10 hover:border-white/20 rounded-xl cursor-pointer transition">
                    <span>Görsel Seç</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                  {logo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-400 rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Logoyu Kaldır</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Su Kanalları Listesi */}
          <div className="space-y-3 pb-6 border-b border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Su Kanalları / Su Kaynakları
            </label>
            <p className="text-xs text-slate-500">
              Sistemde kullanılacak su kanallarını tanımlayın. Taşınmaz arazileri kaydederken
              buradan seçilecektir.
            </p>

            {/* List of channels */}
            <div className="flex flex-wrap gap-2 py-1">
              {suKanallari.map((chan, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 border border-white/5 rounded-xl text-xs text-slate-205"
                >
                  <span>{chan}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChannel(chan)}
                    className="p-0.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded transition cursor-pointer animate-fadeIn"
                    title="Kanalı Sil"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add channel form */}
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Örn: Sol Sahil Kanalı"
                className="flex-1 px-3 py-2 rounded-xl glass-input text-xs"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddChannel()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddChannel}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* SMTP Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  E-posta ile Otomatik Yedekleme
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dosya kapatılırken veritabanı yedeğini SMTP ile e-posta adresinize gönderin.
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    smtpEnabled === 1
                      ? 'bg-indigo-505/15 bg-indigo-600 border-indigo-500 text-white shadow'
                      : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700'
                  }`}
                  onClick={() => setSmtpEnabled(1)}
                >
                  Aktif
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    smtpEnabled === 0
                      ? 'bg-rose-500/15 text-rose-450 bg-rose-600 border-rose-500 text-white shadow'
                      : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700'
                  }`}
                  onClick={() => setSmtpEnabled(0)}
                >
                  Pasif
                </button>
              </div>
            </div>

            {smtpEnabled === 1 && (
              <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-5 space-y-4 animate-fadeIn">
                {testResult && (
                  <div
                    className={`p-3 border rounded-xl text-xs ${
                      testResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}
                  >
                    {testResult.msg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* SMTP Server */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      SMTP Sunucu Adresi
                    </label>
                    <div className="relative">
                      <Server className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Örn: smtp.gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        required={smtpEnabled === 1}
                      />
                    </div>
                  </div>

                  {/* SMTP Port */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      placeholder="Örn: 587 veya 465"
                      className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-mono"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      required={smtpEnabled === 1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SMTP User */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Kullanıcı Adı (E-posta)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        placeholder="Örn: cooperatif@gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        required={smtpEnabled === 1}
                      />
                    </div>
                  </div>

                  {/* SMTP Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      E-posta Şifresi (veya Uygulama Şifresi)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        required={smtpEnabled === 1}
                      />
                    </div>
                  </div>
                </div>

                {/* Recipient Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Yedeğin Gönderileceği Alıcı E-posta
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      placeholder="Örn: yedekler@mail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-input text-xs"
                      value={smtpTo}
                      onChange={(e) => setSmtpTo(e.target.value)}
                      required={smtpEnabled === 1}
                    />
                  </div>
                </div>

                {/* Test Action */}
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={testingSmtp || !smtpHost || !smtpUser || !smtpPass || !smtpTo}
                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {testingSmtp ? (
                      <span>E-posta Gönderiliyor...</span>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        <span>Şimdi Test E-postası Gönder (Yedek Al)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportSmtpTemplate}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>Şablon İndir</span>
                  </button>

                  <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    <Upload className="h-3 w-3" />
                    <span>Şablondan İçe Aktar</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportSmtpTemplate}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Save Action */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/10"
            >
              <Save className="h-4.5 w-4.5" />
              <span>{saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
