import { ElectronAPI } from '@electron-toolkit/preload'

export interface FileStatus {
  filePath: string | null
  isDirty: boolean
}

export interface RecentFile {
  path: string
  name: string
  openedAt: string
}

export interface AppApi {
  dbQuery: (sql: string, params?: any[]) => Promise<any[]>
  dbRun: (sql: string, params?: any[]) => Promise<{ lastInsertRowid: number; changes: number }>
  createNewFile: () => Promise<{ success: boolean; filePath?: string; error?: string }>
  openFile: (pathToCheck?: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
  saveFile: () => Promise<{ success: boolean; error?: string }>
  closeFile: () => Promise<{ success: boolean }>
  getRecentFiles: () => Promise<RecentFile[]>
  removeRecentFile: (filePath: string) => Promise<void>
  onFileStatus: (callback: (status: FileStatus) => void) => () => void
  
  // Auto-updater functions
  checkUpdates: () => Promise<any>
  restartAndInstall: () => Promise<void>
  onUpdateAvailable: (callback: (info: any) => void) => () => void
  onUpdateDownloaded: (callback: (info: any) => void) => () => void
  onUpdateNotAvailable: (callback: () => void) => () => void

  // Manual SMTP backup trigger
  sendBackup: () => Promise<{ success: boolean; error?: string }>

  getAppVersion: () => Promise<string>
  exitApp: () => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppApi
  }
}
