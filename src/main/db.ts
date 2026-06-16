import Database from 'better-sqlite3'
import { initializeDatabase } from './database'
import { runMigrations, CURRENT_SCHEMA_VERSION } from './database/migrate'

let db: Database.Database | null = null

export function connectDatabase(dbPath: string): void {
  if (db) {
    try {
      db.close()
    } catch (e) {
      console.error('Error closing database:', e)
    }
  }

  db = new Database(dbPath)
  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Check if this is a new database by checking if 'ayarlar' table exists
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ayarlar'").get()
  
  if (!tableCheck) {
    // New database: initialize schema from scratch
    console.log('Yeni veritabanı oluşturuluyor...')
    initializeDatabase(db, 'Arazi Kanal Suyu Takip Programı')
  } else {
    // Existing database: check version and run migrations
    try {
      const versionRow: any = db.prepare("SELECT deger FROM ayarlar WHERE anahtar='dbSchemaVersion'").get()
      const currentVersion = versionRow ? parseInt(versionRow.deger, 10) : 0
      
      if (currentVersion < CURRENT_SCHEMA_VERSION) {
        console.log(`Veritabanı güncelleniyor. Mevcut Sürüm: ${currentVersion}, Hedef Sürüm: ${CURRENT_SCHEMA_VERSION}`)
        runMigrations(db, currentVersion)
      } else {
        console.log(`Veritabanı sürümü güncel (Sürüm: ${currentVersion})`)
      }
    } catch (e) {
      console.error('Migration sırasında hata:', e)
      // If ayarlar table is corrupt or old version format, try to run migrations from 0
      runMigrations(db, 0)
    }
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function isConnected(): boolean {
  return db !== null
}

export function query(sql: string, params: any[] = []): any[] {
  if (!db) throw new Error('Veritabanı bağlı değil')
  const stmt = db.prepare(sql)
  return stmt.all(...params)
}

export function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  if (!db) throw new Error('Veritabanı bağlı değil')
  const stmt = db.prepare(sql)
  const result = stmt.run(...params)
  return {
    lastInsertRowid: Number(result.lastInsertRowid),
    changes: result.changes
  }
}
