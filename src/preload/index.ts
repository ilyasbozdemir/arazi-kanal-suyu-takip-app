import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  dbQuery: (sql: string, params: any[] = []) => ipcRenderer.invoke('db:query', { sql, params }),
  dbRun: (sql: string, params: any[] = []) => ipcRenderer.invoke('db:run', { sql, params }),
  createNewFile: () => ipcRenderer.invoke('file:new'),
  openFile: (pathToCheck?: string) => ipcRenderer.invoke('file:open', pathToCheck),
  saveFile: () => ipcRenderer.invoke('file:save'),
  closeFile: () => ipcRenderer.invoke('file:close'),
  getRecentFiles: () => ipcRenderer.invoke('file:recent-get'),
  removeRecentFile: (filePath: string) => ipcRenderer.invoke('file:recent-remove', filePath),
  onFileStatus: (callback: (status: { filePath: string | null; isDirty: boolean }) => void) => {
    const listener = (_event: any, status: any) => callback(status)
    ipcRenderer.on('file-status', listener)
    return () => {
      ipcRenderer.removeListener('file-status', listener)
    }
  },

  // Auto-updater functions
  checkUpdates: () => ipcRenderer.invoke('file:check-updates'),
  restartAndInstall: () => ipcRenderer.invoke('file:restart-and-install'),
  sendBackup: () => ipcRenderer.invoke('file:send-backup'),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  exitApp: () => ipcRenderer.invoke('app:exit'),
  onUpdateAvailable: (callback: (info: any) => void) => {
    const listener = (_event: any, info: any) => callback(info)
    ipcRenderer.on('update-available', listener)
    return () => {
      ipcRenderer.removeListener('update-available', listener)
    }
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    const listener = (_event: any, info: any) => callback(info)
    ipcRenderer.on('update-downloaded', listener)
    return () => {
      ipcRenderer.removeListener('update-downloaded', listener)
    }
  },
  onUpdateNotAvailable: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('update-not-available', listener)
    return () => {
      ipcRenderer.removeListener('update-not-available', listener)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
