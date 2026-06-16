import { app, shell, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import path from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'

import { query, run } from './db'
import { sendBackupEmail } from './email'
import {
  createNewFile,
  openFile,
  saveFile,
  closeActiveFile,
  getRecentFiles,
  removeRecentFile,
  getActiveFilePath,
  getIsDirty,
  setDirty,
  promptUnsavedChanges,
  getSmtpConfig,
  promptSmtpBackup
} from './fileManager'

let mainWindow: BrowserWindow | null = null

function updateWindowTitle(): void {
  if (!mainWindow) return

  const filePath = getActiveFilePath()
  const isDirty = getIsDirty()

  if (filePath) {
    const fileName = path.basename(filePath)
    mainWindow.setTitle(`${fileName}${isDirty ? ' *' : ''} - Arazi Kanal Suyu Takip Programı`)
  } else {
    mainWindow.setTitle('Arazi Kanal Suyu Takip Programı')
  }
}

function sendFileStatus(): void {
  if (!mainWindow) return
  updateWindowTitle()
  mainWindow.webContents.send('file-status', {
    filePath: getActiveFilePath(),
    isDirty: getIsDirty()
  })
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000', // transparent
      symbolColor: nativeTheme.shouldUseDarkColors ? '#ffffff' : '#000000', 
      height: 36 // h-9 equivalent
    },
    title: 'Arazi Kanal Suyu Takip Programı',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    sendFileStatus()

    // Run auto-updates check in production package
    if (app.isPackaged) {
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify()
      }, 5000)
    }

    // Handle open file from args if any
    const args = process.argv
    const fileArg = args.find((arg) => arg.endsWith('.asut') && fs.existsSync(arg))
    if (fileArg) {
      openFile(mainWindow!, fileArg).then((res) => {
        if (res.success) {
          sendFileStatus()
        }
      })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.on('close', async (e) => {
    if (mainWindow) {
      e.preventDefault()
      
      if (getIsDirty()) {
        const action = await promptUnsavedChanges(mainWindow)
        if (action === 'cancel') return
      }

      // Trigger SMTP backup prompt first
      const proceed = await promptSmtpBackup(mainWindow)
      if (!proceed) return

      await closeActiveFile()
      mainWindow.destroy()
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()

      const fileArg = commandLine.find((arg) => arg.endsWith('.asut') && fs.existsSync(arg))
      if (fileArg) {
        const openAndSend = (): void => {
          openFile(mainWindow!, fileArg).then((res) => {
            if (res.success) {
              sendFileStatus()
            }
          })
        }

        if (getIsDirty()) {
          promptUnsavedChanges(mainWindow).then((action) => {
            if (action !== 'cancel') {
              openAndSend()
            }
          })
        } else {
          openAndSend()
        }
      }
    }
  })

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.kanal-suyu-takibi')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register Database IPC Handlers
  ipcMain.handle('db:query', async (_event, { sql, params }) => {
    try {
      return query(sql, params)
    } catch (e: any) {
      console.error('SQL query error:', e)
      throw e
    }
  })

  ipcMain.handle('db:run', async (_event, { sql, params }) => {
    try {
      const result = run(sql, params)
      setDirty(true)
      sendFileStatus()
      return result
    } catch (e: any) {
      console.error('SQL run error:', e)
      throw e
    }
  })

  // Register File IPC Handlers
  ipcMain.handle('file:new', async () => {
    if (!mainWindow) return { success: false, error: 'Ana pencere mevcut değil' }

    if (getIsDirty()) {
      const action = await promptUnsavedChanges(mainWindow)
      if (action === 'cancel') return { success: false }
    }

    const result = await createNewFile(mainWindow)
    sendFileStatus()
    return result
  })

  ipcMain.handle('file:open', async (_event, pathToCheck?: string) => {
    if (!mainWindow) return { success: false, error: 'Ana pencere mevcut değil' }

    if (getIsDirty()) {
      const action = await promptUnsavedChanges(mainWindow)
      if (action === 'cancel') return { success: false }
    }

    const result = await openFile(mainWindow, pathToCheck)
    sendFileStatus()
    return result
  })

  ipcMain.handle('file:save', async () => {
    const result = await saveFile()
    sendFileStatus()
    return result
  })

  ipcMain.handle('file:close', async () => {
    if (!mainWindow) return { success: false }

    if (getIsDirty()) {
      const action = await promptUnsavedChanges(mainWindow)
      if (action === 'cancel') return { success: false }
    }

    const proceed = await promptSmtpBackup(mainWindow)
    if (!proceed) return { success: false }

    await closeActiveFile()
    sendFileStatus()
    return { success: true }
  })

  ipcMain.handle('file:recent-get', async () => {
    return getRecentFiles()
  })

  ipcMain.handle('file:recent-remove', async (_event, filePath) => {
    await removeRecentFile(filePath)
    return
  })

  ipcMain.handle('app:version', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:exit', () => {
    mainWindow?.close()
  })

  ipcMain.handle('app:set-theme', (_event, theme: 'light' | 'dark') => {
    if (mainWindow) {
      if (theme === 'light') {
        mainWindow.setTitleBarOverlay({ color: '#00000000', symbolColor: '#000000' })
      } else {
        mainWindow.setTitleBarOverlay({ color: '#00000000', symbolColor: '#ffffff' })
      }
    }
  })

  // Manual SMTP backup email trigger
  ipcMain.handle('file:send-backup', async () => {
    const filePath = getActiveFilePath()
    if (!filePath) return { success: false, error: 'Açık dosya yok' }

    // Save changes first
    await saveFile()

    const smtpConfig = await getSmtpConfig()
    if (!smtpConfig) return { success: false, error: 'SMTP ayarları eksik veya yedekleme e-postası aktif değil.' }

    return sendBackupEmail(filePath, smtpConfig)
  })

  // Auto-updater Handlers
  ipcMain.handle('file:check-updates', async () => {
    if (app.isPackaged) {
      try {
        return await autoUpdater.checkForUpdates()
      } catch (e) {
        console.error('Error checking updates:', e)
        throw e
      }
    }
    return { versionInfo: { version: app.getVersion() } }
  })

  ipcMain.handle('file:restart-and-install', async () => {
    autoUpdater.quitAndInstall()
  })

  // Auto-updater Listeners
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info)
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-not-available')
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-downloaded', info)
  })

  autoUpdater.on('error', (err) => {
    console.error('AutoUpdater error:', err)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
}

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
