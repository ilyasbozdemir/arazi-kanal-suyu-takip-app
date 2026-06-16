import { app, dialog, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import AdmZip from 'adm-zip'
import { connectDatabase, closeDatabase, query } from './db'
import { sendBackupEmail, SmtpConfig } from './email'

let activeFilePath: string | null = null
let tempDir: string | null = null
let tempDbPath: string | null = null
let isDirty = false

const RECENT_FILES_PATH = path.join(app.getPath('userData'), 'recent-files.json')

export function getActiveFilePath(): string | null {
  return activeFilePath
}

export function getIsDirty(): boolean {
  return isDirty
}

export function setDirty(state: boolean): void {
  isDirty = state
}

// Read SMTP credentials from SQLite ayarlar table
export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    const rows = query(
      "SELECT * FROM ayarlar WHERE anahtar IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_to', 'smtp_enabled')"
    )
    const config: any = {}
    rows.forEach((row: any) => {
      config[row.anahtar] = row.deger
    })

    if (
      config.smtp_enabled === '1' &&
      config.smtp_host &&
      config.smtp_port &&
      config.smtp_user &&
      config.smtp_pass &&
      config.smtp_to
    ) {
      return {
        host: config.smtp_host,
        port: Number(config.smtp_port),
        user: config.smtp_user,
        pass: config.smtp_pass,
        to: config.smtp_to
      }
    }
    return null
  } catch (e) {
    console.error('Error reading SMTP configuration from database:', e)
    return null
  }
}

// Show SMTP backup prompt when closing file
export async function promptSmtpBackup(win: BrowserWindow): Promise<boolean> {
  if (!activeFilePath) return true

  const smtpConfig = await getSmtpConfig()
  if (!smtpConfig) return true // SMTP not configured/enabled, skip warning and proceed

  const result = await dialog.showMessageBox(win, {
    type: 'question',
    buttons: ['E-posta Gönder ve Kapat', 'Göndermeden Kapat', 'İptal'],
    title: 'E-posta ile Yedekle',
    message: 'Dosya kapatılırken e-posta ile yedek göndermek ister misiniz?',
    cancelId: 2,
    defaultId: 0
  })

  if (result.response === 0) {
    // 1. Save changes to package first
    await saveFile()

    // 2. Send the email using nodemailer stream-based path
    const emailResult = await sendBackupEmail(activeFilePath, smtpConfig)
    if (emailResult.success) {
      await dialog.showMessageBox(win, {
        type: 'info',
        title: 'Yedekleme Başarılı',
        message: 'Veritabanı yedeği başarıyla e-posta ile gönderildi.'
      })
      return true
    } else {
      const retryResult = await dialog.showMessageBox(win, {
        type: 'error',
        buttons: ['Yeniden Dene', 'Yine de Kapat', 'İptal'],
        title: 'Yedekleme Hatası',
        message: `E-posta gönderilirken hata oluştu: ${emailResult.error}\nNe yapmak istersiniz?`
      })
      if (retryResult.response === 0) {
        return promptSmtpBackup(win) // Retry
      } else if (retryResult.response === 1) {
        return true // Close anyway
      } else {
        return false // Cancel close
      }
    }
  } else if (result.response === 1) {
    return true // Proceed to close without sending
  } else {
    return false // Cancel close
  }
}

// Get recent files list
export async function getRecentFiles(): Promise<{ path: string; name: string; openedAt: string }[]> {
  try {
    if (!fs.existsSync(RECENT_FILES_PATH)) {
      return []
    }
    const data = fs.readFileSync(RECENT_FILES_PATH, 'utf-8')
    const files = JSON.parse(data)
    // Filter out files that no longer exist on disk
    const existingFiles = files.filter((f: any) => fs.existsSync(f.path))
    if (existingFiles.length !== files.length) {
      fs.writeFileSync(RECENT_FILES_PATH, JSON.stringify(existingFiles, null, 2))
    }
    return existingFiles
  } catch (e) {
    console.error('Error reading recent files:', e)
    return []
  }
}

// Add a file to recent files
export async function addRecentFile(filePath: string): Promise<void> {
  try {
    const files = await getRecentFiles()
    const name = path.basename(filePath)
    const openedAt = new Date().toISOString()

    // Remove if already exists to move to top
    const filtered = files.filter((f) => f.path !== filePath)
    filtered.unshift({ path: filePath, name, openedAt })

    // Keep max 10 files
    const limited = filtered.slice(0, 10)
    fs.writeFileSync(RECENT_FILES_PATH, JSON.stringify(limited, null, 2))
  } catch (e) {
    console.error('Error adding recent file:', e)
  }
}

// Remove a file from recent files
export async function removeRecentFile(filePath: string): Promise<void> {
  try {
    const files = await getRecentFiles()
    const filtered = files.filter((f) => f.path !== filePath)
    fs.writeFileSync(RECENT_FILES_PATH, JSON.stringify(filtered, null, 2))
  } catch (e) {
    console.error('Error removing recent file:', e)
  }
}

// Setup temp paths
function ensureTempPath(): void {
  if (!tempDir) {
    const id = Date.now().toString()
    tempDir = path.join(app.getPath('temp'), `asut_temp_${id}`)
    fs.mkdirSync(tempDir, { recursive: true })
    tempDbPath = path.join(tempDir, 'data.db')
  }
}

// Close active file and cleanup
export async function closeActiveFile(): Promise<void> {
  closeDatabase()

  if (tempDir && fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true })
    } catch (e) {
      console.error('Error deleting temp folder:', e)
    }
  }

  activeFilePath = null
  tempDir = null
  tempDbPath = null
  isDirty = false
}

// Create new file
export async function createNewFile(win: BrowserWindow): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const result = await dialog.showSaveDialog(win, {
    title: 'Yeni Takip Dosyası Oluştur',
    defaultPath: path.join(app.getPath('documents'), 'AraziTakip.asut'),
    filters: [{ name: 'Arazi Takip Dosyası (*.asut)', extensions: ['asut'] }]
  })

  if (result.canceled || !result.filePath) {
    return { success: false }
  }

  const targetPath = result.filePath

  try {
    // 1. Close any active file
    await closeActiveFile()

    // 2. Setup temp path
    ensureTempPath()

    // 3. Connect DB (which automatically runs migrations on empty DB)
    connectDatabase(tempDbPath!)

    // 4. Create initial ZIP package
    const zip = new AdmZip()
    zip.addLocalFile(tempDbPath!)
    zip.writeZip(targetPath)

    activeFilePath = targetPath
    isDirty = false

    await addRecentFile(targetPath)

    return { success: true, filePath: targetPath }
  } catch (e: any) {
    console.error('Error creating file:', e)
    return { success: false, error: e.message }
  }
}

// Open existing file
export async function openFile(win: BrowserWindow, pathToCheck?: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
  let targetPath = pathToCheck

  if (!targetPath) {
    const result = await dialog.showOpenDialog(win, {
      title: 'Takip Dosyası Aç',
      filters: [{ name: 'Arazi Takip Dosyası (*.asut)', extensions: ['asut'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false }
    }

    targetPath = result.filePaths[0]
  }

  try {
    // 1. Close any active file
    await closeActiveFile()

    // 2. Setup temp path
    ensureTempPath()

    // 3. Unpack database from ZIP
    const zip = new AdmZip(targetPath)
    const entries = zip.getEntries()
    const dbEntry = entries.find((e) => e.entryName === 'data.db')

    if (!dbEntry) {
      throw new Error('Dosya formatı geçersiz: data.db bulunamadı.')
    }

    zip.extractEntryTo(dbEntry, tempDir!, false, true)

    // 4. Connect database
    connectDatabase(tempDbPath!)

    activeFilePath = targetPath
    isDirty = false

    await addRecentFile(targetPath)

    return { success: true, filePath: targetPath }
  } catch (e: any) {
    console.error('Error opening file:', e)
    return { success: false, error: e.message }
  }
}

// Save active file
export async function saveFile(): Promise<{ success: boolean; error?: string }> {
  if (!activeFilePath || !tempDbPath) {
    return { success: false, error: 'Açık bir dosya yok' }
  }

  try {
    const zip = new AdmZip()
    zip.addLocalFile(tempDbPath)
    zip.writeZip(activeFilePath)

    isDirty = false
    return { success: true }
  } catch (e: any) {
    console.error('Error saving file:', e)
    return { success: false, error: e.message }
  }
}

// Show unsaved changes dialog if dirty
export async function promptUnsavedChanges(win: BrowserWindow): Promise<'save' | 'dontsave' | 'cancel'> {
  if (!isDirty) return 'dontsave'

  const result = await dialog.showMessageBox(win, {
    type: 'warning',
    buttons: ['Kaydet', 'Kaydetme', 'İptal'],
    title: 'Kaydedilmemiş Değişiklikler',
    message: `${path.basename(activeFilePath || '')} dosyasında kaydedilmemiş değişiklikler var. Kaydetmek istiyor musunuz?`,
    cancelId: 2,
    defaultId: 0
  })

  if (result.response === 0) {
    const saveRes = await saveFile()
    if (saveRes.success) {
      return 'save'
    } else {
      dialog.showErrorBox('Kayıt Hatası', saveRes.error || 'Dosya kaydedilemedi.')
      return 'cancel'
    }
  } else if (result.response === 1) {
    return 'dontsave'
  } else {
    return 'cancel'
  }
}
